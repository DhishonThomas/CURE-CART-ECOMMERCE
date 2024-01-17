const Userotp = require('../models/userOtp');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const User = require("../models/user");


// Function to send OTP via email
async function sendOTPByEmail(email, otp) {
    console.log(email,otp);

    const mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'dhishonthomas6@gmail.com',
            pass: 'qaui jtco wzrr emoa',
        },
    });

    const mailDetails = {
        from: 'dhishonthomas6@gmail.com',
        to: email,
        subject: 'OTP',
        text: `Your OTP is: ${otp}`,
    };

    // Return a promise to handle success and error in the calling route
    return mailTransporter.sendMail(mailDetails)
    .then(data => {
        console.log('Email sent successfully:', data);
    })
    .catch(error => {
        console.error('Error sending email:', error);
        throw error; // Re-throw the error to be caught in the calling route
    });
}


const otpExpirationTime = 1 * 60 * 1000; // 1 minute expiration time

const otpController = {
  sendOtp: async (req, res) => {
    const email = req.body.email;

    try {
      // Generate a secret key with a length of 20 characters
      const secret = speakeasy.generateSecret({ length: 20 });

      // Generate a TOTP code using the secret key
      const code = speakeasy.totp({
        secret: secret.base32,
        encoding: "base32",
      });

      // Save the OTP details to the database
      const otpTimestamp = Date.now();
      const newUserotp = new Userotp({
        email,
        otp: code,
        timestamp: new Date(otpTimestamp), // Save timestamp as a Date object
      });

      await newUserotp.save();
      await sendOTPByEmail(email, code);
otpController.scheduleCleanup();

      // Schedule the removal of expired unverified OTPs

      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Error in sendOtp:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  cleanupExpiredOtps: async () => {
    try {
      const currentDate = new Date()
      const expirationThreshold = new Date(Date.now() - otpExpirationTime);
       console.log("Current Date:", currentDate);
       console.log("Expiration Threshold:", expirationThreshold);

      // Delete OTPs that are unverified and have expired
      await Userotp.deleteMany({
        timestamp: { $lt: expirationThreshold },
        isVerified: false,
      });

      console.log("Expired unverified OTPs removed.");
    } catch (error) {
      console.error("Error deleting expired unverified OTPs:", error);
    }
  },

  // Schedule the cleanup periodically (e.g., every hour)
  scheduleCleanup: () => {
    setTimeout(() => {
      otpController.cleanupExpiredOtps();
    }, 60 * 1000); // Run every hour (adjust as needed)
  },



  verifyOtp: async (req, res) => {
    const enteredOTP = req.body.otp;
    const email = req.body.email;

    console.log(`Entered OTP: ${enteredOTP}`);

    try {
      const userOtp = await Userotp.findOne({ email });

      if (!userOtp) {
        console.log("User not found");
        return res.json({ success: false, message: "User not found" });
      }

      if (parseInt(enteredOTP, 10) === userOtp.otp) {
        userOtp.isVerified = true;
        await userOtp.save();
        console.log("OTP is valid");
        res.json({ success: true, message: "OTP is valid" });
      } else {
        console.log("Invalid OTP");
        res.json({ success: false, message: "Invalid OTP" });
      }
    } catch (error) {
      console.error("Error in verifyOtp:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = otpController;
