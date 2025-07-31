const User = require('../../model/user');
const bcrypt = require('bcrypt');

class AdminManagementController {

    // Display admin creation form
    createAdminForm = async (req, res) => {
        try {
            res.render('Admin/createAdmin', {
                title: 'Create New Admin',
                admin: req.admin
            });
        } catch (error) {
            console.error('Error loading create admin form:', error);
            req.flash('error_msg', 'Error loading page');
            res.redirect('/admin/dashboard');
        }
    };

    // Create new admin user
    createAdmin = async (req, res) => {
        try {
            const { username, email, password, phone } = req.body;

            // Validate input
            if (!username || !email || !password || !phone) {
                req.flash('error_msg', 'All fields are required');
                return res.redirect('/admin/create-admin');
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                req.flash('error_msg', 'User with this email already exists');
                return res.redirect('/admin/create-admin');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create new admin user
            const newAdmin = new User({
                username,
                email,
                password: hashedPassword,
                phone,
                role: 'admin',
                isVerified: true, // Admins are automatically verified
                createdBy: req.admin.id // Track who created this admin
            });

            await newAdmin.save();

            req.flash('success_msg', `Admin user ${username} created successfully`);
            res.redirect('/admin/admins');

        } catch (error) {
            console.error('Error creating admin:', error);
            req.flash('error_msg', 'Error creating admin user');
            res.redirect('/admin/create-admin');
        }
    };

    // List all admin users
    listAdmins = async (req, res) => {
        try {
            const admins = await User.find({ role: 'admin' })
                .select('-password')
                .sort({ createdAt: -1 });

            res.render('Admin/adminList', {
                title: 'Admin Users',
                admins,
                admin: req.admin
            });

        } catch (error) {
            console.error('Error fetching admins:', error);
            req.flash('error_msg', 'Error loading admin list');
            res.redirect('/admin/dashboard');
        }
    };

    // Edit admin user
    editAdminForm = async (req, res) => {
        try {
            const { adminId } = req.params;
            
            const adminUser = await User.findById(adminId).select('-password');
            if (!adminUser || adminUser.role !== 'admin') {
                req.flash('error_msg', 'Admin user not found');
                return res.redirect('/admin/admins');
            }

            res.render('Admin/editAdmin', {
                title: 'Edit Admin',
                adminUser,
                admin: req.admin
            });

        } catch (error) {
            console.error('Error loading edit admin form:', error);
            req.flash('error_msg', 'Error loading page');
            res.redirect('/admin/admins');
        }
    };

    // Update admin user
    updateAdmin = async (req, res) => {
        try {
            const { adminId } = req.params;
            const { username, email, phone, status } = req.body;

            // Find admin user
            const adminUser = await User.findById(adminId);
            if (!adminUser || adminUser.role !== 'admin') {
                req.flash('error_msg', 'Admin user not found');
                return res.redirect('/admin/admins');
            }

            // Prevent self-deactivation
            if (adminId === req.admin.id && status === 'inactive') {
                req.flash('error_msg', 'You cannot deactivate your own account');
                return res.redirect(`/admin/admins/edit/${adminId}`);
            }

            // Check if email is already taken by another user
            const existingUser = await User.findOne({ 
                email, 
                _id: { $ne: adminId } 
            });
            if (existingUser) {
                req.flash('error_msg', 'Email is already taken by another user');
                return res.redirect(`/admin/admins/edit/${adminId}`);
            }

            // Update admin user
            adminUser.username = username;
            adminUser.email = email;
            adminUser.phone = phone;
            adminUser.status = status;
            adminUser.updatedBy = req.admin.id;

            await adminUser.save();

            req.flash('success_msg', 'Admin user updated successfully');
            res.redirect('/admin/admins');

        } catch (error) {
            console.error('Error updating admin:', error);
            req.flash('error_msg', 'Error updating admin user');
            res.redirect('/admin/admins');
        }
    };

    // Change admin password
    changePasswordForm = async (req, res) => {
        try {
            const { adminId } = req.params;
            
            const adminUser = await User.findById(adminId).select('-password');
            if (!adminUser || adminUser.role !== 'admin') {
                req.flash('error_msg', 'Admin user not found');
                return res.redirect('/admin/admins');
            }

            res.render('Admin/changeAdminPassword', {
                title: 'Change Admin Password',
                adminUser,
                admin: req.admin
            });

        } catch (error) {
            console.error('Error loading change password form:', error);
            req.flash('error_msg', 'Error loading page');
            res.redirect('/admin/admins');
        }
    };

    // Update admin password
    updatePassword = async (req, res) => {
        try {
            const { adminId } = req.params;
            const { currentPassword, newPassword, confirmPassword } = req.body;

            // Find admin user
            const adminUser = await User.findById(adminId);
            if (!adminUser || adminUser.role !== 'admin') {
                req.flash('error_msg', 'Admin user not found');
                return res.redirect('/admin/admins');
            }

            // Validate passwords
            if (newPassword !== confirmPassword) {
                req.flash('error_msg', 'New passwords do not match');
                return res.redirect(`/admin/admins/change-password/${adminId}`);
            }

            // If changing own password, verify current password
            if (adminId === req.admin.id) {
                const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminUser.password);
                if (!isCurrentPasswordValid) {
                    req.flash('error_msg', 'Current password is incorrect');
                    return res.redirect(`/admin/admins/change-password/${adminId}`);
                }
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            
            // Update password
            adminUser.password = hashedPassword;
            adminUser.passwordChangedAt = new Date();
            adminUser.updatedBy = req.admin.id;

            await adminUser.save();

            req.flash('success_msg', 'Password updated successfully');
            
            // If admin changed their own password, redirect to dashboard
            if (adminId === req.admin.id) {
                res.redirect('/admin/dashboard');
            } else {
                res.redirect('/admin/admins');
            }

        } catch (error) {
            console.error('Error updating password:', error);
            req.flash('error_msg', 'Error updating password');
            res.redirect('/admin/admins');
        }
    };

    // Toggle admin status
    toggleStatus = async (req, res) => {
        try {
            const { adminId } = req.params;

            // Find admin user
            const adminUser = await User.findById(adminId);
            if (!adminUser || adminUser.role !== 'admin') {
                req.flash('error_msg', 'Admin user not found');
                return res.redirect('/admin/admins');
            }

            // Prevent self-deactivation
            if (adminId === req.admin.id) {
                req.flash('error_msg', 'You cannot change your own status');
                return res.redirect('/admin/admins');
            }

            // Toggle status
            adminUser.status = adminUser.status === 'active' ? 'inactive' : 'active';
            adminUser.updatedBy = req.admin.id;

            await adminUser.save();

            req.flash('success_msg', `Admin ${adminUser.username} ${adminUser.status === 'active' ? 'activated' : 'deactivated'} successfully`);
            res.redirect('/admin/admins');

        } catch (error) {
            console.error('Error toggling admin status:', error);
            req.flash('error_msg', 'Error updating admin status');
            res.redirect('/admin/admins');
        }
    };

    // Get admin dashboard stats
    getDashboardStats = async (req, res) => {
        try {
            const totalAdmins = await User.countDocuments({ role: 'admin' });
            const activeAdmins = await User.countDocuments({ role: 'admin', status: 'active' });
            const totalUsers = await User.countDocuments({ role: 'user' });
            const verifiedUsers = await User.countDocuments({ role: 'user', isVerified: true });

            return {
                totalAdmins,
                activeAdmins,
                totalUsers,
                verifiedUsers
            };

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return {
                totalAdmins: 0,
                activeAdmins: 0,
                totalUsers: 0,
                verifiedUsers: 0
            };
        }
    };
}

module.exports = new AdminManagementController();