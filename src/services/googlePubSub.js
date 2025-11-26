import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { PubSub } from '@google-cloud/pubsub';
import { sendEmail } from '../helper/helper.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pubSubClient = new PubSub({
  projectId: process.env.GOOGLE_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

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