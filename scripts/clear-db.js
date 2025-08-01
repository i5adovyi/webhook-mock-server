#!/usr/bin/env node

const WebhookDatabase = require('../database');
const readline = require('readline');

function askQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function clearDatabase() {
    const db = new WebhookDatabase();
    
    try {
        // Get current stats
        const stats = await db.getStats();
        
        console.log('🗑️  Database Clear Utility');
        console.log('==========================');
        console.log(`Current events: ${stats.totalEvents}`);
        console.log(`Database size: ${stats.databaseSize}`);
        console.log('');
        
        if (stats.totalEvents === 0) {
            console.log('ℹ️  Database is already empty');
            return;
        }
        
        // Ask for confirmation
        const answer = await askQuestion('⚠️  Are you sure you want to clear ALL events? This cannot be undone! (yes/no): ');
        
        if (answer.toLowerCase() !== 'yes') {
            console.log('❌ Operation cancelled');
            return;
        }
        
        console.log('🧹 Clearing all events...');
        
        const numRemoved = await db.clearAllEvents();
        
        console.log(`✅ Successfully cleared ${numRemoved} events`);
        console.log('🎯 Database is now empty');
        
        // Compact the database to reclaim space
        await db.compactDatabase();
        console.log('🗜️  Database compacted');
        
    } catch (error) {
        console.error('❌ Failed to clear database:', error.message);
        process.exit(1);
    }
}

async function clearOldEvents() {
    const db = new WebhookDatabase();
    
    try {
        const daysInput = await askQuestion('How many days old should events be to delete them? (default: 7): ');
        const days = parseInt(daysInput) || 7;
        
        console.log(`🧹 Clearing events older than ${days} days...`);
        
        const numRemoved = await db.clearOldEvents(days);
        
        if (numRemoved > 0) {
            console.log(`✅ Successfully cleared ${numRemoved} old events`);
            await db.compactDatabase();
            console.log('🗜️  Database compacted');
        } else {
            console.log('ℹ️  No old events found to clear');
        }
        
    } catch (error) {
        console.error('❌ Failed to clear old events:', error.message);
        process.exit(1);
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--old')) {
        await clearOldEvents();
    } else {
        await clearDatabase();
    }
}

// Check if called directly
if (require.main === module) {
    main();
}

module.exports = { clearDatabase, clearOldEvents };