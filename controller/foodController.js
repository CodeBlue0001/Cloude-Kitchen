const Food = require('../model/food');
const Order = require('../model/order');

// Render Home & Menu Page
const getHome = async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = { isAvailable: true };

        if (category && category !== 'All') {
            query.category = category;
        }

        if (search) {
            query.name = { $regex: search.trim(), $options: 'i' };
        }

        const foods = await Food.find(query).sort({ rating: -1 });
        const allCategories = ['All', 'Biryani & Rice', 'Fast Food', 'Main Course', 'Breakfast & Snacks', 'South Indian', 'Desserts & Drinks'];

        res.render('home', {
            foods,
            allCategories,
            currentCategory: category || 'All',
            searchQuery: search || '',
            user: req.session.user || null,
            pageTitle: 'Cloud Kitchen - Fresh Food Delivered'
        });
    } catch (error) {
        console.error('Home page error:', error);
        res.status(500).render('error', { message: 'Failed to load menu' });
    }
};

// API to get food items JSON
const getFoodItemsApi = async (req, res) => {
    try {
        const foods = await Food.find({ isAvailable: true });
        res.json({ success: true, foods });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching foods' });
    }
};

// API: Place an Order
const placeOrder = async (req, res) => {
    try {
        const { items, deliveryAddress, paymentMethod, couponCode, orderNotes } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Your cart is empty. Please add items.' });
        }

        if (!deliveryAddress || deliveryAddress.trim() === '') {
            return res.status(400).json({ success: false, message: 'Please provide a valid delivery address.' });
        }

        const user = req.session.user;
        if (!user) {
            return res.status(401).json({ success: false, message: 'Please log in to place an order.' });
        }

        // Calculate Subtotal
        let subtotal = 0;
        const formattedItems = [];

        for (const item of items) {
            const qty = parseInt(item.quantity) || 1;
            const price = parseFloat(item.price);
            subtotal += price * qty;
            formattedItems.push({
                foodId: item.foodId || null,
                name: item.name,
                price: price,
                quantity: qty,
                image: item.image || '/images/biriyani.jpeg'
            });
        }

        // Apply discount coupon if valid
        let discount = 0;
        if (couponCode) {
            const code = couponCode.trim().toUpperCase();
            if (code === 'COLLEGE50' && subtotal >= 150) {
                discount = 50;
            } else if (code === 'WELCOME20') {
                discount = Math.round(subtotal * 0.20);
            } else if (code === 'FREEDEL') {
                discount = 30; // Free delivery
            }
        }

        const deliveryFee = subtotal >= 300 ? 0 : 30;
        const tax = Math.round((subtotal - discount) * 0.05); // 5% GST
        const totalAmount = Math.max(0, subtotal - discount + deliveryFee + tax);

        // Generate unique Order ID e.g. CK-4892
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const orderId = `CK-${randomNum}`;

        const newOrder = new Order({
            orderId,
            userId: user.id,
            customerName: user.name || `${user.firstName} ${user.lastName}`,
            customerEmail: user.email,
            customerPhone: user.mobile || 'Not Provided',
            deliveryAddress: deliveryAddress.trim(),
            items: formattedItems,
            subtotal,
            discount,
            deliveryFee,
            tax,
            totalAmount,
            paymentMethod: paymentMethod || 'COD',
            paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
            orderStatus: 'Placed',
            orderNotes: orderNotes || '',
            estimatedDelivery: '30-40 mins'
        });

        await newOrder.save();

        return res.status(200).json({
            success: true,
            message: 'Order placed successfully! 🍕',
            orderId: newOrder.orderId,
            order: newOrder
        });
    } catch (error) {
        console.error('Order placement error:', error);
        return res.status(500).json({ success: false, message: 'Server error while placing order. Please try again.' });
    }
};

// Render Customer Orders Page
const getMyOrders = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });

        res.render('orders', {
            orders,
            user: req.session.user,
            pageTitle: 'My Orders - Cloud Kitchen'
        });
    } catch (error) {
        console.error('My Orders error:', error);
        res.status(500).redirect('/');
    }
};

// Render Live Order Tracking Page
const trackOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).render('error', { 
                message: `Order #${orderId} not found. Please check your order ID.` 
            });
        }

        res.render('order-track', {
            order,
            user: req.session.user || null,
            pageTitle: `Track Order #${order.orderId}`
        });
    } catch (error) {
        console.error('Track order error:', error);
        res.status(500).redirect('/my-orders');
    }
};

// User Cancel Order
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.session.user.id;

        const order = await Order.findOne({ orderId, userId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        if (order.orderStatus !== 'Placed') {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot cancel order in '${order.orderStatus}' status. Kitchen has already started preparing it!` 
            });
        }

        order.orderStatus = 'Cancelled';
        await order.save();

        return res.json({ success: true, message: 'Order cancelled successfully.' });
    } catch (error) {
        console.error('Cancel order error:', error);
        return res.status(500).json({ success: false, message: 'Failed to cancel order.' });
    }
};

module.exports = {
    getHome,
    getFoodItemsApi,
    placeOrder,
    getMyOrders,
    trackOrder,
    cancelOrder
};
