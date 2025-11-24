const express = require('express');
const app = express.Router();
const { register, login, getAllUsers, getIdByUser, updateUser, deleteUser, createRole, createPermission } = require('../controllers/userController');
const { validationRegister, validationLogin } = require('../middleware/validation');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

app.post('/register', validationRegister, register);

app.post('/login', validationLogin, login);

app.get('/users', verifyToken, checkRole('Admin'), getAllUsers);

app.get('/users/:id', verifyToken, checkRole('Admin'), getIdByUser);

app.put('/users/:id', verifyToken, checkRole('Admin'), updateUser);

app.delete('/users/:id', verifyToken, checkRole('Admin'), deleteUser);

app.post('/role', verifyToken, checkRole('Admin'), createRole);

app.post('/permission', verifyToken, checkRole('Admin'), createPermission);

module.exports = app;   