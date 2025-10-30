const mongoose = require('mongoose');

const taskStatusSchema = new mongoose.Schema({
    statusName: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed'],
        default: 'Pending',
        required: true
    }
}, { timestamps: true });

const TaskStatus = mongoose.model('TaskStatus', taskStatusSchema);

module.exports = TaskStatus;