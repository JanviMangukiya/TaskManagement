import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema({
  permissionName: {
    type: String,
    required: true,
    enum: ["Read", "Write", "Delete"],
  },
  description: {
    type: String,
  },
});

const Permission = mongoose.model("Permission", permissionSchema);
export default Permission;
