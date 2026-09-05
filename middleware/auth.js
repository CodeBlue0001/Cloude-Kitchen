// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    // Check if it's an API request
    if (req.xhr || req.headers.accept?.indexOf('json') > -1 || req.path.startsWith('/api/')) {
        return res.status(401).json({ success: false, message: 'Please login to continue.' });
    }
    return res.redirect('/login');
};

// Middleware to check if user is an Admin
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    if (req.xhr || req.headers.accept?.indexOf('json') > -1 || req.path.startsWith('/api/')) {
        return res.status(403).json({ success: false, message: 'Access denied. Admin rights required.' });
    }
    return res.redirect('/login');
};

module.exports = {
    isAuthenticated,
    isAdmin
};
