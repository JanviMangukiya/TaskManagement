const express = require('express');
const app = express.Router();
const { createStatus } = require('../controllers/taskStatusController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { validationStatus } = require('../middleware/validation');

app.post('/add', verifyToken, checkRole('Admin'), validationStatus, createStatus);

module.exports = app;