const user = require("../../model/user");


class AuthController{
    
    login = async (req, res) => {
        try {
          const { email, password } = req.body;
          const users = await user.findOne({ email });
      
          if (!users) {
            req.flash("error_msg", "User not found!");
            return res.redirect("/admin/");
          }
      
          if (!users.isVerified) {
            req.flash("error_msg", "User is not verified!");
            return res.redirect("/admin/");
          }
      
          const isMatch = await bcrypt.compare(password, users.password);
          if (!isMatch) {
            req.flash("error_msg", "Incorrect password!");
            return res.redirect("/admin/");
          }
      
          if (users.role !== "admin") {
            req.flash("error_msg", "You are not an admin.");
            return res.redirect("/admin/");
          }
      
          // Generate JWT Token
          const token = jwt.sign(
            { id: users._id, username: users.username, role: users.role },
            process.env.SECRET_KEY,
            { expiresIn: "7d" }
          );
      
          // Set token in HTTP-only cookie
          res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 48 * 60 * 60 * 1000,
          });
      
          return res.redirect("/admin/");
        } catch (error) {
          console.error("Error logging in:", error);
          req.flash("error_msg", "Failed to log in.");
          return res.redirect("/admin/");
        }
      };
      
    
      logout = (req, res) => {
        res.clearCookie("token");
        req.flash("success_msg", "You are logged out.");
        res.redirect("/admin/");
        console.log("User logged out.");
      };
      
    
}

module.exports = new AuthController();