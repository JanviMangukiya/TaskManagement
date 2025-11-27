import express from "express";
const app = express.Router();

import {
  register,
  login,
  getAllUsers,
  getIdByUser,
  updateUser,
  deleteUser,
  createRole,
  createPermission,
} from "../controllers/userController.js";
import {
  validationRegister,
  validationLogin,
} from "../middleware/validation.js";
import { verifyToken, checkRole } from "../middleware/authMiddleware.js";

app.post("/register", validationRegister, register);

app.post("/login", validationLogin, login);

app.get("/users", verifyToken, checkRole("Admin"), getAllUsers);

app.get("/users/:id", verifyToken, checkRole("Admin"), getIdByUser);

app.put("/users/:id", verifyToken, checkRole("Admin"), updateUser);

app.delete("/users/:id", verifyToken, checkRole("Admin"), deleteUser);

app.post("/role", verifyToken, checkRole("Admin"), createRole);

app.post("/permission", verifyToken, checkRole("Admin"), createPermission);

export default app;
