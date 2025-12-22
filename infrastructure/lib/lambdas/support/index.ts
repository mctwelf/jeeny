/**
 * Jeeny Support Lambda Handler
 *
 * Handles support-related operations including:
 * - Support ticket management
 * - FAQ retrieval
 * - Contact form submissions
 */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Initialize clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const SUPPORT_TICKETS_TABLE = process.env.SUPPORT_TICKETS_TABLE || 'jeeny-support-tickets';
const SETTINGS_TABLE = process.env.SETTINGS_TABLE || 'jeeny-settings';

// Response helper
const response = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
  },
  body: JSON.stringify(body),
});

// Extract user ID from JWT
const getUserIdFromEvent = (event: APIGatewayProxyEvent): string | null => {
  try {
    const claims = event.requestContext.authorizer?.claims;
    return claims?.sub || claims?.['cognito:username'] || null;
  } catch {
    return null;
  }
};

/**
 * Get support tickets for user
 */
const getTickets = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const { status, limit = '20', lastKey } = event.queryStringParameters || {};

    const params: any = {
      TableName: SUPPORT_TICKETS_TABLE,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false,
      Limit: parseInt(limit),
    };

    if (status) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues[':status'] = status;
    }

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
    }

    const result = await docClient.send(new QueryCommand(params));

    return response(200, {
      success: true,
      data: {
        tickets: result.Items || [],
        lastKey: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : null,
      },
    });
  } catch (error) {
    console.error('Error getting tickets:', error);
    return response(500, { error: 'Failed to get tickets' });
  }
};

/**
 * Create a new support ticket
 */
const createTicket = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { subject, description, category, priority = 'medium', rideId } = body;

    if (!subject || !description) {
      return response(400, { error: 'Subject and description are required' });
    }

    const ticketId = uuidv4();
    const now = new Date().toISOString();

    const ticket = {
      ticketId,
      userId,
      subject,
      description,
      category: category || 'general',
      priority,
      status: 'open',
      rideId,
      messages: [
        {
          messageId: uuidv4(),
          senderId: userId,
          senderType: 'user',
          message: description,
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: SUPPORT_TICKETS_TABLE,
        Item: ticket,
      })
    );

    return response(201, {
      success: true,
      data: ticket,
      message: 'Support ticket created successfully',
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return response(500, { error: 'Failed to create ticket' });
  }
};

/**
 * Get ticket by ID
 */
const getTicketById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const ticketId = event.pathParameters?.ticketId;
    if (!ticketId) {
      return response(400, { error: 'Ticket ID is required' });
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: SUPPORT_TICKETS_TABLE,
        Key: { ticketId },
      })
    );

    if (!result.Item) {
      return response(404, { error: 'Ticket not found' });
    }

    // Verify ownership
    if (result.Item.userId !== userId) {
      return response(403, { error: 'Access denied' });
    }

    return response(200, {
      success: true,
      data: result.Item,
    });
  } catch (error) {
    console.error('Error getting ticket:', error);
    return response(500, { error: 'Failed to get ticket' });
  }
};

/**
 * Add message to ticket
 */
const addTicketMessage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const ticketId = event.pathParameters?.ticketId;
    if (!ticketId) {
      return response(400, { error: 'Ticket ID is required' });
    }

    const body = JSON.parse(event.body || '{}');
    const { message } = body;

    if (!message) {
      return response(400, { error: 'Message is required' });
    }

    const now = new Date().toISOString();
    const newMessage = {
      messageId: uuidv4(),
      senderId: userId,
      senderType: 'user',
      message,
      createdAt: now,
    };

    await docClient.send(
      new UpdateCommand({
        TableName: SUPPORT_TICKETS_TABLE,
        Key: { ticketId },
        UpdateExpression: 'SET messages = list_append(messages, :msg), updatedAt = :now',
        ConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':msg': [newMessage],
          ':now': now,
          ':userId': userId,
        },
      })
    );

    return response(200, {
      success: true,
      data: newMessage,
      message: 'Message added successfully',
    });
  } catch (error: any) {
    console.error('Error adding message:', error);
    if (error.name === 'ConditionalCheckFailedException') {
      return response(403, { error: 'Access denied' });
    }
    return response(500, { error: 'Failed to add message' });
  }
};

/**
 * Get FAQs
 */
const getFAQs = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { category, language = 'ar' } = event.queryStringParameters || {};

    // Static FAQs for now - should come from database in production
    const faqs = [
      {
        id: '1',
        category: 'rides',
        question: {
          ar: 'كيف يمكنني طلب رحلة؟',
          en: 'How do I request a ride?',
          fr: 'Comment puis-je demander un trajet?',
        },
        answer: {
          ar: 'افتح التطبيق، أدخل وجهتك، اختر نوع السيارة، ثم اضغط على طلب رحلة.',
          en: 'Open the app, enter your destination, choose a vehicle type, then tap request ride.',
          fr: 'Ouvrez l\'application, entrez votre destination, choisissez un type de véhicule, puis appuyez sur demander un trajet.',
        },
      },
      {
        id: '2',
        category: 'payments',
        question: {
          ar: 'ما هي طرق الدفع المتاحة؟',
          en: 'What payment methods are available?',
          fr: 'Quels modes de paiement sont disponibles?',
        },
        answer: {
          ar: 'نقبل الدفع نقداً، محفظة جيني، بنكيلي، سداد، ومصرفي.',
          en: 'We accept cash, Jeeny wallet, Bankily, Sedad, and Masrvi.',
          fr: 'Nous acceptons les espèces, le portefeuille Jeeny, Bankily, Sedad et Masrvi.',
        },
      },
      {
        id: '3',
        category: 'account',
        question: {
          ar: 'كيف يمكنني تغيير رقم هاتفي؟',
          en: 'How can I change my phone number?',
          fr: 'Comment puis-je changer mon numéro de téléphone?',
        },
        answer: {
          ar: 'اتصل بدعم العملاء لتغيير رقم هاتفك المسجل.',
          en: 'Contact customer support to change your registered phone number.',
          fr: 'Contactez le support client pour changer votre numéro de téléphone enregistré.',
        },
      },
    ];

    let filteredFaqs = faqs;
    if (category) {
      filteredFaqs = faqs.filter((faq) => faq.category === category);
    }

    // Format response based on language
    const formattedFaqs = filteredFaqs.map((faq) => ({
      id: faq.id,
      category: faq.category,
      question: faq.question[language as keyof typeof faq.question] || faq.question.ar,
      answer: faq.answer[language as keyof typeof faq.answer] || faq.answer.ar,
    }));

    return response(200, {
      success: true,
      data: formattedFaqs,
    });
  } catch (error) {
    console.error('Error getting FAQs:', error);
    return response(500, { error: 'Failed to get FAQs' });
  }
};

/**
 * Submit contact form
 */
const submitContact = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, email, phone, subject, message } = body;

    if (!name || !message) {
      return response(400, { error: 'Name and message are required' });
    }

    if (!email && !phone) {
      return response(400, { error: 'Email or phone is required' });
    }

    const contactId = uuidv4();
    const now = new Date().toISOString();

    const contact = {
      ticketId: contactId,
      type: 'contact_form',
      name,
      email,
      phone,
      subject: subject || 'Contact Form Submission',
      description: message,
      status: 'open',
      priority: 'medium',
      category: 'contact',
      messages: [
        {
          messageId: uuidv4(),
          senderId: 'guest',
          senderType: 'guest',
          message,
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: SUPPORT_TICKETS_TABLE,
        Item: contact,
      })
    );

    return response(201, {
      success: true,
      data: { contactId },
      message: 'Thank you for contacting us. We will get back to you soon.',
      messageAr: 'شكراً لتواصلك معنا. سنرد عليك قريباً.',
    });
  } catch (error) {
    console.error('Error submitting contact:', error);
    return response(500, { error: 'Failed to submit contact form' });
  }
};

/**
 * Main handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { httpMethod, path, resource } = event;

  try {
    // Tickets
    if (path.match(/\/support\/tickets\/?$/) || resource === '/support/tickets') {
      if (httpMethod === 'GET') return getTickets(event);
      if (httpMethod === 'POST') return createTicket(event);
    }

    // Single ticket
    if (path.match(/\/support\/tickets\/[^/]+\/?$/) || resource === '/support/tickets/{ticketId}') {
      if (httpMethod === 'GET') return getTicketById(event);
    }

    // Ticket messages
    if (path.match(/\/support\/tickets\/[^/]+\/messages\/?$/) || resource === '/support/tickets/{ticketId}/messages') {
      if (httpMethod === 'GET') return getTicketById(event); // Returns ticket with messages
      if (httpMethod === 'POST') return addTicketMessage(event);
    }

    // FAQs
    if (path.match(/\/support\/faq\/?$/) || resource === '/support/faq') {
      if (httpMethod === 'GET') return getFAQs(event);
    }

    // Contact form
    if (path.match(/\/support\/contact\/?$/) || resource === '/support/contact') {
      if (httpMethod === 'POST') return submitContact(event);
    }

    // Base support endpoint
    if (path.match(/\/support\/?$/) || resource === '/support') {
      return response(200, {
        success: true,
        data: {
          message: 'Jeeny Support Service',
          endpoints: [
            'GET /support/tickets - Get your support tickets',
            'POST /support/tickets - Create a new ticket',
            'GET /support/tickets/{ticketId} - Get ticket details',
            'POST /support/tickets/{ticketId}/messages - Add message to ticket',
            'GET /support/faq - Get FAQs',
            'POST /support/contact - Submit contact form',
          ],
        },
      });
    }

    return response(404, { error: 'Not found' });
  } catch (error) {
    console.error('Unhandled error:', error);
    return response(500, { error: 'Internal server error' });
  }
};
