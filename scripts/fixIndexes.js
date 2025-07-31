const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://subhadip11103:7JN5CzLsoJbmivt5@cluster0.znk8r.mongodb.net/E-commerse');

async function fixIndexes() {
    try {
        // Wait for connection to be established
        await mongoose.connection.asPromise();
        console.log('Connected to MongoDB');
        console.log('Fixing duplicate indexes...');

        const db = mongoose.connection.db;
        
        // Get all collections
        const collections = await db.listCollections().toArray();
        console.log('Found collections:', collections.map(c => c.name));

        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`\nChecking collection: ${collectionName}`);
            
            try {
                // Get existing indexes
                const indexes = await db.collection(collectionName).indexes();
                console.log(`Existing indexes for ${collectionName}:`, indexes.map(i => i.name));
                
                // Drop all indexes except _id_ index
                for (const index of indexes) {
                    if (index.name !== '_id_') {
                        try {
                            await db.collection(collectionName).dropIndex(index.name);
                            console.log(`Dropped index: ${index.name} from ${collectionName}`);
                        } catch (error) {
                            console.log(`Could not drop index ${index.name}: ${error.message}`);
                        }
                    }
                }
            } catch (error) {
                console.log(`Error processing collection ${collectionName}:`, error.message);
            }
        }

        console.log('\n✅ Index cleanup completed!');
        console.log('📌 Indexes will be recreated automatically when the application starts');
        
    } catch (error) {
        console.error('❌ Error fixing indexes:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the fix function
fixIndexes();