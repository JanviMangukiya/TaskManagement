import cron from 'node-cron';
import Task from '../models/taskModel.js';
import { publishMessage } from '../services/googlePubSub.js';
const batchSize = parseInt(process.env.BATCH_SIZE) || 100;

/**
 * Check for tasks due tomorrow and send email reminders
 */
const checkAndSendReminders = async () => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfTomorrow = new Date(tomorrow.toDateString());
    const endOfTomorrow = new Date(tomorrow.toDateString());
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);

    let tasks;
    try {
      // Get tasks due tomorrow
      tasks = await Task.find({
        dueDate: { $gte: startOfTomorrow, $lt: endOfTomorrow },
        isDeleted: false,
      }).populate("userId", "email");
    } catch (error) {
      console.error("Error in Task Reminder", error.message);
    }

    const totalTasks = tasks.length;
    const chunkSize = Math.ceil(totalTasks / batchSize); // Split tasks into batches

    for (let i = 0; i < chunkSize; i++) {
      const startIndex = i * batchSize;
      const endIndex = startIndex + batchSize;
      const batch = tasks.slice(startIndex, endIndex); // Get batch of tasks

      const data = batch
        .filter((task) => task?.userId?.email)
        .map((task) => ({
          email: task?.userId?.email,
          taskName: task?.taskName,
          dueDate: task?.dueDate,
        }));
      try {
        // Publish task data to PubSub
        await publishMessage("UserCreation", data);
      } catch (error) {
        console.error("Error in Task Reminder", error.message);
      }
    }
  } catch (error) {
    console.error("Error in Task Reminder", error.message);
  }
};

/**
 * Schedule task reminder job every 5 seconds
 */
const startTaskReminderJob = () => {
  cron.schedule("*/5 * * * * *", async () => {
    checkAndSendReminders();
  });
};

export default startTaskReminderJob;