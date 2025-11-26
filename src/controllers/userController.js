import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Role from '../models/roleModel.js';
import Permission from '../models/permissionModel.js';
import { successHandle, errorHandle } from '../helper/helper.js';
import cache from '../utils/cache.js';

// register
const register = async (req, res) => {
    try {
        const { firstName, lastName, birthDate, email, contact, password, role } = req.body;
        try {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return errorHandle('', res, "Email is Already Register", 422, '');
            }
        } catch (error) {
            return errorHandle('', res, "Not Found", 404, error.message);
        }

        try {
            const existingContact = await User.findOne({ contact });
            if (existingContact) {
                return errorHandle('', res, "Contact is Already Register", 422, '');
            }
        } catch (error) {
            return errorHandle('', res, "Not Found", 404, error.message);
        }

        let roles;
        try {
            roles = await Role.findOne({ roleName: role });
            if (!roles) {
                return errorHandle('', res, "Invalid Role Specified", 400, '');
            }
        } catch (error) {
            return errorHandle('', res, "Failed to Fetch Role", 500, error.message);
        }

        try {
            User.create({
                firstName,
                lastName,
                birthDate,
                email,
                contact,
                password,
                role: roles.id
            });
            return successHandle('', res, "User Registered Successfully", 201, '');
        } catch (error) {
            return errorHandle('', res, "Error in Registration", 500, error.message);
        }
    } catch (error) {
        return errorHandle('', res, "User Registration Failed", 500, error.message);
    }
};

// login
const login = async (req, res) => {
    try {
        const { userName, password } = req.body;
        let user;
        try {
            user = await User.findOne({
                $or: [
                    { email: userName },
                    { contact: userName }
                ]
            });

            if (!user) {
                return errorHandle('', res, "No Matching User Found", 404, '');
            }
        } catch (error) {
            return errorHandle('', res, "User is Not Registered", 404, error.message);
        }

        try {
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return errorHandle('', res, "Invalid Password", 422, '');
            }
        } catch (error) {
            return errorHandle('', res, "Somthing Went Wrong", 500, error.message);
        }
        const token = jwt.sign(
            { id: user._id, role: user.role.toString() },
            process.env.SECRET_KEY,
            { expiresIn: '1h' }
        );
        return successHandle('', res, "Login Successfully", 200, token);
    } catch (error) {
        return errorHandle('', res, "Error in Login", 401, error.message);
    }
};

// get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ isDeleted: false }).select("-password");
        return successHandle('', res, "Users Retrieved Successfully", 200, users);
    } catch (error) {
        return errorHandle('', res, "Error Retrieving Users", 500, error.message);
    }
};

// get user by id
const getIdByUser = async (req, res) => {
    const { id } = req.params;
    // make a cache key from the URL params
    const cacheKey = `user:${JSON.stringify(id)}`;
    const cacheData = cache.get(cacheKey);
    if (cacheData) {
        return successHandle('', res, "User Retrieved Successfully (Cache)", 200, cacheData);
    }
    try {
        const user = await User.findById(id).select("-password");
        cache.set(cacheKey, user);
        if (!user) {
            return errorHandle('', res, "User Not Found", 404, '');
        }
        return successHandle('', res, "User Retrieved Successfully", 200, user);
    } catch (error) {
        return errorHandle('', res, "Error Retrieving User", 500, error.message);
    }
};

// update user
const updateUser = async (req, res) => {
    cache.keys((err, keys) => {
        if (!err) {
            // find all keys that start with "users:"
            const userKeys = keys.filter(key => key.startsWith('users:'));
            if (userKeys.length) {
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

// delete user
const deleteUser = async (req, res) => {
    cache.keys((err, keys) => {
        if (!err) {
            // find all keys that start with "users:"
            const userKeys = keys.filter(key => key.startsWith('users:'));
            if (userKeys.length) {
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

// create role
const createRole = async (req, res) => {
    const { roleName, permissions } = req.body;
    try {
        const existingRole = await Role.findOne({ roleName });
        if (existingRole) {
            return errorHandle('', res, "Role already exists", 422, '');
        }
        try {
            const newRole = await Role.create({ roleName, permissions });
            return successHandle('', res, "Add New Role Successfully", 201, newRole);
        } catch (error) {
            return errorHandle('', res, "Error in Creating Role", 500, error.message);
        }
    } catch (error) {
        return errorHandle('', res, "Error in Creating Role", 500, error.message);
    }
};

// create permission
const createPermission = async (req, res) => {
    const { permissionName, description } = req.body;
    try {
        const newPermission = await Permission.create({
            permissionName,
            description
        });
        return successHandle('', res, "Add New Permission Successfully", 201, newPermission);
    } catch (error) {
        return errorHandle('', res, "Error in Creating Permission", 500, error.message);
    }
};

export { register, login, getAllUsers, getIdByUser, updateUser, deleteUser, createRole, createPermission };