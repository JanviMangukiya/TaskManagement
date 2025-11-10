const cron = require('node-cron');
const Task = require('../models/taskModel');
const { sendEmail } = require('../helper/helper');

const checkAndSendReminders = async () => {
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const startOfTomorrow = new Date(tomorrow.toDateString()); 
        const endOfTomorrow = new Date(tomorrow.toDateString());
        endOfTomorrow.setDate(endOfTomorrow.getDate() + 1); 
    
        const tasks = await Task.find({
            dueDate: { $gte: startOfTomorrow, $lt: endOfTomorrow },
            isDeleted: false
        }).populate('userId', 'email');

        for (const task of tasks) {
            if (task?.userId?.email) {
                await sendEmail(
                    task.userId.email,
                    'Task Due Tomorrow',
                    `<h1>Task Reminder</h1>
                     <p>Tomorrow is your Due Date for the Task: ${task.taskName}</p>
                     <p>Due Date: ${task.dueDate}</p>`
                );
                console.log("Reminder Sent for Task");
            }
        }
    } catch (error) {
        console.error("Error in Task Reminder", error.message);
    }
};

const startTaskReminderJob = () => {
    cron.schedule('0 9 * * *', checkAndSendReminders); 
};

module.exports = { startTaskReminderJob };
