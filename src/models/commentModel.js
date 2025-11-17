const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    comment: {
        type: String,
    },
    isLiked: {
        type: Boolean,
        default: false
    },
    likedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
    }]
}, {timestamps: true} );

module.exports = mongoose.model("Comment", commentSchema);
