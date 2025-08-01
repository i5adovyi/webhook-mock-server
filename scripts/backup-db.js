#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function backupDatabase() {
    const dbPath = path.join(process.cwd(), 'webhooks.db');
    
    if (!fs.existsSync(dbPath)) {
        console.log('⚠️  No database file found to backup');
        return;
    }
    
    try {
        console.log('💾 Creating database backup...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFilename = `webhooks-backup-${timestamp}.db`;
        const backupPath = path.join(process.cwd(), 'backups', backupFilename);
        
        // Create backups directory if it doesn't exist
        const backupsDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir);
            console.log('📁 Created backups directory');
        }
        
        // Copy database file
        fs.copyFileSync(dbPath, backupPath);
        
        // Get file stats
        const stats = fs.statSync(backupPath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ Database backup created successfully!`);
        console.log(`📁 File: ${backupPath}`);
        console.log(`📊 Size: ${sizeInMB} MB`);
        
        // Clean up old backups (keep last 5)
        cleanupOldBackups(backupsDir);
        
    } catch (error) {
        console.error('❌ Backup failed:', error.message);
        process.exit(1);
    }
}

function cleanupOldBackups(backupsDir) {
    try {
        const files = fs.readdirSync(backupsDir)
            .filter(file => file.startsWith('webhooks-backup-') && file.endsWith('.db'))
            .map(file => ({
                name: file,
                path: path.join(backupsDir, file),
                mtime: fs.statSync(path.join(backupsDir, file)).mtime
            }))
            .sort((a, b) => b.mtime - a.mtime);
        
        // Keep only the 5 most recent backups
        const filesToDelete = files.slice(5);
        
        filesToDelete.forEach(file => {
            fs.unlinkSync(file.path);
            console.log(`🗑️  Removed old backup: ${file.name}`);
        });
        
        if (filesToDelete.length > 0) {
            console.log(`🧹 Cleaned up ${filesToDelete.length} old backup(s)`);
        }
        
    } catch (error) {
        console.warn('⚠️  Could not clean up old backups:', error.message);
    }
}

// Check if called directly
if (require.main === module) {
    backupDatabase();
}

module.exports = backupDatabase;