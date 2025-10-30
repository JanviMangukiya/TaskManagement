const jwt = require('jsonwebtoken');
const { errorHandle } = require('../helper/helper');
const Role = require('../models/roleModel');

function verifyToken(req, res, next) {
    let token = req.headers['authorization'];
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7); 
    }
    if(!token) {
        return errorHandle('', res, "Token Not Found", 404, '');
    }
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        req.user.role = decoded.role; 
        next();   
    } catch (error) {
        return errorHandle('', res, "Invalid Token", 401, error.message);
    }
}

function checkRole(allowedRoles) {
    return async(req, res, next) => {
        const { role } = req.user;
        let roleName;
        if(role) {
            try {
                const roles = await Role.findById(role);
                roleName = roles.roleName;
            } catch (error) {
                return errorHandle('', res, "Role Not Found", 404, error.message);
            }
        } else {
            roleName = role;
        }
        if (!allowedRoles.includes(roleName)) {
            return errorHandle('', res, "Access Denied", 403, '');
        }
        next();
    };
}

module.exports = { verifyToken, checkRole }