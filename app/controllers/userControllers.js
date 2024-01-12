const User = require('../models/user')
const bcrypt = require('bcrypt')



const userControllers = {
  signUp: async (req, res) => {
    try{
        res.render("/signUp")
    }catch(error){

    }
  },

  signIn:(req,res)=>{
    try{
        
        res.render("/signIn");

    }catch(error){
        console.log((error));
    }

  },

  signUpSignIn: async (req, res) => {
    try {
      const { email, password, phonenumber } = req.body;
      const hashPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        email,
        password: hashPassword,
        phonenumber,
      });
      if (newUser) {
        await save();
        res.redirect("/");
      }
    } catch (error) {
        console.log(error);
    }
  },
};
module.exports = userControllers