// // model/food.js
// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema({
//     consumer: { type: String, required: true },
//     address: { type: String, required: true },
//     number: { type: String, required: true },
//     items: { type: [String], required: true }, // Array of item names
//     total: { type: Number, required: true } // Total price
// });

// const Order = mongoose.model('Order', orderSchema);
// module.exports = Order;
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    items: { type: [String], required: true }, // Array of item names
    total: { type: Number, required: true } // Total price
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;