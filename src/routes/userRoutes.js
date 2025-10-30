const express = require('express');
const app = express.Router();
const { register, login } = require('../controllers/userController');
const { validationRegister, validationLogin } = require('../middleware/validation');

app.post('/register', validationRegister, register);

app.post('/login', validationLogin, login);

module.exports = app;   