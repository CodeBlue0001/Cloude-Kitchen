const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { 
        type: String, 
        required: true, 
        enum: ['Biryani & Rice', 'Fast Food', 'Main Course', 'Breakfast & Snacks', 'South Indian', 'Desserts & Drinks'],
        default: 'Main Course'
    },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    image: { type: String, default: '/images/biriyani.jpeg' },
    isVeg: { type: Boolean, default: true },
    rating: { type: Number, default: 4.5 },
    prepTime: { type: String, default: '20-30 min' },
    isAvailable: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const Food = mongoose.model('Food', foodSchema);
module.exports = Food;