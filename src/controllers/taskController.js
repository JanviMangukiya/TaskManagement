const Task = require('../models/taskModel');
const TaskStatusMap = require('../models/taskStatusMapModel');
const { successHandle, errorHandle } = require('../helper/helper');
const path = require('path');

const createTask = async(req,res) => {
    try {
        const { taskName, description, priority, userId, statusId, assignDate, dueDate, status } = req.body;
        
        try {
            const existingTask = await Task.findOne({ taskName });
            if (existingTask) {
                return errorHandle('', res, "Task already exists", 422, '');
            }
        } catch (error) {
            return errorHandle('', res, "Error checking existing task", 500, error.message);
        }

        try {
            const newTask = await Task.create({
                taskName,
                description,
                priority,
                userId,
                assignDate,
                dueDate
            });
            const newStatusMap = await TaskStatusMap.create({
                taskId: newTask.id,
                statusId: statusId
            });
            await Task.findByIdAndUpdate( newTask.id, { 
                $push: { status: newStatusMap } 
            });
            return successHandle('', res, "Task Created Successfully", 201, newTask);
        } catch (error) {
            return errorHandle('', res, "Error Creating Task", 500, error.message);
        }
    } catch (error) {
        return errorHandle('', res, "Task Creation Failed", 500, error.message);
    }
};

const getAllTasks = async(req, res) => {
    try {
        const limit = parseInt(req?.query?.limit || 5);
        const skip = parseInt(req?.query?.skip || 0);
        let filter = { isDeleted: false };

        const { taskName, priority, assignDate, dueDate, status } = req.query;
 
        if (taskName) {
            filter.taskName = { $regex: taskName, $options: 'i'} 
        }
        if (priority) {
            filter.priority = { $regex: priority, $options: 'i'} 
        }
        if (assignDate) {
            filter.assignDate = { $regex: assignDate, $options: 'i' }
        }
        if (dueDate) {
            filter.dueDate = { $regex: dueDate, $options: 'i'}
        }
        if (status) {
            filter['status.statusName']  = { $regex: status, $options: 'i'} 
        }

        try {
            const tasks = await Task.find(filter)
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'status',
                populate: {
                    path: 'statusId',
                    select: 'statusName'
                }
            });
            return successHandle('', res, "Tasks Retrieved Successfully", 200, tasks);
        } catch (error) {
            return errorHandle('', res, "Task Not Found", 404, error.message);
        }   
    } catch (error) {
            return errorHandle('', res, "Error Retrieving Tasks", 500, error.message);
    }
};

const getByIdTask = async(req, res) => {
    try {
        const tasks = await Task.findById( req.params.id )
        .populate({
            path: 'status',
            populate: {
                path: 'statusId',
                select: 'statusName'
            }
        });
        return successHandle('', res, "Tasks Retrieved Successfully", 200, tasks);
    } catch (error) {
        return errorHandle('', res, "Error Retrieving Tasks", 500, error.message);
    }
};

const updateTask = async(req, res) => { 
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedTask = await Task.findByIdAndUpdate(id, updateData);
        if (!updatedTask) {
            return errorHandle('', res, "Task Not Found", 404, '');
        }
        return successHandle('', res, "Task Updated Successfully", 200, updatedTask);
    }               
    catch (error) {
        return errorHandle('', res, "Error Updating Task", 500, error.message);
    }
};

const updateTaskStatus = async(req, res) => {
    try {
        const { id } = req.params;
        const { statusId } = req.body;

        const updatedStatus = await TaskStatusMap.create({
            taskId: id,
            statusId: statusId 
        });
        await Task.findByIdAndUpdate( id, { 
            $push: { status: updatedStatus } 
        });
        if (!updatedStatus) {
            return errorHandle('', res, "Task Status Not Found", 404, '');
        }
        return successHandle('', res, "Task Status Updated Successfully", 200, updatedStatus);
    } catch (error) {
        return errorHandle('', res, "Error Updating Task Status", 500, error.message);
    }
};

const getTaskStatusHistory = async(req, res) => {
    try {
        const { id } = req.params;
        const statusHistory = await TaskStatusMap.find({ taskId: id })
        .populate({
            path: 'statusId',
            select: 'statusName'
        })
        .populate({
            path: 'taskId',
            select: 'taskName'
        });
        return successHandle('', res, "Task Status History", 200, statusHistory);
    } catch (error) {
        return errorHandle('', res, "Error in Task Status History", 500, error.message);
    }
};

const deleteTask = async(req, res) => {
    try {
        const { id } = req.params;
        const deletedTask = await Task.findByIdAndUpdate(id, { isDeleted: true });
        if (!deletedTask) {
            return errorHandle('', res, "Task Not Found", 404, '');
        }
        return successHandle('', res, "Task Deleted Successfully", 204, '');
    } catch (error) {
        return errorHandle('', res, "Error Deleting Task", 500, error.message);
    }
};

module.exports = { createTask, getAllTasks, getByIdTask, updateTask, updateTaskStatus, deleteTask, getTaskStatusHistory };