const fs = require("fs");
const path = require("path");
const { PubSub } = require("@google-cloud/pubsub");
const { sendEmail } = require("../helper/helper");

const pubSubClient = new PubSub({
  projectId: process.env.GOOGLE_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const publishMessage = async (topic, message) => {
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
            path.join(__dirname, "..", "emailTemplate", "reminderEmail.html"),
            "utf8"
          );
          htmlBody = htmlBody
            .replace("{taskName}", data[i].taskName)
            .replace("{dueDate}", data[i].dueDate);
          await sendEmail(data[i].email, "Task Due Tomorrow", htmlBody);
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

module.exports = { publishMessage, listenMessage };
