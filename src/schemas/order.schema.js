const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userID: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    shippingName: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
    },
    shippingMethod: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    orderDate: { type: Date, required: true, default: Date.now },
    total: { type: Number, required: true },
    status: { type: String, required: true, default: 'Placed order.' },
    items: [
      new mongoose.Schema({
        bookId: { type: String, required: true },
        quantity: { type: Number, required: true },
      }),
    ],
  },
  { collection: 'orders', timestamps: { createdAt: true, updatedAt: true } },
);

mongoose.model('order', orderSchema);
