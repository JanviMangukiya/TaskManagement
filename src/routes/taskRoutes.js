const express = require('express');
const app = express.Router();
const { createTask, getAllTasks, getByIdTask, updateTask, updateTaskStatus, getTaskStatusHistory, deleteTask } = require('../controllers/taskController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { validationTask } = require('../middleware/validation');

app.post('/add', verifyToken, checkRole('Admin'), validationTask, createTask);

app.get('/getAll', verifyToken, checkRole('Admin'), getAllTasks); 

app.get('/getById/:id', verifyToken, checkRole('Admin'), getByIdTask);

app.put('/updateTask/:id', verifyToken, checkRole('Admin'), updateTask);

app.put('/updateStatus/:id', verifyToken, checkRole('Admin'), updateTaskStatus);

app.get('/statusHistory/:id', verifyToken, checkRole('Admin'), getTaskStatusHistory);

app.delete('/delete/:id', verifyToken, checkRole('Admin'), deleteTask);

module.exports = app;