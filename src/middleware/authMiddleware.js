import jwt from 'jsonwebtoken';
import Role from '../models/roleModel.js';
import { errorHandle } from '../helper/helper.js';

/**
 * Middleware to verify JWT token
 * 
 * @param {Request} req -  Request object
 * @param {Response} res - Response object
 * @param {Function} next - Next middleware function
 */
function verifyToken(req, res, next) {
    let token = req.headers['authorization'];

    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7);
    }
    if (!token) {
        return errorHandle('', res, "Token Not Found", 404, '');
    }
    try {
        // Verify the token with the secret key
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        req.user.role = decoded.role;
        next();
    } catch (error) {
        return errorHandle('', res, "Invalid Token", 401, error.message);
    }
}

/**
 * Middleware to check user role
 * 
 * @param {Array<string>} allowedRoles - List of allowed roles 
 */
function checkRole(allowedRoles) {
    return async (req, res, next) => {
        const { role } = req.user;
        let roleName;
        if (role) {
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

export { verifyToken, checkRole };