#!/usr/bin/env node

const WebhookDatabase = require('../database');

async function showDatabaseStats() {
    const db = new WebhookDatabase();
    
    try {
        console.log('📊 Database Statistics');
        console.log('=====================');
        
        const stats = await db.getStats();
        
        console.log(`📦 Total Events: ${stats.totalEvents}`);
        console.log(`💾 Database Size: ${stats.databaseSize}`);
        
        if (stats.oldestEvent) {
            console.log(`📅 Oldest Event: ${new Date(stats.oldestEvent.timestamp).toLocaleString()} (ID: ${stats.oldestEvent.id})`);
        }
        
        if (stats.newestEvent) {
            console.log(`🆕 Newest Event: ${new Date(stats.newestEvent.timestamp).toLocaleString()} (ID: ${stats.newestEvent.id})`);
        }
        
        // Calculate events per day
        if (stats.oldestEvent && stats.newestEvent && stats.totalEvents > 1) {
            const oldestDate = new Date(stats.oldestEvent.timestamp);
            const newestDate = new Date(stats.newestEvent.timestamp);
            const daysDiff = Math.max(1, Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24)));
            const eventsPerDay = (stats.totalEvents / daysDiff).toFixed(1);
            console.log(`📈 Events per day: ${eventsPerDay}`);
        }
        
        console.log('');
        
        // Get recent events breakdown
        const recentEvents = await db.getEvents(0, 10);
        
        if (recentEvents.length > 0) {
            console.log('🕒 Recent Events:');
            console.log('-----------------');
            
            recentEvents.forEach(event => {
                const date = new Date(event.timestamp).toLocaleString();
                const method = event.method || 'Unknown';
                const url = event.url || '/';
                console.log(`  ${event.id}: ${method} ${url} - ${date}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Failed to get database statistics:', error.message);
        process.exit(1);
    }
}

// Check if called directly
if (require.main === module) {
    showDatabaseStats();
}

module.exports = showDatabaseStats;