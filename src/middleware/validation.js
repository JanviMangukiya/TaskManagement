const { errorHandle } = require('../helper/helper');

const emailValid = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.com$/;
const numberValid = /^[0-9]{10}$/;

const validationRegister = ((req, res, next) => {
    const { firstName, lastName, birthDate, email, contact, password, role } = req.body;

    if(!firstName || !lastName || !birthDate || !email || !contact || !password || !role) {
        return errorHandle('', res, "All Fields are Required", 400, '');
    }

    if(!emailValid.test(email)) {
        return errorHandle('', res, "Invalid Email", 400, '');
    }

    if(!numberValid.test(contact)) {
        return errorHandle('', res, "Invalid Mobile Number", 400, '');
    }

    if(password.length < 5) {
        return errorHandle('', res, "Password must be at least 5 in Length", 400, '');
    }
    next();
});

const validationLogin = ((req, res, next) => {
    const { userName, password } = req.body;
    if(!userName) {
        return errorHandle('', res, "Email or Contact are Required", 400, error.message);
    }

    if(!password) {
        return errorHandle('', res, "Password are Required", 400, error.message);
    }

    if(!emailValid.test(userName) && !numberValid.test(userName)) {
        return errorHandle('', res, "Invalid Email or Mobile Number", 400, error.message);
    }
    next();
});

const validationTask = ((req, res, next) => {
    const { taskName, description, priority, Userid, assignDate, dueDate } = req.body;

    if(!taskName || !description || !priority || !Userid || !assignDate || !dueDate) {
        return errorHandle('', res, "All Fields are Required", 400, '');
    }

    next();
});

const validationStatus = ((req, res, next) => {
    const { statusName } = req.body;

    if(!statusName) {
        return errorHandle('', res, "Status Name is Required", 400, '');
    }
    next();
});

module.exports = { validationRegister, validationLogin, validationTask, validationStatus };