import express from 'express';
const app = express.Router();

import createStatus from '../controllers/taskStatusController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';
import { validationStatus } from '../middleware/validation.js';

app.post('/add', verifyToken, checkRole('Admin'), validationStatus, createStatus);

export default app;