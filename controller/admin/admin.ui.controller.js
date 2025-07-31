
const { Category, Subcategory } = require('../../model/category');
class adminUiController {
    login=(req,res) =>{
        res.render('Admin/login', { messages: req.flash() }
    )
    }
    dashboard=(req,res) =>{
        res.render('Admin/dashboard',{messages: req.flash()})
    }
    
    profile=(req,res) =>{
        res.render('Admin/profile',{
            messages: req.flash(),
            user: req.user
        })
    }
    
    settings=(req,res) =>{
        res.render('Admin/settings',{
            messages: req.flash()
        })
    }
   

}
module.exports = new adminUiController;
