const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {type: String, unique: true, required: true, lowercase: true},
    username: {type: String, unique: true, required: true, lowercase: true},
    password: {type: String, required: true},
    name: {
        firstName: String,
        lastName: String,
    },
    image: {
        data: { type: Buffer, required: true },
        contentType: { type: String, required: true },
      },
    address: String,
    superUser: { 
        isSuper: {type: Boolean, required: true, default: false},
        discount: {type: Number, required: true},
    },
    isActive: {type: Boolean, required: true, default: true},
  },
  { collection: "users", timestamps: { createdAt: true, updatedAt: true } }
);

mongoose.model("user", userSchema);
