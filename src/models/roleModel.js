const mongoose = require('mongoose');
require('./permissionModel')

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
module.exports = Role;