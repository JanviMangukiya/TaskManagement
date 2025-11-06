const mongoose = require('mongoose');
require('./roleModel');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    birthDate: {
        type: Date
    },
    email: {
        type: String,
        required: true
    },
    contact: {
        type: String
    },
    password: {
        type: String
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;