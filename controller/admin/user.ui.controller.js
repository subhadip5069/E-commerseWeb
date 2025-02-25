const User = require("../../model/user");

class UserController {
    // Get user details
    getalluser = async (req, res) => {
        try {
            // Get the page and limit from query params
            let page = parseInt(req.query.page) || 1; // Default to 1
            let limit = parseInt(req.query.limit) || 20; // Default to 5 users per page
            let skip = (page - 1) * limit;
    
            // Get the search query from request query (if exists)
            let searchQuery = req.query.name || req.query.email || " ";
            let searchCriteria ={} 
            if (searchQuery) {
              // If searchQuery is provided, search by both username or email
              searchCriteria = {
                $or: [
                  { username: { $regex: searchQuery, $options: 'i' } },
                  { email: { $regex: searchQuery, $options: 'i' } }
                ]
              };
            }
            // Fetch users based on the search criteria, with pagination
            const users = await User.find(searchCriteria).skip(skip).limit(limit);
    
            // Count total matching users (for pagination)
            const totalUsers = await User.countDocuments(searchCriteria);

            // if scearch user succesfully
            
            if( totalUsers > 0 ){
                req.session.success_msg = 'Users fetched successfully!'; 
                delete req.session.error_msg
            }
    
            // Render the users page with pagination, session messages, and user data
            res.render("Admin/users", {
                users,
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                limit,
                searchQuery, // Pass the search query to retain it in the form
                success_msg: req.session.success_msg,
                

            });
           ;

        } catch (error) {
            console.error("Error fetching users:", error);
            
            req.session.success_msg = 'Form created successfully!';

            res.redirect("/admin/user");
        }
    };

    // Update user status
    updateUserStatus = async (req, res) => {
        try {
            const userId = req.params.userId;
            const { status } = req.body; // Get the status from the form submission

            // Update the user's status in the database
            await User.findByIdAndUpdate(userId, { status });

    

            res.redirect('/admin/user'); // Redirect back to the user list
        } catch (error) {
            console.error("Error updating user status:", error);
            
            

            res.redirect('/admin/user');
        }
    };
};

module.exports = new UserController();
