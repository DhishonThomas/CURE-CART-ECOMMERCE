const bcrypt = require("bcrypt")
const crypto = require("crypto");
const User = require("../models/user");
const nodemailer = require("nodemailer")
require('dotenv').config()


async function sendOTPByEmail(email,token) {
  console.log(email);

  const mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
  }); 

  const mailDetails = {
    from: "dhishonthomas6@gmail.com",
    to: email,
    subject: "Password Reset",
    html: `<p>Please click <a href="http://localhost:3000/reset/${token}">here</a> to reset your password.</p>`,
  }

  // Return a promise to handle success and error in the calling route
  return mailTransporter
    .sendMail(mailDetails)
    .then((data) => {
      console.log("Email sent successfully:", data);
    })
    .catch((error) => {
      console.error("Error sending email:", error);
      throw error; // Re-throw the error to be caught in the calling route
    });
}

const forgetEmail = async (req, res) => {
  try {
    res.render("user/forgetEmail");
  } catch (error) {
    console.log(error);
  }
};

const reset = async(req,res)=>{
    let token= req.params.token;
    try{
        const user = await User.findOne({
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: Date.now() },
        });
if(!user){
    return res.status(400).send("Invalid or expired token")
}

        res.render("user/resetPassword",{token:token});
    }catch(error){
        console.log(error);
    }
}

const resetPassword = async(req,res)=>{
    const  newPassword = req.body.password;      
    const token = req.body.token  
    // const token = req.params.token;
    console.log(newPassword + "  " + token );
    if (!newPassword || !token) {
      return res.redirect(
        "/signin?message=" + encodeURIComponent("Missing fields")
      );
    }

                const user = await User.findOne({
                  resetPasswordToken: token,
                  resetPasswordExpires: { $gt: Date.now() },
                });

                
                if (!user) {
                  return res.status(400).send("Invalid or expired token");
                }
                const hashedPassword = await bcrypt.hash(newPassword,10)
                 
                user.password = hashedPassword
                user.resetPasswordToken = undefined
                user.resetPasswordExpires = undefined
                
                await user.save()
                res.redirect("/signin")

}


const forgetPassword = async(req,res)=>{
    const {email} = req.body;
    try{
        const user = await User.findOne({email})
        if(!user){
            return res.status(404).json({message:"User not found"})
        }

        const token = crypto.randomBytes(20).toString('hex')

        user.resetPasswordToken = token
        user.resetPasswordExpires = Date.now() + 3600000; 

      sendOTPByEmail(email,token)
            await user.save();

            res.render("user/forgetSend")



 
    }catch(error){
        console.log(error);
    }

 
}

module.exports = {
  forgetPassword,
  forgetEmail,
  reset,
  resetPassword,

};


