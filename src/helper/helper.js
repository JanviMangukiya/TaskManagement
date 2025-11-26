import nodemailer from 'nodemailer';
import dotenv from "dotenv";
dotenv.config({ path: "../.env" }); 

const successHandle = (req, res, message, statusCode, data = {}) => {
  return res.status(statusCode).json({ message, data });
};

const errorHandle = (req, res, message, statusCode, data = {}) => {
  return res.status(statusCode).json({ message, data });
};
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_USER,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

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
