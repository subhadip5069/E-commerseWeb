const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token; // Get token from cookies

    if (!token) {
        console.log("No token found in cookies.");
        req.user = null || {}; // Explicitly set req.user to null
        return next(); // Allow access without authentication
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded User:", decoded); // Debugging
        req.user = decoded; // Attach user data to request object
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error);

        if (error.name === "TokenExpiredError") {
            res.clearCookie("token"); // Remove expired token from cookies
            return res.redirect("/login"); // Redirect to login if token is expired
        }

        req.user = null; // Ensure req.user is always defined
        next();
    }

};

const AdminauthMiddleware = (req, res, next) => {
    const token = req.cookies.token; // Assuming you're storing the token in cookies
  
    if (!token) {
      
      return res.redirect('/admin/'); // Redirect to the login page if no token
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Attach user info to the request object
      res.locals.user = decoded; // Attach it to res.locals for global access in EJS
      next();
    } catch (error) {
      return res.redirect('/admin/'); // Redirect if token is invalid or expired
    }
  };

module.exports = { authMiddleware, AdminauthMiddleware }; // Export authMiddleware;
