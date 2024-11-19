const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const adminRoutes = require("./routes/adminRoutes");
const path = require("path");
const Product = require("./app/models/product");
const morgan = require("morgan");
const userRoutes = require("./routes/userRoutes");
const MongoStore = require("connect-mongo");
const flash = require("express-flash");
const dotenv=require("dotenv")
dotenv.config()

const app = express();
const PORT = process.env.PORT || 13400;

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    name: "isUserAuth",
  })
);

app.use(
  session({
    secret: "admin-secret-key",
    resave: false,
    saveUninitialized: false,
    name: "isAdminAuth",
  })
);



app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, private");
  next();
});
// Uncomment the following line if you want to use morgan for logging
// app.use(morgan("tiny"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "app/views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.static(path.join(__dirname, "node_modules")));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_CURECART, {
  serverSelectionTimeoutMS: 5000,
});

app.use("/admin", adminRoutes);
app.use("/", userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});