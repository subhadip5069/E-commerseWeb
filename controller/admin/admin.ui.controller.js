
const { Category, Subcategory } = require('../../model/category');
class adminUiController {
    login=(req,res) =>{
        res.render('Admin/login')
    }
    dashboard=(req,res) =>{
        res.render('Admin/dashboard')
    }
   

}
module.exports = new adminUiController;
