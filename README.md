# Task Management    

A **Task Management System** built with **Node.js**, **Express**, **MongoDB**, and **Google Pub/Sub**.  
It supports user management, task creation, status updates, and automated reminders.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [API Endpoints](#api-endpoints)
- [License](#license)

---

## Features

- User CRUD (Create, Read, Update, Delete)
- Admin management
- Task CRUD with status tracking
- Scheduled task reminders using `node-cron`
- Rate limiting for API requests
- JSON Web Token (JWT) authentication support 

---

## Tech Stack

- **Node.js** (JavaScript runtime)
- **Express** (Web framework)
- **MongoDB** (Database)
- **Mongoose** (MongoDB ODM)
- **node-cron** (Scheduled jobs)
- **@google-cloud/pubsub** (Google Pub/Sub integration)
- **nodemailer** (Email notifications)
- **bcrypt** (Password hashing)
- **jsonwebtoken** (JWT authentication)
- **express-rate-limit** (Rate limiting)

---

## Project Structure

```text
src/
├── config/                 # Configuration files
│   └── nodejs-pub-sub.json # Google Cloud Pub/Sub configuration
├── controllers/            # Route controllers
│   ├── adminController.js  # Admin-specific operations
│   ├── taskController.js   # Task management logic
│   ├── taskStatusController.js # Task status operations
│   └── userController.js   # User authentication and management
├── emailTemplate/          # Email templates
│   ├── reminderEmail.html  # Reminder email template
│   └── sendEmail.html      # General email template
├── helper/                 # Helper functions
│   └── helper.js           # Common helper utilities
├── middleware/             # Custom middleware
│   ├── authMiddleware.js   # Authentication middleware
│   ├── rateLimiter.js      # Rate limiting middleware
│   └── validation.js       # Request validation
├── models/                 # Database models
│   ├── permissionModel.js  # Permission schema
│   ├── roleModel.js        # User roles schema
│   ├── taskModel.js        # Task schema
│   ├── taskStatusMapModel.js # Task status mapping
│   ├── taskStatusModel.js  # Task status schema
│   └── userModel.js        # User schema
├── routes/                 # Route definitions
│   ├── adminRoutes.js      # Admin routes
│   ├── taskRoutes.js       # Task management routes
│   ├── taskStatusRoutes.js # Task status routes
│   └── userRoutes.js       # User authentication routes
├── services/               # Business logic services
│   └── googlePubSub.js     # Google Pub/Sub integration
├── utils/                  # Utility functions
│   ├── cache.js            # Cache management
│   └── helper.js           # Common utilities
├── app.js                 # Express application setup
└── db.js                  # Database connection

```

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JanviMangukiya/taskmanagement.git
   cd taskmanagement
   ```

---

## Environment Variables

Create a `.env` file in the root directory and add the following environment variables : 

```env

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Google Cloud Pub/Sub
GOOGLE_APPLICATION_CREDENTIALS=./src/config/nodejs-pub-sub.json
PUBSUB_PROJECT_ID=your-project-id
PUBSUB_TOPIC=your-topic-name

# Rate Limiting
RATE_LIMIT_WINDOW_MS=15*60*1000  # 15 minutes
RATE_LIMIT_MAX=100  # limit each IP to 100 requests per windowMs
```

---

## Scripts

- `node app.js` - Start the server
- `nodemon app.js` - Start the server with nodemon

---

## API Endpoints

### Authentication

#### Get all tasks
```http
GET /task/getAll
Authorization: Bearer <jwt_token>
```

#### Create a new task
```http
POST /task/add
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Update a task
```http
PUT /task/update/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Delete a task
```http
DELETE /task/delete/:id
Authorization: Bearer <jwt_token>
```

#### Error Handling

The API returns appropriate HTTP status codes and JSON responses:

- `200 OK` 
- `201 Created` 
- `400 Bad Request` 
- `401 Unauthorized` 
- `403 Forbidden` 
- `404 Not Found` 
- `429 Too Many Requests` 
- `500 Internal Server Error` 

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Google Cloud Pub/Sub](https://cloud.google.com/pubsub)
- [JWT](https://jwt.io/)

---
