const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../../model/user");
const bcrypt = require("bcryptjs");


let otpData = { otp: null, expiresAt: null };

// Generate OTP
function generateOTP() {
  const otp = crypto.randomInt(100000, 999999).toString();
  otpData = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // OTP valid for 5 minutes
  return otp;
}

// Nodemailer setup

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST||"smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT),  // Convert port to number
  secure: process.env.EMAIL_SECURE === "true",  // true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USER||"rahulshop4560000@gmail.com",
    pass: process.env.EMAIL_PASS ||"mnju jqzp vwqn qkmg",
  },
});

  class UserAuthController {
// Handle Signup and Send OTP
signup = async (req, res) => {
  const { username, email, password } = req.body;
  const otp = generateOTP();

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.redirect("/login");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user in the database with isVerified as false and hashed password
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    await newUser.save();

    // Send OTP to user's email
    const mailOptions = {
      from: `"E-commerce" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: "Verify Your Email - A-world",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://via.placeholder.com/150x50?text=A-world" alt="A-world Logo" style="max-width: 150px;">
          </div>
          <h2 style="color: #333;">Verify Your Email</h2>
          <p style="color: #555;">Hello,</p>
          <p style="color: #555;">Thank you for signing up at <strong>A-world</strong>. To complete your registration, please verify your email address by entering the OTP below:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #333; background: #f4f4f4; padding: 10px 20px; border-radius: 5px;">${otp}</span>
          </div>
          <p style="color: #555;">This OTP will expire in 5 minutes.</p>
          <p style="color: #555;">If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">Need help? Contact our <a href="#" style="color: #007bff; text-decoration: none;">Support Team</a>.</p>
          <p style="font-size: 12px; color: #888;">© 2025 A-world. All rights reserved.</p>
        </div>
      `,
    };

    // Send OTP
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
        return res.redirect("/signup");
      }
      console.log("Email sent:", info.response);
      res.render("Ui/verify", {
        email,
        message: "OTP sent successfully. Please verify your email.",
      });
    });
  } catch (error) {
    console.error(error);
    res.redirect("/signup");
  }
};

// Verify OTP and Redirect to Login Page
 verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
  
    if (otpData.otp === otp) {
      if (Date.now() > otpData.expiresAt) {
        otpData = { otp: null, expiresAt: null };
        return res.render("Ui/verify", { email, message: "OTP has expired. Please request a new one." });
      }
  
      try {
        // Update isVerified to true for the user with matching email
        const user = await User.findOneAndUpdate(
          { email }, 
          { isVerified: true }, 
          { new: true }
        );
  
        if (!user) {
          return res.status(404).render("Ui/verify", { email, message: "User not found." });
        }
  
        otpData = { otp: null, expiresAt: null }; // Reset OTP
        console.log("User verified successfully:", user);
        res.redirect("/login");
      } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).render("Ui/verify", { email, message: "An error occurred during verification." });
      }
    } else {
      res.render("Ui/verify", { email, message: "Invalid OTP. Please try again." });
    }
  };


    login = async (req, res) => {
    

    try {
      const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect("/login")
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res.redirect("/login")
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.redirect("/login")
    }

    // Successful login
    if (!req.session) {
      console.error("Session is not initialized.");
      return res.redirect("/login");
    }
    
    req.session.user = { id: user._id, username: user.username, role: user.role };
    
    res.redirect("/"); 
     } catch (error) {
    console.error("Login error:", error);
    res.redirect("/login");
     }
    }



  
  }
  
  

module.exports = new UserAuthController();
