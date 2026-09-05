const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const { isAdmin } = require('../middleware/auth');

// Protect all admin routes with isAdmin middleware
router.use(isAdmin);

// Admin Dashboard Overview
router.get('/', adminController.getDashboard);
router.get('/dashboard', adminController.getDashboard);

// Order Management
router.get('/orders', adminController.getAllOrders);
router.post('/order/:orderId/status', adminController.updateOrderStatus);

// Food Menu Management
router.get('/menu', adminController.getMenuManagement);
router.post('/menu/add', adminController.postAddFood);
router.post('/menu/:id/toggle', adminController.toggleFoodAvailability);
router.post('/menu/:id/delete', adminController.deleteFood);

// Customer Feedback & Inquiries
router.get('/feedback', adminController.getFeedbackList);

module.exports = router;
