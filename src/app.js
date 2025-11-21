const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const rateLimit = require("./middleware/rateLimiter");

require("./db");

const { startTaskReminderJob } = require("./utils/taskReminder");
const { listenMessage } = require("./utils/googlePubSub");

const adminRouter = require("./routes/adminRoutes");
const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");
const taskStatusRouter = require("./routes/taskStatusRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(rateLimit);
app.use(express.json());

startTaskReminderJob();
listenMessage("UserCreation-sub");

app.use("/admin", adminRouter);
app.use("/user", userRouter);
app.use("/task", taskRouter);
app.use("/status", taskStatusRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
