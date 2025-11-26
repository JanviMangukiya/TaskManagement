import rateLimit from 'express-rate-limit';

// Rate limiter to limit requests
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 100, // Max 100 req
  message: "Too Many Requests, Please Try Again After 1 Minute",
});

export default limiter;
