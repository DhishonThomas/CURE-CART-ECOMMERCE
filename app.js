// app.js
const express = require("express");
const session = require("express-session")
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const adminRoutes = require("./routes/adminRoutes");
const path = require('path')
const Product = require("./app/models/product");
const morgan = require('morgan')
const userRoutes = require('./routes/userRoutes')

const app = express();
const PORT = process.env.PORT || 3000;


app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);


app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, private");
  next();
});

app.use(morgan("tiny"));

app.set("view engine","ejs");
app.set("views", path.join(__dirname, "app/views"));

// app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "node_modules")))
// app.use(express.static(path.join(__dirname,"public/uploads")))
app.use(bodyParser.json());


mongoose.connect("mongodb://localhost:27017/Cure-Cart", {
  serverSelectionTimeoutMS: 5000,
});

app.use("/admin", adminRoutes);
app.use("/", userRoutes)
// Other middleware and routes can be added as needed

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
