import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import { PubSub } from '@google-cloud/pubsub';

import { sendEmail } from '../helper/helper.js';

// Get current file directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Pub/Sub client
const pubSubClient = new PubSub({
  projectId: process.env.GOOGLE_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

/**
 * Publish message to Pub/Sub topic
 * 
 * @param {string} topic - Topic name
 * @param {object} message - Message data
 */
export const publishMessage = async (topic, message) => {
  try {
    const messageId = await pubSubClient
      .topic(topic)
      .publishMessage({ data: Buffer.from(JSON.stringify(message)) });
    console.log(`Message ${messageId} Published Successfully`);
  } catch (error) {
    console.error("Error Publishing Message", error);
  }
};

/**
 * Listen to Pub/Sub message and send email reminder
 * 
 * @param {string} subscriptionName - Subscription name
 */
const listenMessage = async (subscriptionName) => {
  try {
    const subscription = pubSubClient.subscription(subscriptionName);
    subscription.on("message", async (message) => {
      try {
        const data = JSON.parse(message?.data?.toString());
        for (let i = 0; i < data.length; i++) {
          let htmlBody = fs.readFileSync(
            path.join(__dirname, "../emailTemplate", "reminderEmail.html"),
            "utf8"
          );
          htmlBody = htmlBody
            .replace("{taskName}", data[i].taskName)
            .replace("{dueDate}", data[i].dueDate);
            
          try {
            await sendEmail(data[i].email, "Task Due Tomorrow", htmlBody);
          } catch (error) {
            console.error("Error Sending Email", error);
          }
        }
        message.ack();
      } catch (error) {
        console.error("Error Sending Email", error);
      }
    });
  } catch (error) {
    console.error("Error Listening to Message", error);
  }
};

export default listenMessage;