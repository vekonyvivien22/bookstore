const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true }
  },
  { collection: "categories", timestamps: { createdAt: true, updatedAt: true } }
);

mongoose.model("category", categorySchema);
