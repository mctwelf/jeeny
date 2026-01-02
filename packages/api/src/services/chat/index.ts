/**
 * Jeeny Chat Service - Cloud Run
 *
 * Handles chat operations using Firestore.
 * Replaces AWS Lambda chat handler.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase, getFirestoreDb } from '../../lib/firebase';
import { publishMessage, TOPICS } from '../../lib/pubsub';
import { sendSuccess, sendPaginated, badRequest, notFound, serverError, unauthorized } from '../../lib/response';
import { authenticate } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase
initializeFirebase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Collections
const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';

// Types
interface Conversation {
  conversationId: string;
  participants: string[];
  type: 'ride' | 'support';
  rideId?: string;
  lastMessage?: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  message: string;
  messageType: 'text' | 'image' | 'location';
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
}

// Routes

/**
 * GET /conversations
 * Get user's conversations
 */
app.get('/conversations', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;

    const snapshot = await db.collection(CONVERSATIONS_COLLECTION)
      .where('participants', 'array-contains', userId)
      .orderBy('lastMessageAt', 'desc')
      .get();

    const conversations = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    return sendSuccess(res, conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    return serverError(res, 'Failed to get conversations', 'فشل الحصول على المحادثات');
  }
});

/**
 * POST /conversations
 * Create a new conversation
 */
app.post('/conversations', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const userId = req.user!.uid;
    const { participantId, rideId, type = 'ride' } = req.body;

    if (!participantId) {
      return badRequest(res, 'participantId is required', 'معرف المشارك مطلوب');
    }

    // Create deterministic conversation ID
    const conversationId = [userId, participantId].sort().join('#');
    const now = new Date();

    // Check if conversation already exists
    const existingDoc = await db.collection(CONVERSATIONS_COLLECTION).doc(conversationId).get();
    if (existingDoc.exists) {
      return sendSuccess(res, { ...existingDoc.data(), id: existingDoc.id });
    }

    const conversation: Conversation = {
      conversationId,
      participants: [userId, participantId],
      type,
      rideId,
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(CONVERSATIONS_COLLECTION).doc(conversationId).set(conversation);

    return sendSuccess(res, conversation, 'Conversation created', 'تم إنشاء المحادثة', 201);
  } catch (error) {
    console.error('Create conversation error:', error);
    return serverError(res);
  }
});

/**
 * GET /conversations/:conversationId
 * Get conversation by ID
 */
app.get('/conversations/:conversationId', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { conversationId } = req.params;
    const userId = req.user!.uid;

    const conversationDoc = await db.collection(CONVERSATIONS_COLLECTION).doc(conversationId).get();

    if (!conversationDoc.exists) {
      return notFound(res, 'Conversation not found', 'المحادثة غير موجودة');
    }

    const conversation = conversationDoc.data() as Conversation;

    // Verify user is a participant
    if (!conversation.participants.includes(userId)) {
      return unauthorized(res);
    }

    return sendSuccess(res, { ...conversation, id: conversationDoc.id });
  } catch (error) {
    console.error('Get conversation error:', error);
    return serverError(res);
  }
});

/**
 * GET /conversations/:conversationId/messages
 * Get messages for a conversation
 */
app.get('/conversations/:conversationId/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { conversationId } = req.params;
    const userId = req.user!.uid;
    const { limit = '50', cursor } = req.query;

    // Verify user is a participant
    const conversationDoc = await db.collection(CONVERSATIONS_COLLECTION).doc(conversationId).get();
    if (!conversationDoc.exists) {
      return notFound(res, 'Conversation not found', 'المحادثة غير موجودة');
    }

    const conversation = conversationDoc.data() as Conversation;
    if (!conversation.participants.includes(userId)) {
      return unauthorized(res);
    }

    let query = db.collection(MESSAGES_COLLECTION)
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string));

    if (cursor) {
      const cursorDoc = await db.collection(MESSAGES_COLLECTION).doc(cursor as string).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const messages = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return sendSuccess(res, {
      messages: messages.reverse(), // Return in chronological order
      lastKey: lastDoc?.id || null,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return serverError(res, 'Failed to get messages', 'فشل الحصول على الرسائل');
  }
});

/**
 * POST /conversations/:conversationId/messages
 * Send a message
 */
app.post('/conversations/:conversationId/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { conversationId } = req.params;
    const userId = req.user!.uid;
    const { message, messageType = 'text' } = req.body;

    if (!message) {
      return badRequest(res, 'Message is required', 'الرسالة مطلوبة');
    }

    // Verify user is a participant
    const conversationDoc = await db.collection(CONVERSATIONS_COLLECTION).doc(conversationId).get();
    if (!conversationDoc.exists) {
      return notFound(res, 'Conversation not found', 'المحادثة غير موجودة');
    }

    const conversation = conversationDoc.data() as Conversation;
    if (!conversation.participants.includes(userId)) {
      return unauthorized(res);
    }

    const messageId = uuidv4();
    const now = new Date();

    const newMessage: Message = {
      messageId,
      conversationId,
      senderId: userId,
      message,
      messageType,
      status: 'sent',
      createdAt: now,
    };

    await db.collection(MESSAGES_COLLECTION).doc(messageId).set(newMessage);

    // Update conversation's last message
    await db.collection(CONVERSATIONS_COLLECTION).doc(conversationId).update({
      lastMessage: message,
      lastMessageAt: now,
      updatedAt: now,
    });

    // Publish message event for real-time delivery
    const recipientId = conversation.participants.find(p => p !== userId);
    await publishMessage(TOPICS.NOTIFICATIONS, {
      type: 'chat_message',
      conversationId,
      messageId,
      senderId: userId,
      recipientId,
      message,
    });

    return sendSuccess(res, newMessage, 'Message sent', 'تم إرسال الرسالة', 201);
  } catch (error) {
    console.error('Send message error:', error);
    return serverError(res, 'Failed to send message', 'فشل إرسال الرسالة');
  }
});

/**
 * PUT /conversations/:conversationId/messages/:messageId/read
 * Mark message as read
 */
app.put('/conversations/:conversationId/messages/:messageId/read', authenticate, async (req: Request, res: Response) => {
  try {
    const db = getFirestoreDb();
    const { conversationId, messageId } = req.params;
    const userId = req.user!.uid;

    // Verify user is a participant
    const conversationDoc = await db.collection(CONVERSATIONS_COLLECTION).doc(conversationId).get();
    if (!conversationDoc.exists) {
      return notFound(res, 'Conversation not found', 'المحادثة غير موجودة');
    }

    const conversation = conversationDoc.data() as Conversation;
    if (!conversation.participants.includes(userId)) {
      return unauthorized(res);
    }

    await db.collection(MESSAGES_COLLECTION).doc(messageId).update({
      status: 'read',
    });

    return sendSuccess(res, null, 'Message marked as read', 'تم تحديد الرسالة كمقروءة');
  } catch (error) {
    console.error('Mark message as read error:', error);
    return serverError(res);
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'chat' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Chat service listening on port ${PORT}`);
});

export default app;
