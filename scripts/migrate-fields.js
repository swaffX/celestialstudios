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

        // Migrate Users collection
        console.log('📝 Migrating users collection...');
        const usersCollection = db.collection('users');

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

        // Migrate Tickets collection
        console.log('📝 Migrating tickets collection...');
        const ticketsCollection = db.collection('tickets');

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

        // Update indexes
        console.log('\n📊 Updating indexes...');

        try {
            // Drop old indexes if they exist
            await usersCollection.dropIndex('odasi_1_odaId_1').catch(() => { });
            await usersCollection.dropIndex('odaId_1_xp_-1').catch(() => { });

            // Create new indexes
            await usersCollection.createIndex({ userId: 1, guildId: 1 }, { unique: true });
            await usersCollection.createIndex({ guildId: 1, xp: -1 });
            console.log('   ✅ User indexes updated');

            await ticketsCollection.dropIndex('odaId_1_status_1').catch(() => { });
            await ticketsCollection.dropIndex('userId_1_odaId_1').catch(() => { });

            await ticketsCollection.createIndex({ guildId: 1, status: 1 });
            await ticketsCollection.createIndex({ userId: 1, guildId: 1 });
            console.log('   ✅ Ticket indexes updated');
        } catch (indexError) {
            console.log('   ⚠️  Index update warning:', indexError.message);
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
