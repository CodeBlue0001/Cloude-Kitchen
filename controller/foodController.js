const Food = require('../model/food');
const Order = require('../model/order');
const mongoose = require('mongoose');

// Fallback initial dishes when DB is empty or connecting
const defaultFoods = [
    {
        _id: 'sample-1',
        name: "Hyderabadi Chicken Biryani",
        category: "Biryani & Rice",
        price: 180,
        description: "Aromatic basmati rice cooked with succulent chicken pieces, rich saffron and traditional spices.",
        image: "/images/biriyani.jpeg",
        isVeg: false,
        rating: 4.8,
        prepTime: "25-35 min",
        isAvailable: true
    },
    {
        _id: 'sample-2',
        name: "Schezwan Veg Fried Rice",
        category: "Biryani & Rice",
        price: 130,
        description: "Wok-tossed long-grain rice with crisp garden vegetables in spicy schezwan sauce.",
        image: "/images/frid rice.jpeg",
        isVeg: true,
        rating: 4.5,
        prepTime: "15-20 min",
        isAvailable: true
    },
    {
        _id: 'sample-3',
        name: "Farmhouse Cheese Burst Pizza",
        category: "Fast Food",
        price: 260,
        description: "Crispy crust loaded with mozzarella cheese, bell peppers, sweet corn, mushrooms, and olives.",
        image: "/images/pizza.jpeg",
        isVeg: true,
        rating: 4.7,
        prepTime: "20-25 min",
        isAvailable: true
    },
    {
        _id: 'sample-4',
        name: "Royal Bengali Kochori Platter",
        category: "Breakfast & Snacks",
        price: 70,
        description: "Fluffy deep-fried kachoris stuffed with spiced lentils served with savory potato curry and pickle.",
        image: "/images/kochori.jpeg",
        isVeg: true,
        rating: 4.6,
        prepTime: "15 min",
        isAvailable: true
    },
    {
        _id: 'sample-5',
        name: "Deluxe Non-Veg Grand Thali",
        category: "Main Course",
        price: 290,
        description: "Complete royal meal featuring Chicken Curry, Fish Fry, Dal Makhani, Rice, Roti, Salad & Sweet.",
        image: "/images/thali.jpeg",
        isVeg: false,
        rating: 4.9,
        prepTime: "30 min",
        isAvailable: true
    },
    {
        _id: 'sample-6',
        name: "South Indian Masala Dosa Combo",
        category: "South Indian",
        price: 120,
        description: "Crispy golden crepe filled with spiced potato masala, served with piping hot sambar & coconut chutney.",
        image: "/images/south.jpeg",
        isVeg: true,
        rating: 4.7,
        prepTime: "15-20 min",
        isAvailable: true
    },
    {
        _id: 'sample-7',
        name: "Paneer Butter Masala",
        category: "Main Course",
        price: 190,
        description: "Fresh cottage cheese cubes simmered in a rich, creamy tomato and cashew nut gravy.",
        image: "/images/thali.jpeg",
        isVeg: true,
        rating: 4.8,
        prepTime: "20 min",
        isAvailable: true
    },
    {
        _id: 'sample-8',
        name: "Hot Gulab Jamun (2 Pcs)",
        category: "Desserts & Drinks",
        price: 60,
        description: "Soft melt-in-mouth milk dumplings soaked in cardamom infused sugar syrup.",
        image: "/images/kochori.jpeg",
        isVeg: true,
        rating: 4.9,
        prepTime: "5-10 min",
        isAvailable: true
    }
];

// Render Home & Menu Page
const getHome = async (req, res) => {
    try {
        const { category, search } = req.query;
        let foods = [];

        // Try querying MongoDB if connected
        try {
            if (mongoose.connection.readyState === 1) {
                let query = { isAvailable: true };

                if (category && category !== 'All') {
                    query.category = category;
                }

                if (search) {
                    query.name = { $regex: search.trim(), $options: 'i' };
                }

                foods = await Food.find(query).sort({ rating: -1 }).maxTimeMS(2500);
            }
        } catch (dbErr) {
            console.warn("Database query skipped or timed out:", dbErr.message);
        }

        // Use fallback if foods collection is empty or DB not yet connected
        if (!foods || foods.length === 0) {
            foods = defaultFoods.filter(f => {
                let matchesCategory = true;
                let matchesSearch = true;

                if (category && category !== 'All') {
                    matchesCategory = f.category === category;
                }
                if (search) {
                    matchesSearch = f.name.toLowerCase().includes(search.trim().toLowerCase());
                }
                return matchesCategory && matchesSearch;
            });
        }

        const allCategories = ['All', 'Biryani & Rice', 'Fast Food', 'Main Course', 'Breakfast & Snacks', 'South Indian', 'Desserts & Drinks'];

        res.render('home', {
            foods,
            allCategories,
            currentCategory: category || 'All',
            searchQuery: search || '',
            user: req.session ? req.session.user : null,
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
        let foods = [];
        if (mongoose.connection.readyState === 1) {
            foods = await Food.find({ isAvailable: true }).maxTimeMS(2000);
        }
        if (!foods || foods.length === 0) {
            foods = defaultFoods;
        }
        res.json({ success: true, foods });
    } catch (error) {
        res.json({ success: true, foods: defaultFoods });
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

        const user = req.session ? req.session.user : null;
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
                foodId: (item.foodId && item.foodId.length === 24) ? item.foodId : null,
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
                discount = 30;
            }
        }

        const deliveryFee = subtotal >= 300 ? 0 : 30;
        const tax = Math.round((subtotal - discount) * 0.05);
        const totalAmount = Math.max(0, subtotal - discount + deliveryFee + tax);

        // Generate unique Order ID e.g. CK-4892
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const orderId = `CK-${randomNum}`;

        const newOrder = new Order({
            orderId,
            userId: (user.id && user.id.length === 24) ? user.id : null,
            customerName: user.name || `${user.firstName || 'Customer'} ${user.lastName || ''}`,
            customerEmail: user.email || 'customer@example.com',
            customerPhone: user.mobile || '9876543210',
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

        if (mongoose.connection.readyState === 1) {
            await newOrder.save();
        }

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
        const userId = req.session && req.session.user ? req.session.user.id : null;
        let orders = [];
        if (userId && mongoose.connection.readyState === 1) {
            orders = await Order.find({ userId }).sort({ createdAt: -1 });
        }

        res.render('orders', {
            orders,
            user: req.session ? req.session.user : null,
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
        let order = null;
        if (mongoose.connection.readyState === 1) {
            order = await Order.findOne({ orderId });
        }

        if (!order) {
            // Mock sample order if requested for preview
            order = {
                orderId: orderId || 'CK-1001',
                customerName: req.session && req.session.user ? req.session.user.name : 'Customer',
                customerPhone: '9876543210',
                deliveryAddress: 'Campus Block B, Tech Area',
                items: [{ name: 'Hyderabadi Chicken Biryani', price: 180, quantity: 1, image: '/images/biriyani.jpeg' }],
                subtotal: 180,
                discount: 0,
                deliveryFee: 30,
                tax: 9,
                totalAmount: 219,
                paymentMethod: 'COD',
                orderStatus: 'Preparing',
                estimatedDelivery: '25-35 mins'
            };
        }

        res.render('order-track', {
            order,
            user: req.session ? req.session.user : null,
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
        const userId = req.session && req.session.user ? req.session.user.id : null;

        let order = null;
        if (mongoose.connection.readyState === 1) {
            order = await Order.findOne({ orderId, userId });
        }

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        if (order.orderStatus !== 'Placed') {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot cancel order in '${order.orderStatus}' status.` 
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
