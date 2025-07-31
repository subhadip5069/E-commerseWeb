const mongoose = require('mongoose');
const Product = require('../model/product');
const { Category, Subcategory } = require('../model/category');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://subhadip11103:7JN5CzLsoJbmivt5@cluster0.znk8r.mongodb.net/E-commerse');

async function seedDatabase() {
    try {
        console.log('Connected to MongoDB');
        console.log('Starting database seeding...');

        // Create categories first
        const categories = [
            { name: 'Electronics', description: 'Electronic devices and gadgets', isActive: true, sortOrder: 1 },
            { name: 'Fashion', description: 'Clothing and accessories', isActive: true, sortOrder: 2 },
            { name: 'Home & Garden', description: 'Home and garden products', isActive: true, sortOrder: 3 },
            { name: 'Sports', description: 'Sports and fitness equipment', isActive: true, sortOrder: 4 },
            { name: 'Books', description: 'Books and educational materials', isActive: true, sortOrder: 5 }
        ];

        // Clear existing categories (except the existing one)
        await Category.deleteMany({ name: { $ne: 'Ac' } });
        
        const createdCategories = [];
        for (const categoryData of categories) {
            const existingCategory = await Category.findOne({ name: categoryData.name });
            if (!existingCategory) {
                const category = new Category(categoryData);
                await category.save();
                createdCategories.push(category);
                console.log(`Created category: ${category.name}`);
            } else {
                createdCategories.push(existingCategory);
            }
        }

        // Create subcategories
        const subcategories = [
            { name: 'Smartphones', description: 'Mobile phones and accessories', category: createdCategories[0]._id, isActive: true, sortOrder: 1 },
            { name: 'Laptops', description: 'Laptops and computers', category: createdCategories[0]._id, isActive: true, sortOrder: 2 },
            { name: 'Men\'s Clothing', description: 'Clothing for men', category: createdCategories[1]._id, isActive: true, sortOrder: 1 },
            { name: 'Women\'s Clothing', description: 'Clothing for women', category: createdCategories[1]._id, isActive: true, sortOrder: 2 },
            { name: 'Furniture', description: 'Home furniture', category: createdCategories[2]._id, isActive: true, sortOrder: 1 },
            { name: 'Fitness Equipment', description: 'Exercise and fitness gear', category: createdCategories[3]._id, isActive: true, sortOrder: 1 }
        ];

        await Subcategory.deleteMany({});
        const createdSubcategories = [];
        for (const subcategoryData of subcategories) {
            const subcategory = new Subcategory(subcategoryData);
            await subcategory.save();
            createdSubcategories.push(subcategory);
            console.log(`Created subcategory: ${subcategory.name}`);
        }

        // Create sample products
        const products = [
            {
                name: 'iPhone 15 Pro',
                description: 'Latest iPhone with advanced features and powerful performance',
                launchingPrice: 120000,
                currentPrice: 110000,
                category: createdCategories[0]._id,
                subcategory: createdSubcategories[0]._id,
                stock: 50,
                ratings: 4.8,
                images: ['/uploads/placeholder-phone.jpg'],
                isFeatured: true,
                isNewArrival: true,
                isOnSale: true,
                isActive: true,
                sortOrder: 1,
                seoTitle: 'iPhone 15 Pro - Latest Apple Smartphone',
                seoDescription: 'Buy iPhone 15 Pro with best price and features'
            },
            {
                name: 'MacBook Air M2',
                description: 'Powerful and lightweight laptop for professionals',
                launchingPrice: 120000,
                currentPrice: 115000,
                category: createdCategories[0]._id,
                subcategory: createdSubcategories[1]._id,
                stock: 30,
                ratings: 4.9,
                images: ['/uploads/placeholder-laptop.jpg'],
                isFeatured: true,
                isNewArrival: false,
                isOnSale: false,
                isActive: true,
                sortOrder: 2,
                seoTitle: 'MacBook Air M2 - Apple Laptop',
                seoDescription: 'Buy MacBook Air M2 with best performance'
            },
            {
                name: 'Men\'s Cotton T-Shirt',
                description: 'Comfortable cotton t-shirt for everyday wear',
                launchingPrice: 1500,
                currentPrice: 999,
                category: createdCategories[1]._id,
                subcategory: createdSubcategories[2]._id,
                stock: 100,
                ratings: 4.2,
                images: ['/uploads/placeholder-tshirt.jpg'],
                isFeatured: false,
                isNewArrival: true,
                isOnSale: true,
                isActive: true,
                sortOrder: 3,
                seoTitle: 'Men\'s Cotton T-Shirt - Comfortable Wear',
                seoDescription: 'Buy comfortable cotton t-shirt for men'
            },
            {
                name: 'Women\'s Summer Dress',
                description: 'Elegant summer dress for special occasions',
                launchingPrice: 3000,
                currentPrice: 2499,
                category: createdCategories[1]._id,
                subcategory: createdSubcategories[3]._id,
                stock: 75,
                ratings: 4.5,
                images: ['/uploads/placeholder-dress.jpg'],
                isFeatured: true,
                isNewArrival: true,
                isOnSale: false,
                isActive: true,
                sortOrder: 4,
                seoTitle: 'Women\'s Summer Dress - Elegant Fashion',
                seoDescription: 'Buy elegant summer dress for women'
            },
            {
                name: 'Wooden Coffee Table',
                description: 'Beautiful wooden coffee table for living room',
                launchingPrice: 15000,
                currentPrice: 12000,
                category: createdCategories[2]._id,
                subcategory: createdSubcategories[4]._id,
                stock: 20,
                ratings: 4.3,
                images: ['/uploads/placeholder-table.jpg'],
                isFeatured: false,
                isNewArrival: false,
                isOnSale: true,
                isActive: true,
                sortOrder: 5,
                seoTitle: 'Wooden Coffee Table - Living Room Furniture',
                seoDescription: 'Buy beautiful wooden coffee table for your home'
            },
            {
                name: 'Yoga Mat Premium',
                description: 'High-quality yoga mat for fitness and meditation',
                launchingPrice: 2000,
                currentPrice: 1699,
                category: createdCategories[3]._id,
                subcategory: createdSubcategories[5]._id,
                stock: 80,
                ratings: 4.6,
                images: ['/uploads/placeholder-yogamat.jpg'],
                isFeatured: true,
                isNewArrival: false,
                isOnSale: true,
                isActive: true,
                sortOrder: 6,
                seoTitle: 'Premium Yoga Mat - Fitness Equipment',
                seoDescription: 'Buy premium yoga mat for fitness and meditation'
            },
            {
                name: 'Programming Book Set',
                description: 'Complete set of programming books for developers',
                launchingPrice: 5000,
                currentPrice: 4200,
                category: createdCategories[4]._id,
                subcategory: createdSubcategories[5]._id, // Using fitness subcategory as placeholder
                stock: 25,
                ratings: 4.7,
                images: ['/uploads/placeholder-books.jpg'],
                isFeatured: false,
                isNewArrival: true,
                isOnSale: false,
                isActive: true,
                sortOrder: 7,
                seoTitle: 'Programming Books Set - Educational',
                seoDescription: 'Buy complete programming books set for learning'
            },
            {
                name: 'Wireless Headphones',
                description: 'High-quality wireless headphones with noise cancellation',
                launchingPrice: 8000,
                currentPrice: 6500,
                category: createdCategories[0]._id,
                subcategory: createdSubcategories[0]._id,
                stock: 60,
                ratings: 4.4,
                images: ['/uploads/placeholder-headphones.jpg'],
                isFeatured: true,
                isNewArrival: true,
                isOnSale: true,
                isActive: true,
                sortOrder: 8,
                seoTitle: 'Wireless Headphones - Audio Equipment',
                seoDescription: 'Buy wireless headphones with noise cancellation'
            }
        ];

        // Clear existing products
        await Product.deleteMany({});
        
        for (const productData of products) {
            const product = new Product(productData);
            await product.save();
            console.log(`Created product: ${product.name}`);
        }

        console.log('\n✅ Database seeding completed successfully!');
        console.log(`📊 Created ${createdCategories.length} categories`);
        console.log(`📊 Created ${createdSubcategories.length} subcategories`);
        console.log(`📊 Created ${products.length} products`);
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the seeding function
seedDatabase();