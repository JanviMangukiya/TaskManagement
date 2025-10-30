const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    permissionName: {
        type: String,
        required: true,
        enum: ['Read', 'Write', 'Delete']
    },
    description: {
        type: String
    }
});

const Permission = mongoose.model('Permission', permissionSchema);
module.exports = Permission;