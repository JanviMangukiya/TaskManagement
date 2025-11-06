const nodemailer = require("nodemailer");

const successHandle = (req, res, message, statusCode, data = {}) => {
    return res.status(statusCode).json({message, data});
}

const errorHandle = (req, res, message, statusCode, data = {}) => {
    return res.status(statusCode).json({message, data});
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GOOGLE_USER,
        pass: process.env.GOOGLE_APP_PASSWORD,
    },
});

const sendEmail = async(to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `${process.env.GOOGLE_USER}`,
            to,
            subject,
            html,
        });
        console.log("Email Sent Successfully", to);
        // return successHandle('', '', "Email sent successfully", 200, '');
    } catch (error) {
        console.error("Failed to Send Email", error.message);
        // return errorHandle('', '', "Failed to send email", 500, '');
    }
};

module.exports = { successHandle, errorHandle, sendEmail };