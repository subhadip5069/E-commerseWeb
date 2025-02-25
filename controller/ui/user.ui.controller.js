

class UserUiController {

    index = (req, res) => {
        res.render('Ui/index',{
            title:"index"
        });
    };
    login = (req,res) =>{
        res.render('Ui/login')
    }
    signup = (req,res) =>{
        res.render('Ui/signup')
    }
    about = (req,res) => {
        res.render('Ui/about')
    }
    contactUs = (req,res) => {
        res.render('Ui/contactus')
    }
    cart = (req,res) => {
        res.render('Ui/cart')
    }
    product = (req,res)=>{
        res.render('Ui/product')
    }
    products =(req,res)=>{
        res.render('Ui/products')
    }
    bill =(req,res) =>{
        res.render('Ui/bill')
    }
    Orderhistory =(req,res) => {
        res.render('Ui/Orderhistory')
    }
    profile = (req,res)=>{
        res.render('Ui/profile')

    }
    orderDetails = (req,res)=>{
        res.render('Ui/orderDetails')
    }
}

module.exports = new UserUiController();