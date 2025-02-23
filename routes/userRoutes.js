const express = require("express");
const session=require("express-session");
const User = require("../model/user");
const Order = require("../model/food");
const bcrypt = require("bcrypt");
const controller = require ("../controller/sitecontroller");
const bodyParser=require("body-parser");


const router = express();
const routes=express.Router();

// Middleware for parsing JSON and URL-encoded data
 router.use(bodyParser.json());
 router.use(bodyParser.urlencoded({ extended: false }));
 
router.use(express.static('views'))


router.set('view engine','ejs');
router.set('views','./views');

//set session
router.use(session({
    secret: 'user_session',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // for HTTPS only
}));
router.use((req, res, next) => { 
    // console.log(req.session); 
    next();
 });

router.get('/',(req,res)=>{
    res.render('home.ejs')
})
// Home page route
router.get('/home', (req, res) => {
    // Check if the user is logged in
    setTimeout(() => {
        if (req.session.userId) {
            // User is logged in, render the home page
            const userName = req.session.userId; // Get userName directly from session
            const userEmail = req.session.email; // Get userEmail directly from session
            res.render('home', { userName, userEmail }); // Pass both userName and userEmail in one call
        } else {
            // User is not logged in, redirect to login page
            res.redirect('/login');
        }
    }, 3000);
});
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out' });
        }
        res.redirect('/login'); // Redirect to login page after logout
    });
});

router.get('/register',controller.registerLoad);
// User Registration
router.post("/register",controller.register);

// load login and post
router.get( '/login',controller.LoadLogin);
router.post( '/login',controller.Login);

//load about page and render
router.get('/About',controller.LoadAbout);

// Mobile Number Verification for Forgot Password
router.post("/verify-mobile", async (req, res) => {
    const { mobileNumber } = req.body;
    const user = await User.findOne({ mobileNumber });

    if (!user) {
        return res.status(404).send("Mobile number not registered");
    }

    res.status(200).send("Mobile number verified");
});
router.get('/api/check-login', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, userId: req.session.email });
    } else {
        res.json({ loggedIn: false });
    }
});
router.post('/api/place-order',controller.isAuthenticated, async (req, res) => {
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
router.get('*', async (req, res) => {
    res.redirect('/')
});


module.exports = router;
