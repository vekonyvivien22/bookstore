const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    storeStock: [
      new mongoose.Schema({
        bookId: { type: String, required: true },
        quantity: { type: Number, required: true }
      }),
    ],
  },
  { collection: "stores", timestamps: { createdAt: true, updatedAt: true } }
);

mongoose.model("store", storeSchema);