const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    image: {
      data: { type: Buffer, required: true },
      contentType: { type: String, required: true },
    },
    description: { type: String, required: true },
    publicationDate: { type: Number, required: true, max: 2023 },
    // size: { type: Number, required: true },
    numberOfPages: { type: Number, required: true },
    // binding: {type: Number, required: true},
    price: { type: Number, required: true },
    rating: { type: Number, required: false },
    publisherName: { type: String, required: true },
    authors: [
      new mongoose.Schema({
        name: { type: String, required: true },
      }),
    ],
    categories: [
      new mongoose.Schema({
        name: { type: String, required: true },
      }),
    ],
  },
  { collection: "books", timestamps: { createdAt: true, updatedAt: true } }
);

mongoose.model("book", bookSchema);
