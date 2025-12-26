/**
 * MongoDB Field Migration Script
 * Renames odasi -> userId and odaId -> guildId in existing collections
 * 
 * Run with: node scripts/migrate-fields.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
    console.log('🔄 Starting field migration...\n');

    try {
        // Connect to MongoDB
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000
        });
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // ========== STEP 1: DROP OLD INDEXES FIRST ==========
        console.log('🗑️  Dropping old indexes...');
        const usersCollection = db.collection('users');
        const ticketsCollection = db.collection('tickets');

        // Get existing indexes and drop old ones
        try {
            const userIndexes = await usersCollection.indexes();
            for (const idx of userIndexes) {
                if (idx.name.includes('odasi') || idx.name.includes('odaId')) {
                    console.log(`   Dropping index: ${idx.name}`);
                    await usersCollection.dropIndex(idx.name);
                }
            }
            console.log('   ✅ Old user indexes dropped');
        } catch (e) {
            console.log('   ℹ️  No old user indexes to drop or already dropped');
        }

        try {
            const ticketIndexes = await ticketsCollection.indexes();
            for (const idx of ticketIndexes) {
                if (idx.name.includes('odaId')) {
                    console.log(`   Dropping index: ${idx.name}`);
                    await ticketsCollection.dropIndex(idx.name);
                }
            }
            console.log('   ✅ Old ticket indexes dropped');
        } catch (e) {
            console.log('   ℹ️  No old ticket indexes to drop or already dropped');
        }

        // ========== STEP 2: MIGRATE USERS COLLECTION ==========
        console.log('\n📝 Migrating users collection...');

        // Check if old fields exist
        const sampleUser = await usersCollection.findOne({ odasi: { $exists: true } });

        if (sampleUser) {
            const userResult = await usersCollection.updateMany(
                { odasi: { $exists: true } },
                {
                    $rename: {
                        'odasi': 'userId',
                        'odaId': 'guildId'
                    }
                }
            );
            console.log(`   ✅ Updated ${userResult.modifiedCount} user documents`);
        } else {
            console.log('   ℹ️  Users already migrated or no documents found');
        }

        // ========== STEP 3: MIGRATE TICKETS COLLECTION ==========
        console.log('📝 Migrating tickets collection...');

        const sampleTicket = await ticketsCollection.findOne({ odaId: { $exists: true } });

        if (sampleTicket) {
            const ticketResult = await ticketsCollection.updateMany(
                { odaId: { $exists: true } },
                {
                    $rename: {
                        'odaId': 'guildId'
                    }
                }
            );
            console.log(`   ✅ Updated ${ticketResult.modifiedCount} ticket documents`);
        } else {
            console.log('   ℹ️  Tickets already migrated or no documents found');
        }

        // ========== STEP 4: CREATE NEW INDEXES ==========
        console.log('\n📊 Creating new indexes...');

        try {
            await usersCollection.createIndex({ userId: 1, guildId: 1 }, { unique: true });
            await usersCollection.createIndex({ guildId: 1, xp: -1 });
            console.log('   ✅ User indexes created');

            await ticketsCollection.createIndex({ guildId: 1, status: 1 });
            await ticketsCollection.createIndex({ userId: 1, guildId: 1 });
            console.log('   ✅ Ticket indexes created');
        } catch (indexError) {
            console.log('   ⚠️  Index creation warning:', indexError.message);
        }

        console.log('\n✅ Migration completed successfully!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('📦 Database connection closed');
    }
}

// Run migration
migrate();
