const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Role = require('../models/roleModel');
const Permission = require('../models/permissionModel');
const { successHandle, errorHandle } = require('../helper/helper');
require('dotenv').config();

const register = async(req, res) => {
    try {
        const { firstName, lastName, birthDate, email, contact, password, role } = req.body;
        try {
            const existingEmail = await User.findOne({ email });
            if(existingEmail) {
                return errorHandle('', res, "Email is Already Register", 422, '');
            }    
        } catch (error) {
            return errorHandle('', res, "Not Found", 404, error.message);
        }

        try {
            const existingContact = await User.findOne({ contact });
            if(existingContact) {
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
            const hash_password = await bcrypt.hash(password, 10);
            try {
                await User.create({
                    firstName, 
                    lastName, 
                    birthDate, 
                    email, 
                    contact,
                    password: hash_password,
                    role: roles.id
                });
                return successHandle('', res, "User Registered Successfully", 201, '');
            } catch (error) {
                return errorHandle('', res, "Error to Create User", 500, error.message);
            }
        } catch (error) {
            return errorHandle('', res, "Error in Registration", 500, error.message);
        }
    } catch (error) {
        return errorHandle('', res, "User Registration Failed", 500, error.message);
    }
}

const login = async(req, res) => {
   try {
        const { userName, password } = req.body;
        let user;
        try {
            user = await User.findOne({
                $or: [
                    { email: userName }, 
                    { contact: userName}
                ]
            });
    
            if(!user) {
                return errorHandle('', res, "No Matching User Found", 404, ''); 
            }
        } catch (error) {
            return errorHandle('', res, "User is Not Registered", 404, error.message);
        }
        
        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if(!isMatch) {
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
}

const createRole = async (req, res) => {
    const { roleName, permissions } = req.body;
    try {
        const existingRole = await Role.findOne({ roleName });
        if (existingRole) {
            return errorHandle('', res, "Role already exists", 422, '');
        }
        const newRole = await Role.create({ roleName, permissions });
        return successHandle('', res, "Add New Role Successfully", 201, newRole);
    } catch (error) {
        return errorHandle('', res, "Error in Creating Role", 500, error.message);
    }
};

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



module.exports = { register, login, createRole, createPermission };