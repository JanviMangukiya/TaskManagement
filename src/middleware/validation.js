import { errorHandle } from "../helper/helper.js";

// Regex patterns
const emailValid = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.com$/;
const numberValid = /^[0-9]{10}$/;

/**
 * Validate user register
 *
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {Function} next - Next middleware function
 */
const validationRegister = (req, res, next) => {
  const { firstName, lastName, birthDate, email, contact, password, role } =
    req.body;

  //Check required fields
  if (
    !firstName ||
    !lastName ||
    !birthDate ||
    !email ||
    !contact ||
    !password ||
    !role
  ) {
    return errorHandle("", res, "All Fields are Required", 400, "");
  }

  //Validate email
  if (!emailValid.test(email)) {
    return errorHandle("", res, "Invalid Email", 400, "");
  }

  //Validate contact number
  if (!numberValid.test(contact)) {
    return errorHandle("", res, "Invalid Mobile Number", 400, "");
  }

  //Validate password length
  if (password.length < 5) {
    return errorHandle(
      "",
      res,
      "Password must be at least 5 in Length",
      400,
      "",
    );
  }
  next();
};

/**
 * Validate user login
 *
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {Function} next - Next middleware function
 */
const validationLogin = (req, res, next) => {
  const { userName, password } = req.body;
  // Check required fields
  if (!userName) {
    return errorHandle("", res, "Email or Contact are Required", 400, "");
  }
  if (!password) {
    return errorHandle("", res, "Password are Required", 400, "");
  }

  // Validate email or contact number
  if (!emailValid.test(userName) && !numberValid.test(userName)) {
    return errorHandle("", res, "Invalid Email or Mobile Number", 400, "");
  }
  next();
};

/**
 * Validate task
 *
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {Function} next - Next middleware function
 */
const validationTask = (req, res, next) => {
  const { taskName, description, priority, userId, assignDate, dueDate } =
    req.body;

  // Check required fields
  if (
    !taskName ||
    !description ||
    !priority ||
    !userId ||
    !assignDate ||
    !dueDate
  ) {
    return errorHandle("", res, "All Fields are Required", 400, "");
  }
  next();
};

/**
 * Validate task status
 *
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {Function} next - Next middleware function
 */
const validationStatus = (req, res, next) => {
  const { statusName } = req.body;

  // Check required fields
  if (!statusName) {
    return errorHandle("", res, "Status Name is Required", 400, "");
  }
  next();
};

export {
  validationRegister,
  validationLogin,
  validationTask,
  validationStatus,
};
