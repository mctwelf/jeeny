/**
 * Google Cloud Pub/Sub Client
 *
 * Handles publishing messages to Pub/Sub topics.
 * Replaces AWS SNS/SQS.
 */

import { PubSub, Topic } from '@google-cloud/pubsub';

let pubsubClient: PubSub;
const topicCache: Map<string, Topic> = new Map();

export const getPubSubClient = (): PubSub => {
  if (!pubsubClient) {
    pubsubClient = new PubSub({
      projectId: process.env.GCP_PROJECT_ID,
    });
  }
  return pubsubClient;
};

export const getTopic = (topicName: string): Topic => {
  if (!topicCache.has(topicName)) {
    const client = getPubSubClient();
    topicCache.set(topicName, client.topic(topicName));
  }
  return topicCache.get(topicName)!;
};

export interface PublishOptions {
  attributes?: Record<string, string>;
  orderingKey?: string;
}

export const publishMessage = async (
  topicName: string,
  data: Record<string, unknown>,
  options?: PublishOptions
): Promise<string> => {
  const topic = getTopic(topicName);
  const messageBuffer = Buffer.from(JSON.stringify(data));

  const messageId = await topic.publishMessage({
    data: messageBuffer,
    attributes: options?.attributes,
    orderingKey: options?.orderingKey,
  });

  return messageId;
};

// Topic names from environment
export const TOPICS = {
  RIDE_REQUESTS: process.env.TOPIC_RIDE_REQUESTS || 'jeeny-ride-requests-dev',
  RIDE_UPDATES: process.env.TOPIC_RIDE_UPDATES || 'jeeny-ride-updates-dev',
  RIDE_EVENTS: process.env.TOPIC_RIDE_EVENTS || 'jeeny-ride-events-dev',
  DRIVER_EVENTS: process.env.TOPIC_DRIVER_EVENTS || 'jeeny-driver-events-dev',
  PAYMENTS: process.env.TOPIC_PAYMENTS || 'jeeny-payments-dev',
  NOTIFICATIONS: process.env.TOPIC_NOTIFICATIONS || 'jeeny-notifications-dev',
  SMS: process.env.TOPIC_SMS || 'jeeny-sms-dev',
  SCHEDULED_TASKS: process.env.TOPIC_SCHEDULED_TASKS || 'jeeny-scheduled-tasks-dev',
};
