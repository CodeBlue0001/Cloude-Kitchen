const User = require('../model/user');
const bcrypt = require('bcrypt');

// Render Login page
const getLogin = (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { error: null, success: null });
};

// Handle Login POST
const postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'No account found with this email.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect password. Please try again.' });
        }

        // Set session user object
        req.session.user = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            mobile: user.mobileNumber,
            address: user.homeAddress,
            role: user.role || 'customer'
        };

        return res.status(200).json({ 
            success: true, 
            message: 'Login successful! Welcome back.', 
            user: req.session.user 
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error during login.' });
    }
};

// Render Register page
const getRegister = (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('register', { error: null });
};

// Handle Register POST
const postRegister = async (req, res) => {
    try {
        const { firstName, lastName, email, mobileNumber, password, homeAddress } = req.body;

        if (!firstName || !lastName || !email || !mobileNumber || !password || !homeAddress) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        const existingUser = await User.findOne({ 
            $or: [
                { email: email.trim().toLowerCase() }, 
                { mobileNumber: mobileNumber.trim() }
            ] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email or Mobile Number is already registered.' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            mobileNumber: mobileNumber.trim(),
            homeAddress: homeAddress.trim(),
            password: hashedPassword,
            role: 'customer'
        });

        await newUser.save();

        return res.status(201).json({ 
            success: true, 
            message: 'Account registered successfully! You can now login.' 
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, message: 'Error registering account. Please try again.' });
    }
};

// Handle Logout
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
};

// Render Forgot Password page
const getForgotPassword = (req, res) => {
    res.render('forgot-password');
};

// Verify Mobile or Email for Forgot Password
const postVerifyMobile = async (req, res) => {
    try {
        const { identifier } = req.body; // Can be mobile or email
        if (!identifier) {
            return res.status(400).json({ success: false, message: 'Please enter registered mobile number or email.' });
        }

        const user = await User.findOne({
            $or: [
                { mobileNumber: identifier.trim() },
                { email: identifier.trim().toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'No registered user found with these details.' });
        }

        // Store reset state in session
        req.session.resetUserId = user._id;

        return res.status(200).json({ 
            success: true, 
            message: 'Account verified! Please proceed to set a new password.',
            userId: user._id 
        });
    } catch (error) {
        console.error('Verify error:', error);
        return res.status(500).json({ success: false, message: 'Server error verifying details.' });
    }
};

// Render Reset Password page
const getResetPassword = (req, res) => {
    if (!req.session.resetUserId) {
        return res.redirect('/forgot-password');
    }
    res.render('reset-password');
};

// Handle Reset Password POST
const postResetPassword = async (req, res) => {
    try {
        const userId = req.session.resetUserId;
        const { newPassword, confirmPassword } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'Session expired. Please start over.' });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        delete req.session.resetUserId;

        return res.status(200).json({ success: true, message: 'Password reset successfully! Please login.' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ success: false, message: 'Server error resetting password.' });
    }
};

// Profile Page
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);
        if (!user) {
            return res.redirect('/login');
        }
        res.render('profile', { user, pageTitle: 'My Profile - Cloud Kitchen' });
    } catch (error) {
        console.error('Profile error:', error);
        res.redirect('/');
    }
};

// Update Profile
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, mobileNumber, homeAddress } = req.body;
        const userId = req.session.user.id;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { firstName, lastName, mobileNumber, homeAddress },
            { new: true }
        );

        // Update session
        req.session.user.firstName = updatedUser.firstName;
        req.session.user.lastName = updatedUser.lastName;
        req.session.user.name = `${updatedUser.firstName} ${updatedUser.lastName}`;
        req.session.user.mobile = updatedUser.mobileNumber;
        req.session.user.address = updatedUser.homeAddress;

        return res.status(200).json({ success: true, message: 'Profile updated successfully!', user: req.session.user });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
};

// Check Auth Status API
const checkAuth = (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ loggedIn: true, user: req.session.user });
    }
    return res.json({ loggedIn: false, user: null });
};

module.exports = {
    getLogin,
    postLogin,
    getRegister,
    postRegister,
    logout,
    getForgotPassword,
    postVerifyMobile,
    getResetPassword,
    postResetPassword,
    getProfile,
    updateProfile,
    checkAuth
};
