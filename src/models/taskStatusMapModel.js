import mongoose from 'mongoose';

const taskStatusMapSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',    
    },
    statusId: {
        type: mongoose.Schema.Types.ObjectId,   
        ref: 'TaskStatus',
    }
}, { timestamps: true } );

const TaskStatusMap = mongoose.model('TaskStatusMap', taskStatusMapSchema);

export default TaskStatusMap;