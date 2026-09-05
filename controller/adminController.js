const Order = require('../model/order');
const Food = require('../model/food');
const User = require('../model/user');
const Contact = require('../model/contact');

// Admin Dashboard Overview
const getDashboard = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ orderStatus: { $in: ['Placed', 'Preparing', 'Out for Delivery'] } });
        const deliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
        const totalCustomers = await User.countDocuments({ role: 'customer' });
        const totalMenuItems = await Food.countDocuments();

        const revenueData = await Order.aggregate([
            { $match: { orderStatus: { $ne: 'Cancelled' } } },
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(8);

        res.render('admin/dashboard', {
            user: req.session.user,
            stats: {
                totalOrders,
                pendingOrders,
                deliveredOrders,
                totalCustomers,
                totalMenuItems,
                totalRevenue
            },
            recentOrders,
            pageTitle: 'Admin Dashboard - Cloud Kitchen'
        });
    } catch (error) {
        console.error('Admin Dashboard error:', error);
        res.status(500).redirect('/');
    }
};

// Admin View All Orders
const getAllOrders = async (req, res) => {
    try {
        const { status } = req.query;
        let filter = {};
        if (status && status !== 'All') {
            filter.orderStatus = status;
        }

        const orders = await Order.find(filter).sort({ createdAt: -1 });

        res.render('admin/orders', {
            user: req.session.user,
            orders,
            currentStatus: status || 'All',
            pageTitle: 'Manage Orders - Admin Portal'
        });
    } catch (error) {
        console.error('Admin Orders error:', error);
        res.status(500).redirect('/admin');
    }
};

// Update Order Status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['Placed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status provided.' });
        }

        const order = await Order.findOneAndUpdate(
            { orderId },
            { orderStatus: status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        return res.json({ success: true, message: `Order status updated to ${status}`, order });
    } catch (error) {
        console.error('Update status error:', error);
        return res.status(500).json({ success: false, message: 'Server error updating status.' });
    }
};

// Admin Menu Management Page
const getMenuManagement = async (req, res) => {
    try {
        const foods = await Food.find().sort({ category: 1, name: 1 });
        const categories = ['Biryani & Rice', 'Fast Food', 'Main Course', 'Breakfast & Snacks', 'South Indian', 'Desserts & Drinks'];

        res.render('admin/menu', {
            user: req.session.user,
            foods,
            categories,
            pageTitle: 'Menu Management - Admin Portal'
        });
    } catch (error) {
        console.error('Menu management error:', error);
        res.status(500).redirect('/admin');
    }
};

// Add New Food Item
const postAddFood = async (req, res) => {
    try {
        const { name, category, price, description, isVeg, image, prepTime } = req.body;

        if (!name || !category || !price) {
            return res.status(400).json({ success: false, message: 'Name, Category, and Price are required.' });
        }

        const newFood = new Food({
            name: name.trim(),
            category,
            price: parseFloat(price),
            description: description ? description.trim() : '',
            isVeg: isVeg === 'true' || isVeg === true,
            image: image || '/images/biriyani.jpeg',
            prepTime: prepTime || '20-30 min',
            isAvailable: true
        });

        await newFood.save();

        return res.json({ success: true, message: 'New food item added successfully!' });
    } catch (error) {
        console.error('Add food error:', error);
        return res.status(500).json({ success: false, message: 'Failed to add food item.' });
    }
};

// Toggle Food Availability
const toggleFoodAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const food = await Food.findById(id);

        if (!food) {
            return res.status(404).json({ success: false, message: 'Food item not found.' });
        }

        food.isAvailable = !food.isAvailable;
        await food.save();

        return res.json({ 
            success: true, 
            message: `${food.name} is now ${food.isAvailable ? 'Available' : 'Out of Stock'}.`,
            isAvailable: food.isAvailable 
        });
    } catch (error) {
        console.error('Toggle food error:', error);
        return res.status(500).json({ success: false, message: 'Failed to toggle availability.' });
    }
};

// Delete Food Item
const deleteFood = async (req, res) => {
    try {
        const { id } = req.params;
        await Food.findByIdAndDelete(id);
        return res.json({ success: true, message: 'Food item deleted successfully.' });
    } catch (error) {
        console.error('Delete food error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete food item.' });
    }
};

// Admin View Customer Messages / Inquiries
const getFeedbackList = async (req, res) => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });

        res.render('admin/feedback', {
            user: req.session.user,
            messages,
            pageTitle: 'Customer Inquiries & Feedback - Admin Portal'
        });
    } catch (error) {
        console.error('Admin feedback error:', error);
        res.status(500).redirect('/admin');
    }
};

module.exports = {
    getDashboard,
    getAllOrders,
    updateOrderStatus,
    getMenuManagement,
    postAddFood,
    toggleFoodAvailability,
    deleteFood,
    getFeedbackList
};
