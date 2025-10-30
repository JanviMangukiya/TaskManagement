const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const express = require('express');
const app = express();

app.use(express.json());
require('./db.js');

const adminRouter = require('./routes/adminRoutes');
const userRouter = require('./routes/userRoutes');
const taskRouter = require('./routes/taskRoutes');
const taskStatusRouter = require('./routes/taskStatusRoutes');

app.use('/admin', adminRouter);
app.use('/user', userRouter);
app.use('/task', taskRouter);
app.use('/status', taskStatusRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

