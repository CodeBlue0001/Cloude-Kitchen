# 🍲 Cloud Kitchen Management & Online Food Delivery System
> **Academic Minor Project** | Department of Computer Science & Engineering  
> *A full-stack, session-authenticated web application for smart cloud kitchen order processing, real-time status tracking, and kitchen operations management.*

---

## 📌 Executive Summary & Abstract

Traditional restaurant management systems incur heavy infrastructure and dining hall maintenance overheads. The **Cloud Kitchen (Ghost/Dark Kitchen) Management System** is a modern web-based food delivery and kitchen automation platform built to streamline the direct-to-consumer delivery model.

This project implements a complete end-to-end food ordering pipeline:
1. **Interactive Customer Menu**: Category-based filtering, keyword search, dynamic cart tray with discount promo codes (`COLLEGE50`, `WELCOME20`).
2. **Session Authentication & Security**: Password hashing using **Bcrypt**, session-based access control, mobile/email identity verification, and multi-step password recovery.
3. **Live Order Tracking**: 4-stage visual order progress timeline (*Placed ➔ In The Kitchen ➔ Out for Delivery ➔ Delivered*).
4. **Kitchen Admin Control Center**: Metrics dashboard, order status updater, dynamic menu CRUD manager (add dish, toggle in/out of stock, delete dish), and customer feedback reviewer.

---

## 🛠️ Technology Stack

| Layer | Technology Used | Purpose |
|---|---|---|
| **Backend Runtime** | **Node.js** | Non-blocking, event-driven server runtime |
| **Web Framework** | **Express.js (v4.21)** | RESTful routing, middleware, session management |
| **Database** | **MongoDB & Mongoose (v8.8)** | NoSQL schema modeling for Users, Foods, Orders, Inquiries |
| **View Engine** | **EJS (Embedded JavaScript)** | Server-side template rendering with reusable component partials |
| **Security & Auth** | **Bcrypt & Express-Session** | Cryptographic password hashing & server-side session management |
| **Frontend Styling** | **Vanilla CSS3 & Google Fonts** | Modern responsive design system (*Outfit* & *Plus Jakarta Sans*) |
| **Client Scripting** | **Vanilla JS (ES6+) & LocalStorage** | Cart state persistence, coupon engine, dynamic modal dialogs |

---

## ✨ Key Features & Modules

### 1. 👤 Customer Module
- **Browse & Search Menu**: Filter across 6 cuisines (*Biryani & Rice, Fast Food, Main Course, Breakfast & Snacks, South Indian, Desserts*).
- **Interactive Cart & Promo Engine**:
  - Quantity steppers (`+` / `-` / `Remove`).
  - Automatic discount calculations (`COLLEGE50` for ₹50 off, `WELCOME20` for 20% off).
  - Breakdown of Subtotal, 5% GST, and Delivery fee (Free above ₹300).
- **Checkout & Multi-Payment Modes**: Supports Cash on Delivery (COD) and Online/UPI mock payment.
- **Visual Order Tracking**: Step-by-step progress timeline for active kitchen orders.
- **Account & Profile Management**: Update delivery address, contact number, and view order history.
- **Forgot & Reset Password**: 2-step account recovery via registered phone/email.

### 2. 👨‍🍳 Kitchen Admin Portal (`/admin`)
- **Operations Dashboard**: Real-time revenue metrics, total orders, active kitchen queue, and registered customer count.
- **Order Pipeline Manager**: Update status (*Placed ➔ Preparing ➔ Out for Delivery ➔ Delivered ➔ Cancelled*) with instant database synchronization.
- **Menu Management (CRUD)**:
  - Add new dishes with custom categories, prices, veg/non-veg tags, and images.
  - Toggle live dish availability (*In Stock / Out of Stock*).
  - Delete discontinued food items.
- **Customer Feedback & Inquiries**: Review submissions from the contact portal.

---

## 🗄️ Database Schemas & Collections

### 1. `User` Schema
```javascript
{
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobileNumber: { type: String, required: true, unique: true },
  homeAddress: { type: String, required: true },
  password: { type: String, required: true }, // Bcrypt hashed
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  createdAt: { type: Date, default: Date.now }
}
```

### 2. `Food` Schema
```javascript
{
  name: { type: String, required: true },
  category: { type: String, enum: ['Biryani & Rice', 'Fast Food', 'Main Course', 'Breakfast & Snacks', 'South Indian', 'Desserts & Drinks'] },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  isVeg: { type: Boolean, default: true },
  rating: { type: Number, default: 4.5 },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}
```

### 3. `Order` Schema
```javascript
{
  orderId: { type: String, required: true, unique: true }, // e.g. CK-4550
  userId: { type: ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  items: [{ name: String, price: Number, quantity: Number, image: String }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 30 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['COD', 'UPI', 'CARD'], default: 'COD' },
  orderStatus: { type: String, enum: ['Placed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'], default: 'Placed' },
  createdAt: { type: Date, default: Date.now }
}
```

---

## 🚀 Setup & Execution Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (running on `mongodb://127.0.0.1:27017`)

### 1. Installation
```bash
# Clone or navigate to the project directory
cd Cloude-Kitchen

# Install dependencies
npm install
```

### 2. Populate Sample Data (Menu, Admin & Sample Orders)
```bash
npm run seed
```

### 3. Start the Application
```bash
npm start
# OR
npm run server
```

The application will be accessible at:
- **Customer Web Portal**: `http://localhost:5000`
- **Kitchen Admin Dashboard**: `http://localhost:5000/admin`

---

## 🔑 Demo Credentials (For Presentation & Testing)

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Kitchen Admin** | `admin@cloudkitchen.com` | `admin123` | Full admin dashboard, menu CRUD, order status changes |
| **Customer** | `john@example.com` | `user123` | Ordering food, applying coupons, live tracking |

*(Note: The login page also features 1-click **Quick Fill Demo** buttons for quick demonstration during college viva/reviews.)*

---

## 📡 API Endpoints Reference

### Customer & Authentication
- `GET /` - Main menu & food catalog
- `POST /login` - User authentication (Customer & Admin)
- `POST /register` - New user account creation
- `GET /logout` - Session destruction
- `POST /verify-mobile` - Password recovery step 1
- `POST /reset-password` - Password recovery step 2
- `GET /profile` & `POST /profile/update` - Customer profile management
- `POST /api/place-order` - Checkout & order creation
- `GET /my-orders` - Customer order history
- `GET /track-order/:orderId` - Visual live order tracking
- `POST /api/order/:orderId/cancel` - Cancel active order
- `POST /api/contact` - Customer inquiry submission

### Kitchen Administration (`/admin`)
- `GET /admin` - KPI metrics & recent orders
- `GET /admin/orders` - Filterable order management pipeline
- `POST /admin/order/:orderId/status` - Update order stage
- `GET /admin/menu` - Food dish catalog management
- `POST /admin/menu/add` - Add new recipe to menu
- `POST /admin/menu/:id/toggle` - Toggle stock availability
- `POST /admin/menu/:id/delete` - Remove recipe from menu
- `GET /admin/feedback` - Customer messages list

---

## 📂 Project Architecture

```text
Cloude-Kitchen/
├── controller/
│   ├── authController.js     # User authentication, registration, password recovery
│   ├── foodController.js     # Menu browsing, cart checkout, order tracking
│   ├── adminController.js    # Operations dashboard, status updater, menu CRUD
│   └── sitecontroller.js     # About, Contact, feedback submission
├── middleware/
│   └── auth.js               # Route protection & role-based authorization
├── model/
│   ├── user.js               # User accounts schema
│   ├── food.js               # Food catalog schema
│   ├── order.js              # Order schema with items & payment details
│   └── contact.js            # Inquiries & messages schema
├── public/
│   ├── css/main.css          # Design system & responsive layout styles
│   ├── js/cart.js            # Client-side cart manager & checkout modal
│   └── images/               # Food images & culinary assets
├── routes/
│   ├── userRoutes.js         # Auth & profile routes
│   ├── foodRoutes.js         # Ordering & tracking routes
│   └── adminRoutes.js        # Protected administrative routes
├── views/
│   ├── partials/             # Reusable header, footer, modals
│   ├── admin/                # Admin portal views (dashboard, orders, menu, feedback)
│   ├── home.ejs              # Main catalog & ordering page
│   ├── login.ejs             # Authentication view
│   ├── register.ejs          # Sign-up view
│   ├── forgot-password.ejs   # Password recovery view
│   ├── reset-password.ejs    # New password view
│   ├── orders.ejs            # Order history view
│   ├── order-track.ejs       # Live status tracking stepper
│   ├── profile.ejs           # User profile view
│   ├── about.ejs             # About Cloud Kitchen & Architecture view
│   ├── contact.ejs           # Contact & FAQ view
│   └── error.ejs             # Friendly error & 404 view
├── seed.js                   # Database initialization script
├── server.js                 # Express server entry point
└── package.json              # Project dependencies & scripts
```

---

## 🎓 Academic Minor Project Viva Highlights

1. **Why Cloud Kitchen over Traditional Restaurant POS?**  
   *Cloud kitchens eliminate dining hall real estate costs, relying on centralized hyper-efficient production hubs and optimized digital logistics.*
2. **How is security handled?**  
   *Passwords are hashed using salted cryptographic algorithms via **Bcrypt**. Route handlers are guarded with session-based middleware verifying roles (`customer` vs `admin`).*
3. **How does real-time state synchronization work?**  
   *The client-side cart leverages browser `localStorage` for uninterrupted UX, synchronized with atomic MongoDB transactions upon checkout.*

---
*Developed for Academic Evaluation & Presentation (2026).*