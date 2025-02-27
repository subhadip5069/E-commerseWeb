const { Category, Subcategory } = require("../../model/category");
const product = require("../../model/product");
const path = require("path");
const fs = require("fs");


class ProductUIController {
    // ui
    productUi=async(req,res)=>{
        const { page = 1, limit = 10 } = req.query;
        const products = await product.find()
          .populate('category', 'name')
          .populate('subcategory', 'name')
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .sort({ createdAt: -1 });
  
        const totalProducts = await product.countDocuments();
        res.render('Admin/product',{products,totalPages:Math.ceil(totalProducts / limit)})
    }
  createProductUi = async (req, res) => {
      try {
          const categories = await Category.find({});
          res.render('Admin/createproduct', { categories });
      } catch (error) {
          console.error("Error fetching categories:", error);
          res.status(500).send("Internal Server Error");
      }
  };
  
    updateProductUi=async(req,res)=>{
        const categories=await Category.find({})
        const subcategories=await Subcategory.find({})
        res.render('Admin/updateproduct',{categories,subcategories})
    }
    // function

    async createProduct(req, res) {
        try {
          const { name, description, launchingPrice, currentPrice, category, subcategory, stock, ratings } = req.body;
          const images = req.files ? req.files.map((file) => file.path) : [];
    
          const Products = new product({
            name,
            description,
            launchingPrice,
            currentPrice,
            category,
            subcategory,
            stock,
            ratings,
            images,
          });
          
          await Products.save();
          
          res.redirect('/admin/product/products');
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Failed to create product' });
        }
      }
    
      // Get all products with pagination and sorting
      async getProducts(req, res) {
        try {
          const page = parseInt(req.query.page) || 1;
          const limit = parseInt(req.query.limit) || 10;
      
          const products = await product.find()
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });
      
          const totalProducts = await product.countDocuments();
          const totalPages = Math.ceil(totalProducts / limit);
      
          res.render('Admin/product', {
            products,
            currentPage: page,
            totalPages
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Failed to retrieve products' });
        }
      }
      
    
      // Get a single product by ID
      async getProductById(req, res) {
        try {
          const product = await product.findById(req.params.id)
            .populate('category', 'name')
            .populate('subcategory', 'name');
    
          if (!product) return res.status(404).json({ message: 'Product not found' });
    
          res.status(200).json(product);
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Failed to retrieve product' });
        }
      }
    
      // Update a product and replace images
      async updateProduct(req, res) {
        try {
          const { id } = req.params;
          const { name, description, launchingPrice, currentPrice, category, subcategory, stock, ratings } = req.body;
    
          const product = await product.findById(id);
          if (!product) return res.status(404).json({ message: 'Product not found' });
    
          // Delete old images if new images are uploaded
          if (req.files) {
            product.images.forEach((image) => {
              const imagePath = path.resolve(image);
              if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            });
    
            product.images = req.files.map((file) => file.path);
          }
    
          // Update product fields
          product.name = name;
          product.description = description;
          product.launchingPrice = launchingPrice;
          product.currentPrice = currentPrice;
          product.category = category;
          product.subcategory = subcategory;
          product.stock = stock;
          product.ratings = ratings;
    
          await product.save();
          res.status(200).json({ message: 'Product updated successfully', product });
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Failed to update product' });
        }
      }
    
      // Delete a product and its images
      async deleteProduct(req, res) {
        try {
          const { id } = req.params;
          const products = await product.findById(id);
          if (!products) return res.status(404).json({ message: 'Product not found' });
    
          // Delete product images
          products.images.forEach((image) => {
            const imagePath = path.resolve(image);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
          });
    
          await product.findByIdAndDelete(id).exec();
          return res.redirect('/admin/product/products');
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Failed to delete product' });
        }
      }
}

module.exports=new ProductUIController