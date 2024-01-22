const User = require("../models/user");

const checkUserBlocked = async (req, res, next) => {
  try {
    if (req.session.isUserAuth) {
      const userId = req.session.isUserAuth; // Access user ID from the session

      const user = await User.findById(userId);

      if (user && !user.isBlocked) {
        // If the user is blocked, destroy the session and log them out
        req.session.destroy()
        //   if (err) {
        //     console.error("Error destroying session:", err);
        //   }

          console.log("this sign in work");
          res.redirect("/signIn"); // Redirect to the login page after logout
       
      } else {
        next(); // User is not blocked, proceed with the request
      }
    } else {
      next(); // User is not authenticated, proceed with the request
    }
  } catch (error) {
    console.error("Error checking user status:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = checkUserBlocked;
