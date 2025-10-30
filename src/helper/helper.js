const successHandle = (req, res, message, statusCode, data = {}) => {
    return res.status(statusCode).json({message, data});
}

const errorHandle = (req, res, message, statusCode, data = {}) => {
    return res.status(statusCode).json({message, data});
}

module.exports = { successHandle, errorHandle};