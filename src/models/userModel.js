import mongoose from "mongoose";
import bcrypt from "bcrypt";
import "./roleModel.js";

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  birthDate: {
    type: Date,
  },
  email: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
  },
  password: {
    type: String,
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

userSchema.pre("save", function (next) {
  try {
    const hashPassword = bcrypt.hash(this.password, 10);
    this.password = hashPassword;
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
