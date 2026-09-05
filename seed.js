const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./model/user');
const Food = require('./model/food');
const Order = require('./model/order');

const mongoURI = "mongodb://127.0.0.1:27017/cloud-kitchen";

const initialFoods = [
    {
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

async function seedDB() {
    try {
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB for seeding...");

        // Drop any stale unique indexes on users
        try {
            await mongoose.connection.collection('users').dropIndexes();
        } catch (e) {
            // ignore if collection didn't exist
        }
        // Seed Food Items
        await Food.deleteMany({});
        await Food.insertMany(initialFoods);
        console.log(`✓ Seeded ${initialFoods.length} food items`);

        // Seed Admin User
        const adminEmail = "admin@cloudkitchen.com";
        await User.deleteOne({ email: adminEmail });
        const adminHashedPassword = await bcrypt.hash("admin123", 10);
        await User.create({
            firstName: "Admin",
            lastName: "Manager",
            email: adminEmail,
            mobileNumber: "9876543210",
            homeAddress: "Cloud Kitchen Central Hub, Unit 4B, Tech Park",
            password: adminHashedPassword,
            role: "admin"
        });
        console.log("✓ Seeded Admin User: admin@cloudkitchen.com / admin123");

        // Seed Sample Customer
        const customerEmail = "john@example.com";
        await User.deleteOne({ email: customerEmail });
        const customerHashedPassword = await bcrypt.hash("user123", 10);
        const sampleUser = await User.create({
            firstName: "John",
            lastName: "Doe",
            email: customerEmail,
            mobileNumber: "9123456780",
            homeAddress: "Flat 302, Green Valley Apartments, City Road",
            password: customerHashedPassword,
            role: "customer"
        });
        console.log("✓ Seeded Sample Customer: john@example.com / user123");

        // Seed a sample order
        await Order.deleteMany({});
        await Order.create({
            orderId: "CK-1001",
            userId: sampleUser._id,
            customerName: "John Doe",
            customerEmail: "john@example.com",
            customerPhone: "9123456780",
            deliveryAddress: "Flat 302, Green Valley Apartments, City Road",
            items: [
                {
                    name: "Hyderabadi Chicken Biryani",
                    price: 180,
                    quantity: 2,
                    image: "/images/biriyani.jpeg"
                },
                {
                    name: "Hot Gulab Jamun (2 Pcs)",
                    price: 60,
                    quantity: 1,
                    image: "/images/kochori.jpeg"
                }
            ],
            subtotal: 420,
            discount: 42,
            deliveryFee: 30,
            tax: 21,
            totalAmount: 429,
            paymentMethod: "COD",
            paymentStatus: "Pending",
            orderStatus: "Preparing",
            estimatedDelivery: "25-35 mins"
        });
        console.log("✓ Seeded Sample Order CK-1001");

        console.log("\nDatabase successfully seeded!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seedDB();
