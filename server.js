const express = require("express");
const session= require("express-session");
const mongoose = require("mongoose");
const User = require("./model/user");
const bcrypt = require("bcrypt");

const userRoute=require('./routes/userRoutes')

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

//set default router
app.use('/',userRoute)

// MongoDB Connection
const mongoURI = "mongodb://127.0.0.1:27017/cloud-kitchen";
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error(err));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

// Routes
app.use("/user", require("./routes/userRoutes"));
app.use("/food", require("./routes/foodRoutes"));

// Root Route
app.get("/", (req, res) => {
  res.render("index");
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));