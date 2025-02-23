const User = require('../model/user');
const Order=require('../model/food');
const bcrypt = require('bcrypt');
const session = require('express-session');

// Render the registration page
const registerLoad = async (req, res) => {
    try {
        res.render('register');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

// Handle user registration
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, mobileNumber, password, homeaddress } = req.body;

        // Check if the user already exists
        const existingUser  = await User.findOne({ $or: [{ email }, { mobileNumber }] });
        if (existingUser ) {
            return res.render('register', {
                message: 'Email or Mobile Number already registered',
            });
        }

        // Encrypt the password
        const encryptedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new User({
            firstName,
            lastName,
            email,
            mobileNumber,
            password: encryptedPassword,
            homeaddress,
        });

        // Save the user to the database
        await user.save();

        // Success message
        // console.log('Message to render controller side print:');
        

        return res.status(100).json({ message: 'Registration successful' });

        
    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error on registration request');
    }
};

const LoadLogin =async(req,res)=>{
    try{
        res.render('login');
    }catch(error){
        console.log(error);
        res.status(510).send('Login Page Error');
    }
};
const Login = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        // console.log("Email"+email+" password"+password);


        // Check if the user exists
        const user = await User.findOne({ email: email });
        if (user) {
            // Compare the password with the stored hashed password
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                // const token = email; // Use a proper token generation method (e.g., JWT)
                // Set session variables
                req.session.userId = user._id; // Store user ID in session
                req.session.email = user.email;
                req.session.UserData=user;
                console.log("Login successful");
               

                // Send the token in the response
                return res.status(200).json({ token:String(email), message: 'Login successful' });
            } else {
                return res.status(401).json({ message: 'Invalid password' }); // Invalid password
            }
        } else {
            return res.status(404).json({ message: 'User  not found' }); // User not found
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const  LoadAbout=async(req, res)=>{
    try {
        res.render('about');
    } catch (error) {
        console.log(error);
        
    }
};
// orders and controllers of order delivery

const  LoadOrders=async(req, res)=>{
    try {
        const user=req.session.user;
        const consumer= user.name;
        const address=user.Homeaddress;
        const number=user.mobileNumber;
        //request order
        const order=req.body;
        const newOrder=new Order({
            consumer,
            address,
            number,
            order,
        });
    } catch (error) {
        
    }
};
// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        // User is authenticated, proceed to the next middleware/route handler
        return next();
    } else {
        // User is not authenticated, redirect to login page or send an error
        return res.status(401).json({ message: 'Unauthorized access. Please log in.' });
    }
};

// Export the controller functions
module.exports = {
    registerLoad,
    register,
    LoadLogin,
    Login,
    LoadAbout,
    LoadOrders,
    isAuthenticated
    
 
};
