const TaskStatus = require('../models/taskStatusModel');
const { successHandle, errorHandle } = require('../helper/helper');

const createStatus = async (req, res) => {
    try {
        const { statusName } = req.body;
        try {
            const existingStatus = await TaskStatus.findOne({ statusName });
            if (existingStatus) {
                return errorHandle('', res, "Status already exists", 422, '');
            }
        } catch (error) {
            return errorHandle('', res, "Error checking existing status", 500, error.message);
        }
        try {
            const newStatus = await TaskStatus.create({ statusName });
            return successHandle('', res, "Status Created Successfully", 201, newStatus);
        } catch (error) {
            return errorHandle('', res, "Error Creating Status", 500, error.message);
        }
    } catch (error) {
        return errorHandle('', res, "Status Creation Failed", 500, error.message);
    }
};

module.exports = { createStatus };