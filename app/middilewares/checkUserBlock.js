const User = require("../models/user");

const checkUserBlocked = async (req, res, next) => {
  try {
    if (req.session.isUserAuth) {
      const userId = req.session.isUserAuth; // Access user ID from the session

      const user = await User.findById(userId);

      if (user && !user.isBlocked) {
        req.session.destroy()
        //   if (err) {
        //     console.error("Error destroying session:", err);
        //   }
          console.log("this sign in work");
          res.redirect("/signIn"); 
       
      } else {
        next(); 
      }
    } else {
      next(); 
    }
  } catch (error) {
    console.error("Error checking user status:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = checkUserBlocked;
