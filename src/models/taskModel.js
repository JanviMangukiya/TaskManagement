const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    taskName: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High']
    },
    category: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignDate: {
        type: Date
    },
    dueDate: {
        type: Date  
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    status: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaskStatusMap'
    }]
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;