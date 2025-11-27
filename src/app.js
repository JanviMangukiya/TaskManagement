import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
import express from "express";

import rateLimit from "./middleware/rateLimiter.js";
import connectDB from "./config/db.js";
import startTaskReminderJob from "./utils/taskReminder.js";
import listenMessage from "./services/googlePubSub.js";

import userRouter from "./routes/userRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import taskStatusRouter from "./routes/taskStatusRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(rateLimit);
app.use(express.json());

startTaskReminderJob();
listenMessage("UserCreation-sub");

app.use("/user", userRouter);
app.use("/task", taskRouter);
app.use("/status", taskStatusRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
