"use strict";
/**
 * Google Cloud Pub/Sub Client
 *
 * Handles publishing messages to Pub/Sub topics.
 * Replaces AWS SNS/SQS.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOPICS = exports.publishMessage = exports.getTopic = exports.getPubSubClient = void 0;
const pubsub_1 = require("@google-cloud/pubsub");
let pubsubClient;
const topicCache = new Map();
const getPubSubClient = () => {
    if (!pubsubClient) {
        pubsubClient = new pubsub_1.PubSub({
            projectId: process.env.GCP_PROJECT_ID,
        });
    }
    return pubsubClient;
};
exports.getPubSubClient = getPubSubClient;
const getTopic = (topicName) => {
    if (!topicCache.has(topicName)) {
        const client = (0, exports.getPubSubClient)();
        topicCache.set(topicName, client.topic(topicName));
    }
    return topicCache.get(topicName);
};
exports.getTopic = getTopic;
const publishMessage = async (topicName, data, options) => {
    const topic = (0, exports.getTopic)(topicName);
    const messageBuffer = Buffer.from(JSON.stringify(data));
    const messageId = await topic.publishMessage({
        data: messageBuffer,
        attributes: options?.attributes,
        orderingKey: options?.orderingKey,
    });
    return messageId;
};
exports.publishMessage = publishMessage;
// Topic names from environment
exports.TOPICS = {
    RIDE_REQUESTS: process.env.TOPIC_RIDE_REQUESTS || 'jeeny-ride-requests-dev',
    RIDE_UPDATES: process.env.TOPIC_RIDE_UPDATES || 'jeeny-ride-updates-dev',
    RIDE_EVENTS: process.env.TOPIC_RIDE_EVENTS || 'jeeny-ride-events-dev',
    DRIVER_EVENTS: process.env.TOPIC_DRIVER_EVENTS || 'jeeny-driver-events-dev',
    PAYMENTS: process.env.TOPIC_PAYMENTS || 'jeeny-payments-dev',
    NOTIFICATIONS: process.env.TOPIC_NOTIFICATIONS || 'jeeny-notifications-dev',
    SMS: process.env.TOPIC_SMS || 'jeeny-sms-dev',
    SCHEDULED_TASKS: process.env.TOPIC_SCHEDULED_TASKS || 'jeeny-scheduled-tasks-dev',
};
