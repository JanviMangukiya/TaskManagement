const express = require('express');
const app = express.Router();
const { createRole, createPermission } = require('../controllers/userController');
const { getAllUsers, updateUser, deleteUser, getIdByUser } = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

app.get('/users', verifyToken, checkRole('Admin'), getAllUsers);

app.get('/users/:id', verifyToken, checkRole('Admin'), getIdByUser);

app.put('/users/:id', verifyToken, checkRole('Admin'), updateUser);

app.delete('/users/:id', verifyToken, checkRole('Admin'), deleteUser);

app.post('/role', verifyToken, checkRole('Admin'), createRole);

app.post('/permission', verifyToken, checkRole('Admin'), createPermission);

module.exports = app;