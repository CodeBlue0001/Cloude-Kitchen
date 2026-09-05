const express = require('express');
const router = express.Router();
const foodController = require('../controller/foodController');
const { isAuthenticated } = require('../middleware/auth');

// Menu / Home Page
router.get('/', foodController.getHome);
router.get('/home', foodController.getHome);
router.get('/menu', foodController.getHome);

// Foods API
router.get('/api/foods', foodController.getFoodItemsApi);

// Order Placement API (Authenticated)
router.post('/api/place-order', isAuthenticated, foodController.placeOrder);

// Customer Orders History & Live Tracking
router.get('/my-orders', isAuthenticated, foodController.getMyOrders);
router.get('/orders', isAuthenticated, foodController.getMyOrders);
router.get('/track-order/:orderId', foodController.trackOrder);
router.get('/order/:orderId', foodController.trackOrder);

// Cancel Order API
router.post('/api/order/:orderId/cancel', isAuthenticated, foodController.cancelOrder);

module.exports = router;