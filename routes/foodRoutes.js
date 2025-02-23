const express = require('express');
const Order = require('../model/food'); // Ensure this is the correct path to your Order model
const router = express.Router();

// Place Order API
router.post('/api/place-order', async (req, res) => {
    try {
        const { items, total } = req.body;

        // Validate the incoming data
        if (!items || !total) {
            return res.status(400).json({ success: false, message: 'Invalid order data' });
        }

        // Create a new order
        const newOrder = new Order({
            items,
            total
        });

        // Save the order to the database
        await newOrder.save();

        // Send a success response
        res.json({ success: true, message: 'Order placed successfully!' });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, message: 'Failed to place order' });
    }
});

module.exports = router;