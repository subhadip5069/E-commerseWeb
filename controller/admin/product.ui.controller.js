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
          console.log('Fetching categories for product creation form...');
          const categories = await Category.find({});
          console.log('Categories fetched:', categories.length);
          
          res.render('Admin/createproduct', { 
              categories,
              success_msg: req.flash('success_msg'),
              error_msg: req.flash('error_msg')
          });
      } catch (error) {
          console.error("Error in createProductUi:", error);
          req.flash('error_msg', 'Failed to load product creation form');
          res.status(500).send(`
              <h1>Internal Server Error</h1>
              <p>Failed to load product creation form</p>
              <p>Error: ${error.message}</p>
              <a href="/admin/product">Back to Products</a>
          `);
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
          const { 
            name, 
            description, 
            launchingPrice, 
            currentPrice, 
            category, 
            subcategory, 
            stock, 
            ratings,
            isFeatured,
            isNewArrival,
            isOnSale,
            sortOrder,
            seoTitle,
            seoDescription
          } = req.body;
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
            isFeatured: isFeatured === 'true' || isFeatured === 'on',
            isNewArrival: isNewArrival === 'true' || isNewArrival === 'on',
            isOnSale: isOnSale === 'true' || isOnSale === 'on',
            sortOrder: parseInt(sortOrder) || 0,
            seoTitle: seoTitle || name,
            seoDescription: seoDescription || description,
            isActive: true
          });
          
          await Products.save();
          
          req.flash("success_msg", "Product created successfully!");
          res.redirect('/admin/product/products');
        } catch (error) {
          console.error("Error creating product:", error);
          req.flash("error_msg", "Failed to create product");
          res.redirect('/admin/product/create');
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