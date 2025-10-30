const User = require('../models/userModel');
const Role = require('../models/roleModel');
const { successHandle, errorHandle } = require('../helper/helper'); 

const getAllUsers = async(req, res) => {
    try {
        const users = await User.find({ isDeleted: false });
        return successHandle('', res, "Users Retrieved Successfully", 200, users);
    } catch (error) {
        return errorHandle('', res, "Error Retrieving Users", 500, error.message);
    }
};

const updateUser = async(req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        if (updateData.role) {
            const roles = await Role.findOne({ roleName: updateData.role });
            if (!roles) {
                return errorHandle('', res, "Invalid Role", 400, '');
            }
            updateData.role = roles.id;
        }
        const updatedUser = await User.findByIdAndUpdate(id, updateData);
        if (!updatedUser) {
            return errorHandle('', res, "User Not Found", 404, '');
        }
        return successHandle('', res, "User Updated Successfully", 200, updatedUser);
    } catch (error) {
        return errorHandle('', res, "Error Updating User", 500, error.message);
    }
};

const deleteUser = async(req, res) => {
    try {
        const { id } = req.params;
        try {
            const users = await User.findByIdAndUpdate(id, { isDeleted: true });
            if (!users) {
                return errorHandle('', res, "User Not Found", 404, '');
            }
            return successHandle('', res, "User Deleted Successfully", 204, '');
        } catch (error) {
            return errorHandle('', res, "Error Deleting User", 500, error.message);
        }
    } catch (error) {
        return errorHandle('', res, "Error Deleting User", 500, error.message);
    }
};

module.exports = { getAllUsers, updateUser, deleteUser };