import mongoose from 'mongoose';
import './permissionModel.js';

const roleSchema = new mongoose.Schema({
    roleName: {
        type: String,
        required: true,
        enum: ['Admin', 'User']
    },
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }]
});

const Role = mongoose.model('Role', roleSchema);
export default Role;