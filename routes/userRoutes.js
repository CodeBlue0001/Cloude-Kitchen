const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const siteController = require('../controller/sitecontroller');
const { isAuthenticated } = require('../middleware/auth');

// Authentication routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

router.get('/logout', authController.logout);

// Forgot & Reset Password routes
router.get('/forgot-password', authController.getForgotPassword);
router.post('/verify-mobile', authController.postVerifyMobile);
router.get('/reset-password', authController.getResetPassword);
router.post('/reset-password', authController.postResetPassword);

// User Profile routes
router.get('/profile', isAuthenticated, authController.getProfile);
router.post('/profile/update', isAuthenticated, authController.updateProfile);

// API Auth Status Check
router.get('/api/check-login', authController.checkAuth);

// Site Pages
router.get('/about', siteController.getAbout);
router.get('/About', (req, res) => res.redirect('/about')); // Backward compatibility
router.get('/contact', siteController.getContact);
router.post('/api/contact', siteController.postContact);

module.exports = router;
