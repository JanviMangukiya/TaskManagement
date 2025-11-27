import express from "express";
const app = express.Router();

import {
  createTask,
  getAllTasks,
  getByIdTask,
  updateTask,
  updateTaskStatus,
  addIsLikedTask,
  addIsLikedComment,
  getTaskStatusHistory,
  deleteTask,
  filterByPriority,
} from "../controllers/taskController.js";
import { verifyToken, checkRole } from "../middleware/authMiddleware.js";
import { validationTask } from "../middleware/validation.js";

app.post("/add", verifyToken, checkRole("Admin"), validationTask, createTask);

app.get("/getAll", verifyToken, checkRole("Admin"), getAllTasks);

app.get("/getById/:id", verifyToken, checkRole("Admin"), getByIdTask);

app.get("/filterByPriority", verifyToken, checkRole("Admin"), filterByPriority);

app.put("/updateTask/:id", verifyToken, checkRole("Admin"), updateTask);

app.put("/updateStatus/:id", verifyToken, checkRole("Admin"), updateTaskStatus);

app.put("/likedTask/:id", verifyToken, addIsLikedTask);

app.put("/likedComment/:id", verifyToken, addIsLikedComment);

app.get(
  "/statusHistory/:id",
  verifyToken,
  checkRole("Admin"),
  getTaskStatusHistory,
);

app.delete("/delete/:id", verifyToken, checkRole("Admin"), deleteTask);

export default app;
