/**
 * Jeeny Support Service - Cloud Run
 *
 * Handles support operations using Firestore.
 * Replaces AWS Lambda support handler.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirestoreDb } from '../../lib/firebase';
import { sendSuccess, sendPaginated, badRequest, notFound, serverError, unauthorized, forbidden } from '../../lib/response';
import { authenticate, optionalAuth, requireRole } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase
initializeFirebase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Collections
const SUPPORT_TICKETS_COLLECTION = 'supportTickets';

// Types
interface SupportTicket {
  ticketId: string;
  userId?: string;
  type: 'ticket' | 'contact_form';
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  rideId?: string;
  messages: TicketMessage[];
  assignedTo?: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

interface TicketMessage {
  messageId: string;
  senderId: string;
  senderType: 'user' | 'agent' | 'guest';
  message: string;
  createdAt: Date;
}

// Static FAQs
const FAQS = [
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
  {
    id: '4',
    category: 'rides',
    question: {
      ar: 'كيف يمكنني إلغاء رحلة؟',
      en: 'How can I cancel a ride?',
      fr: 'Comment puis-je annuler un trajet?',
    },
    answer: {
      ar: 'يمكنك إلغاء الرحلة من شاشة الرحلة الحالية قبل وصول السائق.',
      en: 'You can cancel the ride from the current ride screen before the driver arrives.',
      fr: 'Vous pouvez annuler le trajet depuis l\'écran du trajet en cours avant l\'arrivée du chauffeur.',
    },
  },
  {
    id: '5',
    category: 'drivers',
    question: {
      ar: 'كيف يمكنني التسجيل كسائق؟',
      en: 'How can I register as a driver?',
      fr: 'Comment puis-je m\'inscrire en tant que chauffeur?',
    },
    answer: {
      ar: 'قم بتحميل تطبيق السائق، أكمل التسجيل، وارفع المستندات المطلوبة للتحقق.',
      en: 'Download the driver app, complete registration, and upload required documents for verification.',
      fr: 'Téléchargez l\'application chauffeur, complétez l\'inscription et téléchargez les documents requis pour vérification.',
    },
  },
];

// Routes

/**
 * GET /tickets
 * Get user's support tickets
 */
app.get('/tickets', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { status, limit = '20', cursor } = req.query;

    let query = db.collection(SUPPORT_TICKETS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string));

    if (status) {
      query = query.where('status', '==', status);
    }

    if (cursor) {
      const cursorDoc = await db.collection(SUPPORT_TICKETS_COLLECTION).doc(cursor as string).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const tickets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return sendPaginated(res, tickets, {
      total: tickets.length,
      page: 1,
      limit: parseInt(limit as string),
      hasMore: snapshot.docs.length === parseInt(limit as string),
      nextCursor: lastDoc?.id,
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    return serverError(res, 'Failed to get tickets', 'فشل الحصول على التذاكر');
  }
});

/**
 * POST /tickets
 * Create a new support ticket
 */
app.post('/tickets', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { subject, description, category, priority = 'medium', rideId } = req.body;

    if (!subject || !description) {
      return badRequest(res, 'Subject and description are required', 'الموضوع والوصف مطلوبان');
    }

    const ticketId = uuidv4();
    const now = new Date();

    const ticket: SupportTicket = {
      ticketId,
      userId,
      type: 'ticket',
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

    await db.collection(SUPPORT_TICKETS_COLLECTION).doc(ticketId).set(ticket);

    return sendSuccess(res, ticket, 'Support ticket created successfully', 'تم إنشاء تذكرة الدعم بنجاح', 201);
  } catch (error) {
    console.error('Create ticket error:', error);
    return serverError(res, 'Failed to create ticket', 'فشل إنشاء التذكرة');
  }
});

/**
 * GET /tickets/:ticketId
 * Get ticket by ID
 */
app.get('/tickets/:ticketId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { ticketId } = req.params;
    const userId = req.user!.uid;

    const ticketDoc = await db.collection(SUPPORT_TICKETS_COLLECTION).doc(ticketId).get();

    if (!ticketDoc.exists) {
      return notFound(res, 'Ticket not found', 'التذكرة غير موجودة');
    }

    const ticket = ticketDoc.data() as SupportTicket;

    // Verify ownership (unless admin)
    if (ticket.userId !== userId && req.user!.role !== 'admin' && req.user!.role !== 'employee') {
      return forbidden(res, 'Access denied', 'الوصول مرفوض');
    }

    return sendSuccess(res, { ...ticket, id: ticketDoc.id });
  } catch (error) {
    console.error('Get ticket error:', error);
    return serverError(res);
  }
});

/**
 * POST /tickets/:ticketId/messages
 * Add message to ticket
 */
app.post('/tickets/:ticketId/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { ticketId } = req.params;
    const userId = req.user!.uid;
    const { message } = req.body;

    if (!message) {
      return badRequest(res, 'Message is required', 'الرسالة مطلوبة');
    }

    const ticketRef = db.collection(SUPPORT_TICKETS_COLLECTION).doc(ticketId);
    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) {
      return notFound(res, 'Ticket not found', 'التذكرة غير موجودة');
    }

    const ticket = ticketDoc.data() as SupportTicket;

    // Verify ownership (unless admin/employee)
    const isStaff = req.user!.role === 'admin' || req.user!.role === 'employee';
    if (ticket.userId !== userId && !isStaff) {
      return forbidden(res, 'Access denied', 'الوصول مرفوض');
    }

    const now = new Date();
    const newMessage: TicketMessage = {
      messageId: uuidv4(),
      senderId: userId,
      senderType: isStaff ? 'agent' : 'user',
      message,
      createdAt: now,
    };

    await ticketRef.update({
      messages: [...ticket.messages, newMessage],
      updatedAt: now,
      status: isStaff ? 'in_progress' : ticket.status,
    });

    return sendSuccess(res, newMessage, 'Message added successfully', 'تمت إضافة الرسالة بنجاح');
  } catch (error) {
    console.error('Add message error:', error);
    return serverError(res, 'Failed to add message', 'فشل إضافة الرسالة');
  }
});

/**
 * PUT /tickets/:ticketId/status
 * Update ticket status (admin/employee only)
 */
app.put('/tickets/:ticketId/status', authenticate, requireRole('admin', 'employee'), async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return badRequest(res, 'Valid status is required', 'حالة صالحة مطلوبة');
    }

    const ticketRef = db.collection(SUPPORT_TICKETS_COLLECTION).doc(ticketId);
    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) {
      return notFound(res, 'Ticket not found', 'التذكرة غير موجودة');
    }

    const updates: Record<string, any> = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'resolved') {
      updates.resolvedAt = new Date();
    }

    await ticketRef.update(updates);

    return sendSuccess(res, null, 'Ticket status updated', 'تم تحديث حالة التذكرة');
  } catch (error) {
    console.error('Update ticket status error:', error);
    return serverError(res);
  }
});

/**
 * GET /faq
 * Get FAQs
 */
app.get('/faq', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { category, language = 'ar' } = req.query;

    let filteredFaqs = FAQS;
    if (category) {
      filteredFaqs = FAQS.filter(faq => faq.category === category);
    }

    // Format response based on language
    const formattedFaqs = filteredFaqs.map(faq => ({
      id: faq.id,
      category: faq.category,
      question: faq.question[language as keyof typeof faq.question] || faq.question.ar,
      answer: faq.answer[language as keyof typeof faq.answer] || faq.answer.ar,
    }));

    return sendSuccess(res, formattedFaqs);
  } catch (error) {
    console.error('Get FAQs error:', error);
    return serverError(res, 'Failed to get FAQs', 'فشل الحصول على الأسئلة الشائعة');
  }
});

/**
 * POST /contact
 * Submit contact form (no auth required)
 */
app.post('/contact', async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { name, email, phone, subject, message } = req.body;

    if (!name || !message) {
      return badRequest(res, 'Name and message are required', 'الاسم والرسالة مطلوبان');
    }

    if (!email && !phone) {
      return badRequest(res, 'Email or phone is required', 'البريد الإلكتروني أو الهاتف مطلوب');
    }

    const ticketId = uuidv4();
    const now = new Date();

    const ticket: SupportTicket = {
      ticketId,
      type: 'contact_form',
      name,
      email,
      phone,
      subject: subject || 'Contact Form Submission',
      description: message,
      category: 'contact',
      priority: 'medium',
      status: 'open',
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

    await db.collection(SUPPORT_TICKETS_COLLECTION).doc(ticketId).set(ticket);

    return sendSuccess(res, { contactId: ticketId }, 'Thank you for contacting us. We will get back to you soon.', 'شكراً لتواصلك معنا. سنرد عليك قريباً.', 201);
  } catch (error) {
    console.error('Submit contact error:', error);
    return serverError(res, 'Failed to submit contact form', 'فشل إرسال نموذج الاتصال');
  }
});

// Service info
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Jeeny Support Service',
      endpoints: [
        'GET /tickets - Get your support tickets',
        'POST /tickets - Create a new ticket',
        'GET /tickets/{ticketId} - Get ticket details',
        'POST /tickets/{ticketId}/messages - Add message to ticket',
        'GET /faq - Get FAQs',
        'POST /contact - Submit contact form',
      ],
    },
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'support' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Support service listening on port ${PORT}`);
});

export default app;
