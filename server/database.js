const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        const dbPath = path.join(__dirname, '../data/runescape.db');
        
        // Ensure data directory exists
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('✅ Connected to SQLite database');
                this.createTables();
            }
        });
    }

    createTables() {
        const queries = [
            // Worlds table
            `CREATE TABLE IF NOT EXISTS worlds (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                version TEXT DEFAULT '2.0',
                width INTEGER DEFAULT 2000,
                height INTEGER DEFAULT 2000,
                tile_size INTEGER DEFAULT 32,
                creator TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                tiles_count INTEGER DEFAULT 0,
                data TEXT -- JSON data for tiles and metadata
            )`,
            
            // Monsters table (for custom monsters created via Claude terminal)
            `CREATE TABLE IF NOT EXISTS monsters (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                hp INTEGER DEFAULT 50,
                max_hp INTEGER DEFAULT 50,
                damage INTEGER DEFAULT 5,
                defense INTEGER DEFAULT 5,
                color TEXT DEFAULT '#8B0000',
                secondary_color TEXT,
                traits TEXT, -- JSON array of traits
                drops TEXT, -- JSON array of drops
                respawn_time INTEGER DEFAULT 30000,
                description TEXT,
                image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT DEFAULT 'Claude Terminal'
            )`,
            
            // NPCs table (for custom NPCs created via Claude terminal)
            `CREATE TABLE IF NOT EXISTS npcs (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                type TEXT DEFAULT 'villager', -- shopkeeper, guard, villager, etc.
                level INTEGER DEFAULT 1,
                hp INTEGER DEFAULT 100,
                max_hp INTEGER DEFAULT 100,
                color TEXT DEFAULT '#4A90E2',
                dialogue TEXT DEFAULT 'Hello there!',
                shop_inventory TEXT, -- JSON array of shop items
                is_shopkeeper BOOLEAN DEFAULT FALSE,
                friendly BOOLEAN DEFAULT TRUE,
                description TEXT,
                image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT DEFAULT 'Claude Terminal'
            )`,
            
            // Players table (for persistent player data)
            `CREATE TABLE IF NOT EXISTS players (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                experience INTEGER DEFAULT 0,
                hp INTEGER DEFAULT 100,
                max_hp INTEGER DEFAULT 100,
                mp INTEGER DEFAULT 50,
                max_mp INTEGER DEFAULT 50,
                x REAL DEFAULT 1000,
                y REAL DEFAULT 1000,
                stats TEXT, -- JSON for skills (attack, defense, etc.)
                inventory TEXT, -- JSON for inventory items
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // World instances (for tracking active worlds)
            `CREATE TABLE IF NOT EXISTS world_instances (
                id TEXT PRIMARY KEY,
                world_id TEXT NOT NULL,
                name TEXT NOT NULL,
                active_players INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (world_id) REFERENCES worlds (id)
            )`,
            
            // Buildings table (for custom buildings created via Claude terminal)
            `CREATE TABLE IF NOT EXISTS buildings (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                type TEXT DEFAULT 'structure', -- structure, house, shop, tower, etc.
                width INTEGER DEFAULT 64,
                height INTEGER DEFAULT 64,
                color TEXT DEFAULT '#8B4513',
                secondary_color TEXT,
                description TEXT,
                materials TEXT, -- JSON array of required materials
                interior_items TEXT, -- JSON array of items inside
                accessible BOOLEAN DEFAULT TRUE,
                image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT DEFAULT 'Claude Terminal'
            )`,
            
            // Objects table (for interactive objects created via Claude terminal)
            `CREATE TABLE IF NOT EXISTS objects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                type TEXT DEFAULT 'item', -- item, resource, decoration, interactive, etc.
                size TEXT DEFAULT 'small', -- small, medium, large
                color TEXT DEFAULT '#654321',
                interaction_type TEXT DEFAULT 'pickup', -- pickup, use, examine, harvest, etc.
                durability INTEGER DEFAULT 100,
                respawn_time INTEGER DEFAULT 60000,
                drops TEXT, -- JSON array of items it gives when interacted with
                description TEXT,
                image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT DEFAULT 'Claude Terminal'
            )`,
            
            // Quests table (for custom quests created via Claude terminal)
            `CREATE TABLE IF NOT EXISTS quests (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                type TEXT DEFAULT 'fetch', -- fetch, kill, talk, explore, craft, etc.
                difficulty TEXT DEFAULT 'easy', -- easy, medium, hard, expert
                description TEXT NOT NULL,
                objectives TEXT, -- JSON array of quest objectives
                rewards TEXT, -- JSON array of quest rewards
                requirements TEXT, -- JSON array of requirements to start
                npc_giver TEXT, -- NPC who gives the quest
                estimated_time INTEGER DEFAULT 10, -- minutes
                experience_reward INTEGER DEFAULT 100,
                gold_reward INTEGER DEFAULT 50,
                status TEXT DEFAULT 'available', -- available, active, completed
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT DEFAULT 'Claude Terminal'
            )`
        ];

        queries.forEach((query, index) => {
            this.db.run(query, (err) => {
                if (err) {
                    console.error(`Error creating table ${index + 1}:`, err.message);
                } else {
                    console.log(`✅ Table ${index + 1} ready`);
                }
            });
        });
    }

    // World methods
    async saveWorld(worldData) {
        return new Promise((resolve, reject) => {
            const id = worldData.id || require('uuid').v4();
            const tilesCount = worldData.tiles ? Object.keys(worldData.tiles).length : 0;
            
            const query = `INSERT OR REPLACE INTO worlds 
                (id, name, version, width, height, tile_size, creator, tiles_count, data, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
            
            const params = [
                id,
                worldData.name || 'Unnamed World',
                worldData.version || '2.0',
                worldData.width || 2000,
                worldData.height || 2000,
                worldData.tileSize || 32,
                worldData.metadata?.creator || 'Unknown',
                tilesCount,
                JSON.stringify(worldData)
            ];

            this.db.run(query, params, function(err) {
                if (err) {
                    console.error('Error saving world:', err.message);
                    reject(err);
                } else {
                    console.log(`💾 World saved: ${worldData.name} (${id})`);
                    resolve({ worldId: id, success: true });
                }
            });
        });
    }

    async getWorlds() {
        return new Promise((resolve, reject) => {
            const query = `SELECT id, name, creator, created_at, updated_at, tiles_count, width, height 
                          FROM worlds ORDER BY updated_at DESC`;
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const worlds = rows.map(row => ({
                        id: row.id,
                        name: row.name,
                        creator: row.creator,
                        createdAt: row.created_at,
                        updatedAt: row.updated_at,
                        tilesCount: row.tiles_count,
                        dimensions: `${row.width}x${row.height}`
                    }));
                    resolve(worlds);
                }
            });
        });
    }

    async getWorld(worldId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM worlds WHERE id = ?`;
            
            this.db.get(query, [worldId], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    try {
                        const worldData = JSON.parse(row.data);
                        
                        // Ensure dimensions are properly set from database or calculated from tiles
                        worldData.width = row.width || worldData.width || 2000;
                        worldData.height = row.height || worldData.height || 2000;
                        worldData.tileSize = row.tile_size || worldData.tileSize || 32;
                        
                        // Calculate dimensions from tile data if available
                        if (worldData.tiles && Array.isArray(worldData.tiles)) {
                            const tilesY = worldData.tiles.length;
                            const tilesX = worldData.tiles[0] ? worldData.tiles[0].length : 0;
                            worldData.tilesX = tilesX;
                            worldData.tilesY = tilesY;
                            worldData.width = tilesX * worldData.tileSize;
                            worldData.height = tilesY * worldData.tileSize;
                        }
                        
                        resolve(worldData);
                    } catch (parseErr) {
                        reject(new Error('Invalid world data format'));
                    }
                } else {
                    resolve(null);
                }
            });
        });
    }

    async deleteWorld(worldId) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM worlds WHERE id = ?`;
            
            this.db.run(query, [worldId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ deleted: this.changes > 0 });
                }
            });
        });
    }

    // Monster methods
    async saveMonster(monsterData) {
        return new Promise((resolve, reject) => {
            const id = monsterData.id || require('uuid').v4();
            
            const query = `INSERT OR REPLACE INTO monsters 
                (id, name, display_name, level, hp, max_hp, damage, defense, color, 
                 secondary_color, traits, drops, respawn_time, description, image_url) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            const params = [
                id,
                monsterData.name,
                monsterData.displayName || monsterData.name,
                monsterData.level || 1,
                monsterData.hp || 50,
                monsterData.maxHp || monsterData.hp || 50,
                monsterData.damage || 5,
                monsterData.defense || 5,
                monsterData.color || '#8B0000',
                monsterData.secondaryColor,
                JSON.stringify(monsterData.traits || []),
                JSON.stringify(monsterData.drops || []),
                monsterData.respawnTime || 30000,
                monsterData.description,
                monsterData.imageUrl
            ];

            this.db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ monsterId: id, success: true });
                }
            });
        });
    }

    async getMonsters() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM monsters ORDER BY created_at DESC`;
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const monsters = rows.map(row => ({
                        ...row,
                        traits: JSON.parse(row.traits || '[]'),
                        drops: JSON.parse(row.drops || '[]')
                    }));
                    resolve(monsters);
                }
            });
        });
    }

    // NPC methods
    async saveNPC(npcData) {
        return new Promise((resolve, reject) => {
            const id = npcData.id || require('uuid').v4();
            
            const query = `INSERT OR REPLACE INTO npcs 
                (id, name, display_name, type, level, hp, max_hp, color, dialogue, 
                 shop_inventory, is_shopkeeper, friendly, description, image_url) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            const params = [
                id,
                npcData.name,
                npcData.displayName || npcData.name,
                npcData.type || 'villager',
                npcData.level || 1,
                npcData.hp || 100,
                npcData.maxHp || npcData.hp || 100,
                npcData.color || '#4A90E2',
                npcData.dialogue || `Hello, I'm ${npcData.name}!`,
                JSON.stringify(npcData.shopInventory || []),
                npcData.isShopkeeper || false,
                npcData.friendly !== false, // default to true unless explicitly false
                npcData.description,
                npcData.imageUrl
            ];

            this.db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ npcId: id, success: true });
                }
            });
        });
    }

    async getNPCs() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM npcs ORDER BY created_at DESC`;
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const npcs = rows.map(row => ({
                        ...row,
                        shopInventory: JSON.parse(row.shop_inventory || '[]'),
                        isShopkeeper: Boolean(row.is_shopkeeper),
                        friendly: Boolean(row.friendly)
                    }));
                    resolve(npcs);
                }
            });
        });
    }

    async updateNPC(target, changes) {
        return new Promise((resolve, reject) => {
            // First find the NPC by name (case insensitive)
            const findQuery = `SELECT * FROM npcs WHERE LOWER(name) = LOWER(?) OR LOWER(display_name) = LOWER(?)`;
            
            this.db.get(findQuery, [target, target], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (!row) {
                    reject(new Error(`NPC "${target}" not found`));
                    return;
                }
                
                // Build update query dynamically based on changes
                const updateFields = [];
                const updateValues = [];
                
                if (changes.name) {
                    updateFields.push('name = ?', 'display_name = ?');
                    updateValues.push(changes.name, changes.name);
                }
                if (changes.type) {
                    updateFields.push('type = ?');
                    updateValues.push(changes.type);
                }
                if (changes.color) {
                    updateFields.push('color = ?');
                    updateValues.push(changes.color);
                }
                if (changes.dialogue) {
                    updateFields.push('dialogue = ?');
                    updateValues.push(changes.dialogue);
                }
                if (changes.level) {
                    updateFields.push('level = ?');
                    updateValues.push(changes.level);
                }
                
                if (updateFields.length === 0) {
                    reject(new Error('No valid changes provided'));
                    return;
                }
                
                updateValues.push(row.id); // Add ID for WHERE clause
                
                const updateQuery = `UPDATE npcs SET ${updateFields.join(', ')} WHERE id = ?`;
                
                this.db.run(updateQuery, updateValues, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ success: true, updated: this.changes > 0, originalName: row.name, newName: changes.name || row.name });
                    }
                });
            });
        });
    }

    // Building methods
    async saveBuilding(buildingData) {
        return new Promise((resolve, reject) => {
            const id = buildingData.id || require('uuid').v4();
            
            const query = `INSERT OR REPLACE INTO buildings 
                (id, name, display_name, type, width, height, color, secondary_color, description, 
                 materials, interior_items, accessible, image_url) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            const params = [
                id,
                buildingData.name,
                buildingData.displayName || buildingData.name,
                buildingData.type || 'structure',
                buildingData.width || 64,
                buildingData.height || 64,
                buildingData.color || '#8B4513',
                buildingData.secondaryColor,
                buildingData.description,
                JSON.stringify(buildingData.materials || []),
                JSON.stringify(buildingData.interiorItems || []),
                buildingData.accessible !== false,
                buildingData.imageUrl
            ];

            this.db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ buildingId: id, success: true });
                }
            });
        });
    }

    async getBuildings() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM buildings ORDER BY created_at DESC`;
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const buildings = rows.map(row => ({
                        ...row,
                        materials: JSON.parse(row.materials || '[]'),
                        interiorItems: JSON.parse(row.interior_items || '[]'),
                        accessible: Boolean(row.accessible)
                    }));
                    resolve(buildings);
                }
            });
        });
    }

    // Object methods
    async saveObject(objectData) {
        return new Promise((resolve, reject) => {
            const id = objectData.id || require('uuid').v4();
            
            const query = `INSERT OR REPLACE INTO objects 
                (id, name, display_name, type, size, color, interaction_type, durability, 
                 respawn_time, drops, description, image_url) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            const params = [
                id,
                objectData.name,
                objectData.displayName || objectData.name,
                objectData.type || 'item',
                objectData.size || 'small',
                objectData.color || '#654321',
                objectData.interactionType || 'pickup',
                objectData.durability || 100,
                objectData.respawnTime || 60000,
                JSON.stringify(objectData.drops || []),
                objectData.description,
                objectData.imageUrl
            ];

            this.db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ objectId: id, success: true });
                }
            });
        });
    }

    async getObjects() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM objects ORDER BY created_at DESC`;
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const objects = rows.map(row => ({
                        ...row,
                        drops: JSON.parse(row.drops || '[]')
                    }));
                    resolve(objects);
                }
            });
        });
    }

    // Quest methods
    async saveQuest(questData) {
        return new Promise((resolve, reject) => {
            const id = questData.id || require('uuid').v4();
            
            const query = `INSERT OR REPLACE INTO quests 
                (id, name, display_name, type, difficulty, description, objectives, rewards, 
                 requirements, npc_giver, estimated_time, experience_reward, gold_reward, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            const params = [
                id,
                questData.name,
                questData.displayName || questData.name,
                questData.type || 'fetch',
                questData.difficulty || 'easy',
                questData.description,
                JSON.stringify(questData.objectives || []),
                JSON.stringify(questData.rewards || []),
                JSON.stringify(questData.requirements || []),
                questData.npcGiver,
                questData.estimatedTime || 10,
                questData.experienceReward || 100,
                questData.goldReward || 50,
                questData.status || 'available'
            ];

            this.db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ questId: id, success: true });
                }
            });
        });
    }

    async getQuests() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM quests ORDER BY created_at DESC`;
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const quests = rows.map(row => ({
                        ...row,
                        objectives: JSON.parse(row.objectives || '[]'),
                        rewards: JSON.parse(row.rewards || '[]'),
                        requirements: JSON.parse(row.requirements || '[]')
                    }));
                    resolve(quests);
                }
            });
        });
    }

    // Player methods
    async savePlayer(playerData) {
        return new Promise((resolve, reject) => {
            const query = `INSERT OR REPLACE INTO players 
                (id, username, password, level, experience, hp, max_hp, mp, max_mp, x, y, stats, inventory, last_login) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
            
            const params = [
                playerData.id,
                playerData.username,
                playerData.password,
                playerData.level || 1,
                playerData.experience || 0,
                playerData.hp || 100,
                playerData.maxHp || 100,
                playerData.mp || 50,
                playerData.maxMp || 50,
                playerData.x || 1000,
                playerData.y || 1000,
                JSON.stringify(playerData.stats || {}),
                JSON.stringify(playerData.inventory || [])
            ];

            this.db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ success: true });
                }
            });
        });
    }

    async getPlayer(username) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM players WHERE username = ?`;
            
            this.db.get(query, [username], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    const player = {
                        ...row,
                        stats: JSON.parse(row.stats || '{}'),
                        inventory: JSON.parse(row.inventory || '[]')
                    };
                    resolve(player);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Utility methods
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('🔒 Database connection closed');
                }
            });
        }
    }

    // Database stats
    async getStats() {
        return new Promise((resolve, reject) => {
            const queries = [
                "SELECT COUNT(*) as worlds FROM worlds",
                "SELECT COUNT(*) as monsters FROM monsters", 
                "SELECT COUNT(*) as players FROM players"
            ];

            Promise.all(queries.map(query => 
                new Promise((res, rej) => {
                    this.db.get(query, [], (err, row) => {
                        if (err) rej(err);
                        else res(row);
                    });
                })
            )).then(results => {
                resolve({
                    worlds: results[0].worlds,
                    monsters: results[1].monsters,
                    players: results[2].players
                });
            }).catch(reject);
        });
    }
}

module.exports = new Database();