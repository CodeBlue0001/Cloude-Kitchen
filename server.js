const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const foodRoutes = require("./routes/foodRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Body Parsers Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static Assets
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "views")));

// View Engine Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Session Configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET || "cloud_kitchen_secure_secret_key_2026",
        resave: false,
        saveUninitialized: false,
        cookie: { 
            secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE === "true",
            maxAge: 1000 * 60 * 60 * 24 // 24 hours
        }
    })
);

// Global Template Variables
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.currentPath = req.path;
    next();
});

// MongoDB Connection with Serverless Connection Caching
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cloud-kitchen";

let isDbConnected = false;
const connectDB = async () => {
    if (isDbConnected || mongoose.connection.readyState >= 1) {
        isDbConnected = true;
        return;
    }
    try {
        const db = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000
        });
        isDbConnected = db.connections[0].readyState === 1;
        console.log("✓ Connected to MongoDB");
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
    }
};

// Middleware to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
    if (!isDbConnected && mongoose.connection.readyState !== 1) {
        await connectDB();
    }
    next();
});

// Connect on server startup
connectDB();

// Routes
app.use("/admin", adminRoutes);
app.use("/", foodRoutes);
app.use("/", userRoutes);

// 404 Error Page Handler
app.use((req, res) => {
    res.status(404).render("error", { 
        message: "Oops! The page you are looking for does not exist.",
        user: req.session ? req.session.user : null,
        pageTitle: "404 - Page Not Found" 
    });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Server Error:", err);
    res.status(500).render("error", { 
        message: "Something went wrong on our end. Please try again later.",
        user: req.session ? req.session.user : null,
        pageTitle: "500 - Server Error"
    });
});

// Start local server if not running in Vercel serverless environment
if (process.env.VERCEL !== "1" && !process.env.VERCEL_ENV) {
    app.listen(PORT, () => {
        console.log(`\n==============================================`);
        console.log(`🚀 Cloud Kitchen Server running on http://localhost:${PORT}`);
        console.log(`👨‍🍳 Customer Portal: http://localhost:${PORT}`);
        console.log(`🛠️  Admin Portal:    http://localhost:${PORT}/admin`);
        console.log(`==============================================\n`);
    });
}

// Export for Vercel Serverless Functions
module.exports = app;