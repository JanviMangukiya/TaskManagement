import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

/**
 * Handles successful responses and sends a JSON response
 *
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Data to be sent in the response
 */
const successHandle = (req, res, message, statusCode, data = {}) => {
  return res.status(statusCode).json({ message, data });
};

/**
 * Handles error responses and sends a JSON response
 *
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Data to be sent in the response
 */
const errorHandle = (req, res, message, statusCode, data = {}) => {
  return res.status(statusCode).json({ message, data });
};

/**
 * Transporter to send emails using Gmail service
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_USER,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

/**
 * Sends an email using the transporter
 *
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content of the email
 */
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `${process.env.GOOGLE_USER}`,
      to,
      subject,
      html,
    });
    console.log("Email Sent Successfully", to);
  } catch (error) {
    console.error("Failed to Send Email", error.message);
  }
};

export { successHandle, errorHandle, sendEmail };
