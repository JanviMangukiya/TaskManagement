import TaskStatus from '../models/taskStatusModel.js';
import { successHandle, errorHandle } from '../helper/helper.js';

/**
 * Create new status
 * 
 * @param {Request} req - Request object
 * @param {string} req.body.statusName - Status name
 * @param {Response} res - Response object
 */
const createStatus = async (req, res) => {
    const { statusName } = req.body;

    // Check if status already exists
    try {
        const existingStatus = await TaskStatus.findOne({ statusName });
        if (existingStatus) {
            return errorHandle('', res, "Status already exists", 422, '');
        }
    } catch (error) {
        return errorHandle('', res, "Error checking existing status", 500, error.message);
    }

    // Create new status
    try {
        const newStatus = await TaskStatus.create({ statusName });
        return successHandle('', res, "Status Created Successfully", 201, newStatus);
    } catch (error) {
        return errorHandle('', res, "Error Creating Status", 500, error.message);
    }
};

export default createStatus;