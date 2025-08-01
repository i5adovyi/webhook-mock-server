const Datastore = require('nedb');
const path = require('path');

class WebhookDatabase {
    constructor(dbPath = './webhooks.db') {
        this.db = new Datastore({ 
            filename: dbPath, 
            autoload: true,
            timestampData: true
        });
        
        // Create indexes for better performance
        this.db.ensureIndex({ fieldName: 'timestamp' });
        this.db.ensureIndex({ fieldName: 'id' });
        
        console.log(`📁 Database initialized: ${dbPath}`);
    }

    // Insert a new webhook event
    insertEvent(eventData) {
        return new Promise((resolve, reject) => {
            // Get the next ID
            this.getNextId().then(nextId => {
                const event = {
                    id: nextId,
                    timestamp: new Date().toISOString(),
                    ...eventData
                };

                this.db.insert(event, (err, newDoc) => {
                    if (err) {
                        console.error('❌ Database insert error:', err);
                        reject(err);
                    } else {
                        console.log(`✅ Event ${newDoc.id} stored in database`);
                        resolve(newDoc);
                    }
                });
            }).catch(reject);
        });
    }

    // Get next available ID
    getNextId() {
        return new Promise((resolve, reject) => {
            this.db.find({}).sort({ id: -1 }).limit(1).exec((err, docs) => {
                if (err) {
                    reject(err);
                } else {
                    const nextId = docs.length > 0 ? docs[0].id + 1 : 1;
                    resolve(nextId);
                }
            });
        });
    }

    // Get all events with pagination
    getEvents(skip = 0, limit = 25, sortBy = 'timestamp', sortOrder = -1) {
        return new Promise((resolve, reject) => {
            const sortObj = {};
            sortObj[sortBy] = sortOrder;

            this.db.find({})
                .sort(sortObj)
                .skip(skip)
                .limit(limit)
                .exec((err, docs) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(docs);
                    }
                });
        });
    }

    // Get total count of events
    getEventCount() {
        return new Promise((resolve, reject) => {
            this.db.count({}, (err, count) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(count);
                }
            });
        });
    }

    // Get event by ID
    getEventById(id) {
        return new Promise((resolve, reject) => {
            this.db.findOne({ id: parseInt(id) }, (err, doc) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(doc);
                }
            });
        });
    }

    // Search events
    searchEvents(searchQuery, skip = 0, limit = 25) {
        return new Promise((resolve, reject) => {
            if (!searchQuery || searchQuery.trim() === '') {
                // If no search query, return all events
                this.getEvents(skip, limit).then(resolve).catch(reject);
                return;
            }

            const query = searchQuery.toLowerCase();
            
            // Use $where function for flexible searching across all fields
            this.db.find({
                $where: function() {
                    // Convert the entire document to string for searching
                    const docStr = JSON.stringify(this).toLowerCase();
                    
                    // Check if query matches any field
                    return docStr.includes(query) ||
                           this.id.toString().includes(query) ||
                           (this.method && this.method.toLowerCase().includes(query)) ||
                           (this.url && this.url.toLowerCase().includes(query));
                }
            })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .exec((err, docs) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }

    // Get count of search results
    getSearchCount(searchQuery) {
        return new Promise((resolve, reject) => {
            if (!searchQuery || searchQuery.trim() === '') {
                this.getEventCount().then(resolve).catch(reject);
                return;
            }

            const query = searchQuery.toLowerCase();
            
            this.db.count({
                $where: function() {
                    const docStr = JSON.stringify(this).toLowerCase();
                    return docStr.includes(query) ||
                           this.id.toString().includes(query) ||
                           (this.method && this.method.toLowerCase().includes(query)) ||
                           (this.url && this.url.toLowerCase().includes(query));
                }
            }, (err, count) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(count);
                }
            });
        });
    }

    // Delete all events
    clearAllEvents() {
        return new Promise((resolve, reject) => {
            this.db.remove({}, { multi: true }, (err, numRemoved) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`🧹 Cleared ${numRemoved} events from database`);
                    resolve(numRemoved);
                }
            });
        });
    }

    // Delete events older than specified days
    clearOldEvents(daysOld = 7) {
        return new Promise((resolve, reject) => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const cutoffISO = cutoffDate.toISOString();

            this.db.remove(
                { timestamp: { $lt: cutoffISO } }, 
                { multi: true }, 
                (err, numRemoved) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`🧹 Cleared ${numRemoved} events older than ${daysOld} days`);
                        resolve(numRemoved);
                    }
                }
            );
        });
    }

    // Export all events to JSON
    exportEvents() {
        return new Promise((resolve, reject) => {
            this.db.find({}).sort({ timestamp: -1 }).exec((err, docs) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }

    // Get database statistics
    getStats() {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.getEventCount(),
                this.getOldestEvent(),
                this.getNewestEvent(),
                this.getDatabaseSize()
            ]).then(([count, oldest, newest, size]) => {
                resolve({
                    totalEvents: count,
                    oldestEvent: oldest,
                    newestEvent: newest,
                    databaseSize: size
                });
            }).catch(reject);
        });
    }

    // Get oldest event
    getOldestEvent() {
        return new Promise((resolve, reject) => {
            this.db.find({}).sort({ timestamp: 1 }).limit(1).exec((err, docs) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs.length > 0 ? docs[0] : null);
                }
            });
        });
    }

    // Get newest event
    getNewestEvent() {
        return new Promise((resolve, reject) => {
            this.db.find({}).sort({ timestamp: -1 }).limit(1).exec((err, docs) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs.length > 0 ? docs[0] : null);
                }
            });
        });
    }

    // Get database file size (approximate)
    getDatabaseSize() {
        return new Promise((resolve, reject) => {
            const fs = require('fs');
            const dbPath = this.db.filename;
            
            fs.stat(dbPath, (err, stats) => {
                if (err) {
                    resolve('Unknown');
                } else {
                    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
                    resolve(`${sizeInMB} MB`);
                }
            });
        });
    }

    // Compact database (remove deleted records)
    compactDatabase() {
        return new Promise((resolve, reject) => {
            this.db.persistence.compactDatafile();
            console.log('🗜️  Database compacted');
            resolve();
        });
    }
}

module.exports = WebhookDatabase;