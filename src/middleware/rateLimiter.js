const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: "Too Many Requests, Please Try Again After 1 Minute"
});

module.exports = limiter;