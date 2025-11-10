const User = require('../models/userModel');
const Role = require('../models/roleModel');
const { successHandle, errorHandle } = require('../helper/helper'); 
const cache = require('../utils/cache');

const getAllUsers = async(req, res) => {
    const cacheKey = `users:${JSON.stringify(req.query)}`;
    const cacheData = cache.get(cacheKey);
    if(cacheData) {
        return successHandle('', res, "Users Retrieved Successfully (Cache)", 200, cacheData);
    }
    try {
        const users = await User.find({ isDeleted: false });
        cache.set(cacheKey, users);
        return successHandle('', res, "Users Retrieved Successfully", 200, users);
    } catch (error) {
        return errorHandle('', res, "Error Retrieving Users", 500, error.message);
    }
};

const updateUser = async(req, res) => {
    cache.keys((err, keys)=> {
        if(!err) {
            const userKeys = keys.filter(key => key.startsWith('users:'));
            if(userKeys.length) {
                cache.del(userKeys);
            }
        }
    });
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        if (updateData.role) {
            try {
                const roles = await Role.findOne({ roleName: updateData.role });
                if (!roles) {
                    return errorHandle('', res, "Invalid Role", 400, '');
                }
                updateData.role = roles.id;
            } catch (error) {
                return errorHandle('', res, "Error Updating User", 500, error.message);
            }
        }
        try {
            const updatedUser = await User.findByIdAndUpdate(id, updateData);
            if (!updatedUser) {
                return errorHandle('', res, "User Not Found", 404, '');
            }
            return successHandle('', res, "User Updated Successfully", 200, updatedUser);
        } catch (error) {
            return errorHandle('', res, "Error Updating User", 500, error.message);
        }
    } catch (error) {
        return errorHandle('', res, "Error Updating User", 500, error.message);
    }
};

const deleteUser = async(req, res) => {
    cache.keys((err, keys)=> {
        if(!err) {
            const userKeys = keys.filter(key => key.startsWith('users:'));
            if(userKeys.length) {
                cache.del(userKeys);
            }
        }
    });
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