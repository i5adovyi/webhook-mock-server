#!/usr/bin/env node

const WebhookDatabase = require('../database');
const fs = require('fs');
const path = require('path');

async function exportDatabase() {
    const db = new WebhookDatabase();
    
    try {
        console.log('📤 Exporting database...');
        
        const events = await db.exportEvents();
        const stats = await db.getStats();
        
        const exportData = {
            exportDate: new Date().toISOString(),
            stats: stats,
            events: events
        };
        
        const filename = `webhook-export-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(process.cwd(), filename);
        
        fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
        
        console.log(`✅ Database exported successfully!`);
        console.log(`📁 File: ${filepath}`);
        console.log(`📊 Exported ${events.length} events`);
        console.log(`📈 Database size: ${stats.databaseSize}`);
        
    } catch (error) {
        console.error('❌ Export failed:', error.message);
        process.exit(1);
    }
}

// Check if called directly
if (require.main === module) {
    exportDatabase();
}

module.exports = exportDatabase;