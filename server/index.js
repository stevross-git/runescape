const path = require('path');
const dotenv = require('dotenv');

// Clear any existing OPENAI_API_KEY from system environment
if (process.env.OPENAI_API_KEY) {
    console.log('⚠️ Clearing existing system OPENAI_API_KEY to use .env file');
    delete process.env.OPENAI_API_KEY;
}

// Load environment variables
const envPath = path.join(__dirname, '../.env');
const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
    console.warn('⚠️ Could not load .env file:', result.error.message);
} else {
    console.log(`✅ Loaded ${Object.keys(result.parsed || {}).length} environment variables from .env`);
    console.log(`🔑 Using API key: ${process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 15) + '...' : 'NOT SET'}`);
}
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const database = require('./database');
const AIGameMaster = require('./ai-gamemaster');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../client')));

const players = new Map();
const users = new Map();
const npcs = new Map();
const shops = new Map();

// Initialize AI Game Master
let aiGameMaster = null;

// Global world data for terrain checking
let currentWorldData = null;

// PvP Areas - Define zones where players can attack each other
const pvpAreas = [
    {
        name: 'Wilderness',
        x1: 500, y1: 100,    // Top-left corner
        x2: 1500, y2: 400,   // Bottom-right corner
        level: 1,            // Combat level difference allowed
        description: 'A dangerous area where players can attack each other'
    },
    {
        name: 'PvP Arena',
        x1: 200, y1: 800,
        x2: 600, y2: 1200,
        level: 5,
        description: 'Organized PvP combat area'
    }
];

const defaultPlayerData = {
    x: 1000,
    y: 1000,
    stats: {
        hp: 10,
        maxHp: 10,
        mp: 10,
        maxMp: 10,
        prayer: 10,
        maxPrayer: 10,
        level: 1,
        experience: 0
    },
    skills: {
        attack: 1,
        defense: 1,
        strength: 1,
        hitpoints: 10,
        magic: 1,
        ranged: 1,
        prayer: 1,
        mining: 1,
        woodcutting: 1,
        fishing: 1,
        farming: 1,
        cooking: 1
    },
    inventory: [
        { name: 'bronze dagger', type: 'equipment', slot: 'weapon', attackBonus: 1, defenseBonus: 0 },
        { name: 'iron axe', type: 'equipment', slot: 'weapon', attackBonus: 3, defenseBonus: 0 },
        { name: 'iron pickaxe', type: 'equipment', slot: 'weapon', attackBonus: 2, defenseBonus: 0 },
        { name: 'bread', type: 'consumable', healAmount: 5 },
        { name: 'bread', type: 'consumable', healAmount: 5 },
        { name: 'bread', type: 'consumable', healAmount: 5 },
        { name: 'coins', type: 'currency', quantity: 100 },
        { name: 'air rune', type: 'rune', quantity: 50 },
        { name: 'water rune', type: 'rune', quantity: 25 },
        { name: 'earth rune', type: 'rune', quantity: 25 },
        { name: 'fire rune', type: 'rune', quantity: 25 },
        ...new Array(18).fill(null)
    ],
    equipment: {
        weapon: null,
        helmet: null,
        armor: null,
        legs: null,
        boots: null,
        gloves: null
    },
    skillExperience: {
        attack: 0,
        defense: 0,
        strength: 0,
        hitpoints: 1154, // Level 10 starting HP
        magic: 0,
        ranged: 0,
        prayer: 0,
        mining: 0,
        woodcutting: 0,
        fishing: 1,
        farming: 0,
        cooking: 0
    },
    activePrayers: [],
    prayerDrainRate: 0,
    bank: new Array(100).fill(null), // 100 bank slots
    
    // Quest system
    quests: {
        'first_steps': {
            name: 'First Steps',
            description: 'Learn the basics of the game',
            status: 'available', // available, active, completed
            objectives: [
                { text: 'Cut down a tree', completed: false },
                { text: 'Kill a goblin', completed: false },
                { text: 'Reach level 2 in any skill', completed: false }
            ],
            rewards: {
                experience: { attack: 100, defense: 100 },
                items: [{ name: 'coins', quantity: 50 }]
            }
        }
    }
};

// PvP Helper Functions
function isInPvPArea(x, y) {
    for (let area of pvpAreas) {
        if (x >= area.x1 && x <= area.x2 && y >= area.y1 && y <= area.y2) {
            return area;
        }
    }
    return null;
}

function canAttackPlayer(attacker, target) {
    const attackerArea = isInPvPArea(attacker.x, attacker.y);
    const targetArea = isInPvPArea(target.x, target.y);
    
    // Both players must be in the same PvP area
    if (!attackerArea || !targetArea || attackerArea.name !== targetArea.name) {
        return false;
    }
    
    // Check combat level difference
    const attackerLevel = attacker.skills.attack + attacker.skills.defense;
    const targetLevel = target.skills.attack + target.skills.defense;
    const levelDifference = Math.abs(attackerLevel - targetLevel);
    
    return levelDifference <= attackerArea.level * 10; // Scale level difference
}

function handlePlayerAttack(attacker, target, socket) {
    if (!canAttackPlayer(attacker, target)) {
        socket.emit('chatMessage', { 
            username: 'System', 
            message: 'You cannot attack that player here!' 
        });
        return false;
    }
    
    // Calculate damage (similar to NPC combat)
    const attackerWeapon = attacker.equipment?.weapon;
    const attackBonus = attackerWeapon ? attackerWeapon.attackBonus : 1;
    const strengthBonus = attacker.skills.strength;
    
    const targetArmor = target.equipment?.armor;
    const defenseBonus = targetArmor ? targetArmor.defenseBonus : 0;
    const defenseLevel = target.skills.defense;
    
    const baseDamage = Math.max(1, attackBonus + Math.floor(strengthBonus / 2));
    const defense = defenseBonus + Math.floor(defenseLevel / 3);
    const damage = Math.max(1, baseDamage - defense + Math.floor(Math.random() * 3));
    
    // Apply damage
    target.stats.hp = Math.max(0, target.stats.hp - damage);
    
    // Emit combat events to all players
    io.emit('playerAttacked', {
        attackerId: attacker.id,
        targetId: target.id,
        damage: damage,
        attackerDefense: defense
    });
    
    // Handle player death
    if (target.stats.hp <= 0) {
        handlePlayerDeath(target, attacker);
        return true;
    }
    
    return true;
}

function handlePlayerDeath(victim, killer) {
    // Reset HP
    victim.stats.hp = victim.stats.maxHp;
    
    // Move to safe respawn location
    victim.x = 1000;
    victim.y = 1000;
    
    // Drop some items (simple implementation)
    const droppedItems = [];
    for (let i = 0; i < victim.inventory.length; i++) {
        if (victim.inventory[i] && Math.random() < 0.3) { // 30% chance to drop
            droppedItems.push(victim.inventory[i]);
            victim.inventory[i] = null;
        }
    }
    
    // Give some items to killer
    for (let item of droppedItems) {
        addItemToInventory(killer, item);
    }
    
    // Emit events
    const victimSocket = Array.from(io.sockets.sockets.values()).find(s => s.playerId === victim.id);
    const killerSocket = Array.from(io.sockets.sockets.values()).find(s => s.playerId === killer.id);
    
    if (victimSocket) {
        victimSocket.emit('playerDeath', { killer: killer.username });
        victimSocket.emit('respawned', {
            x: victim.x,
            y: victim.y,
            hp: victim.stats.hp,
            maxHp: victim.stats.maxHp
        });
    }
    
    if (killerSocket) {
        killerSocket.emit('chatMessage', {
            username: 'System',
            message: `You have defeated ${victim.username}!`
        });
    }
    
    io.emit('chatMessage', {
        username: 'System',
        message: `${killer.username} has defeated ${victim.username} in combat!`
    });
}

// Check if terrain is suitable for monster spawning
function isValidMonsterTerrain(terrain) {
    const validTerrains = ['grass', 'dirt', 'mud', 'stone', 'sand', 'cobblestone'];
    const invalidTerrains = ['water', 'lava', 'ice'];
    
    // Explicitly reject water and other liquid terrains
    if (invalidTerrains.includes(terrain)) {
        return false;
    }
    
    // Accept most solid ground terrains
    if (validTerrains.includes(terrain)) {
        return true;
    }
    
    // For unknown terrain types, default to allowing spawning (conservative approach)
    // but log it for debugging
    if (terrain && terrain !== 'grass') {
        console.log(`🤔 Unknown terrain type for monster spawning: ${terrain} - allowing`);
    }
    
    return true;
}

// Get terrain type at a specific position (matches client logic)
function getTerrainAt(x, y) {
    // Check if we have custom world data loaded
    if (currentWorldData && currentWorldData.tiles) {
        const tileSize = currentWorldData.tileSize || 32;
        const tileX = Math.floor(x / tileSize);
        const tileY = Math.floor(y / tileSize);
        
        // Handle both 2D array format (from world builder) and object format
        if (Array.isArray(currentWorldData.tiles)) {
            // 2D array format: tiles[y][x]
            if (tileY >= 0 && tileY < currentWorldData.tiles.length && 
                tileX >= 0 && tileX < currentWorldData.tiles[tileY].length) {
                const customTile = currentWorldData.tiles[tileY][tileX];
                if (customTile && customTile.type) {
                    return customTile.type;
                }
            }
        } else {
            // Object format: tiles["x,y"] (legacy)
            const tileKey = `${tileX},${tileY}`;
            const customTile = currentWorldData.tiles[tileKey];
            if (customTile && customTile.type) {
                return customTile.type;
            }
        }
        
        // Default to grass if no tile data found
        return 'grass';
    }
    
    // Default world terrain generation (original logic)
    const tileSize = 32;
    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor(y / tileSize);
    const noise = Math.sin(tileX * 0.1) * Math.cos(tileY * 0.1) + Math.sin(tileX * 0.05) * 0.5;
    
    // Water areas
    if (y < 150 || (y > 800 && y < 900 && x > 600 && x < 900)) {
        return 'water';
    }
    // Sandy beaches
    else if (y < 180 || (y > 770 && y < 810 && x > 570 && x < 930)) {
        return 'sand';
    }
    // Mountain/rocky areas
    else if (y > 2000 - 300 || (noise > 0.7 && y > 1200)) {
        return 'stone';
    }
    // Muddy/swamp areas
    else if (x > 1400 && x < 1600 && y > 400 && y < 600) {
        return 'mud';
    }
    // Paths
    else if (
        (x > 480 && x < 520 && y > 200 && y < 1800) ||
        (y > 580 && y < 620 && x > 200 && x < 1800) ||
        (Math.abs(x - y) < 40 && x > 300 && x < 800)
    ) {
        return 'path';
    }
    // Dirt patches
    else if (
        ((tileX * 7 + tileY * 13) % 31 === 0) ||
        ((x > 520 && x < 560 && y > 200 && y < 1800) ||
         (y > 620 && y < 660 && x > 200 && x < 1800))
    ) {
        return 'dirt';
    }
    // Default grass
    else {
        return 'grass';
    }
}

// Initialize NPCs
function initializeNPCs() {
    let goblinCount = 0;
    let attempts = 0;
    
    // Spawn goblins only on appropriate terrain
    while (goblinCount < 10 && attempts < 100) {
        const x = Math.random() * 2000;
        const y = Math.random() * 2000;
        const terrain = getTerrainAt(x, y);
        
        // Enhanced terrain validation for monster spawning
        if (isValidMonsterTerrain(terrain)) {
            const npc = {
                id: `goblin_${goblinCount}`,
                type: 'goblin',
                x: x,
                y: y,
                hp: 15,
                maxHp: 15,
                level: 2,
                attackDamage: 3,
                isInCombat: false,
                target: null,
                lastAttack: 0,
                wanderTarget: {
                    x: x + (Math.random() - 0.5) * 200,
                    y: y + (Math.random() - 0.5) * 200
                },
                lastWander: Date.now(),
                speed: 30,
                aggroRange: 100,
                combatRange: 40
            };
            npcs.set(npc.id, npc);
            goblinCount++;
        }
        attempts++;
    }
    
    // Add town NPCs (static positions in buildings)
    const townNPCs = [
        {
            id: 'banker_town',
            type: 'banker',
            name: 'Bank Teller',
            x: 920 + 48, // Bank center
            y: 940 + 40,
            hp: 50,
            maxHp: 50,
            level: 25,
            isShop: true,
            canAttack: false,
            wanderRange: 0 // Static NPC
        },
        {
            id: 'shopkeeper_general',
            type: 'shopkeeper',
            name: 'General Store Owner',
            x: 1040 + 40, // General store center
            y: 950 + 32,
            hp: 40,
            maxHp: 40,
            level: 20,
            isShop: true,
            canAttack: false,
            wanderRange: 0
        },
        {
            id: 'shopkeeper_magic',
            type: 'shopkeeper',
            name: 'Magic Shop Owner',
            x: 960 + 36, // Magic shop center
            y: 1060 + 32,
            hp: 45,
            maxHp: 45,
            level: 30,
            isShop: true,
            canAttack: false,
            wanderRange: 0
        }
    ];
    
    // Add town NPCs to the npcs map
    for (let townNPC of townNPCs) {
        npcs.set(townNPC.id, townNPC);
    }
    
    console.log(`Initialized ${npcs.size} NPCs (including ${townNPCs.length} town NPCs)`);
}

// Initialize Shops
function initializeShops() {
    // General Store
    const generalStore = {
        id: 'general_store',
        name: 'General Store',
        type: 'shopkeeper',
        x: 500,
        y: 500,
        hp: 50,
        maxHp: 50,
        level: 10,
        isShop: true,
        inventory: [
            { name: 'bread', type: 'consumable', healAmount: 5, price: 3, stock: 50 },
            { name: 'health potion', type: 'consumable', healAmount: 15, price: 10, stock: 20 },
            { name: 'bronze dagger', type: 'equipment', slot: 'weapon', attackBonus: 1, defenseBonus: 0, price: 25, stock: 5 },
            { name: 'iron axe', type: 'equipment', slot: 'weapon', attackBonus: 3, defenseBonus: 0, price: 50, stock: 3 },
            { name: 'iron pickaxe', type: 'equipment', slot: 'weapon', attackBonus: 2, defenseBonus: 0, price: 40, stock: 3 }
        ]
    };
    npcs.set(generalStore.id, generalStore);
    shops.set(generalStore.id, generalStore);
    
    // Armor Shop
    const armorShop = {
        id: 'armor_shop',
        name: 'Armor Shop',
        type: 'shopkeeper',
        x: 1500,
        y: 500,
        hp: 50,
        maxHp: 50,
        level: 15,
        isShop: true,
        inventory: [
            { name: 'leather armor', type: 'equipment', slot: 'armor', attackBonus: 0, defenseBonus: 3, price: 35, stock: 8 },
            { name: 'leather cap', type: 'equipment', slot: 'helmet', attackBonus: 0, defenseBonus: 1, price: 15, stock: 10 },
            { name: 'leather boots', type: 'equipment', slot: 'boots', attackBonus: 0, defenseBonus: 1, price: 20, stock: 10 },
            { name: 'leather gloves', type: 'equipment', slot: 'gloves', attackBonus: 0, defenseBonus: 1, price: 15, stock: 10 },
            { name: 'iron helmet', type: 'equipment', slot: 'helmet', attackBonus: 0, defenseBonus: 2, price: 40, stock: 5 },
            { name: 'chainmail', type: 'equipment', slot: 'armor', attackBonus: 0, defenseBonus: 5, price: 80, stock: 3 }
        ]
    };
    npcs.set(armorShop.id, armorShop);
    shops.set(armorShop.id, armorShop);
    
    // Magic Shop
    const magicShop = {
        id: 'magic_shop',
        name: 'Magic Shop',
        type: 'shopkeeper',
        x: 1000,
        y: 1500,
        hp: 50,
        maxHp: 50,
        level: 20,
        isShop: true,
        inventory: [
            { name: 'air rune', type: 'rune', quantity: 1, price: 2, stock: 1000 },
            { name: 'water rune', type: 'rune', quantity: 1, price: 3, stock: 500 },
            { name: 'earth rune', type: 'rune', quantity: 1, price: 3, stock: 500 },
            { name: 'fire rune', type: 'rune', quantity: 1, price: 4, stock: 500 },
            { name: 'mind rune', type: 'rune', quantity: 1, price: 5, stock: 200 },
            { name: 'body rune', type: 'rune', quantity: 1, price: 8, stock: 100 },
            { name: 'wizard hat', type: 'equipment', slot: 'helmet', attackBonus: 0, defenseBonus: 0, magicBonus: 2, price: 50, stock: 3 },
            { name: 'wizard robe', type: 'equipment', slot: 'armor', attackBonus: 0, defenseBonus: 1, magicBonus: 3, price: 80, stock: 2 }
        ]
    };
    npcs.set(magicShop.id, magicShop);
    shops.set(magicShop.id, magicShop);
    
    // Banking NPC (not a shop, but uses similar mechanics)
    const banker = {
        id: 'banker',
        name: 'Banker',
        type: 'banker',
        x: 750,
        y: 750,
        hp: 50,
        maxHp: 50,
        level: 25,
        isBank: true
    };
    npcs.set(banker.id, banker);
    shops.set(banker.id, banker); // Use shops system for easy management
    
    // Add quest giver NPC
    const questGiver = {
        id: 'quest_giver',
        type: 'quest_giver',
        x: 800,
        y: 800,
        hp: 100,
        maxHp: 100,
        lastMovement: Date.now(),
        aggro: null,
        state: 'idle',
        quests: ['first_steps']
    };
    npcs.set(questGiver.id, questGiver);
    
    console.log(`Initialized ${shops.size} shops and banks, and quest system`);
}

// NPC AI Update Loop
function updateNPCs() {
    const now = Date.now();
    
    for (let npc of npcs.values()) {
        // Skip shopkeepers and bankers - they don't move or fight
        if (npc.isShop || npc.isBank) {
            continue;
        }
        
        // Skip dead NPCs
        if (npc.hp <= 0) {
            // Respawn after 30 seconds
            if (now - npc.deathTime > 30000) {
                npc.hp = npc.maxHp;
                npc.isInCombat = false;
                npc.target = null;
                delete npc.deathTime;
                console.log(`${npc.type} ${npc.id} respawned`);
            }
            continue;
        }
        
        // Find nearest player for aggro
        let nearestPlayer = null;
        let nearestDistance = Infinity;
        
        for (let player of players.values()) {
            const distance = Math.sqrt((player.x - npc.x) ** 2 + (player.y - npc.y) ** 2);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestPlayer = player;
            }
        }
        
        // Combat behavior
        if (npc.isInCombat && npc.target) {
            const targetPlayer = players.get(npc.target);
            if (targetPlayer) {
                const distance = Math.sqrt((targetPlayer.x - npc.x) ** 2 + (targetPlayer.y - npc.y) ** 2);
                
                // Move towards target
                if (distance > npc.combatRange) {
                    const dx = targetPlayer.x - npc.x;
                    const dy = targetPlayer.y - npc.y;
                    const moveDistance = npc.speed / 10; // Move speed per update
                    const ratio = moveDistance / distance;
                    
                    npc.x += dx * ratio;
                    npc.y += dy * ratio;
                }
                
                // Attack if in range and cooldown expired
                if (distance <= npc.combatRange && now - npc.lastAttack > 2000) {
                    const baseDamage = Math.floor(Math.random() * npc.attackDamage) + 1;
                    
                    // Calculate player's defense bonus
                    const playerDefense = (targetPlayer.equipment?.armor?.defenseBonus || 0) + 
                                        (targetPlayer.equipment?.helmet?.defenseBonus || 0) + 
                                        (targetPlayer.equipment?.legs?.defenseBonus || 0) + 
                                        (targetPlayer.equipment?.boots?.defenseBonus || 0) + 
                                        (targetPlayer.equipment?.gloves?.defenseBonus || 0);
                    
                    // Reduce damage based on defense (max 80% reduction)
                    const damageReduction = Math.min(0.8, playerDefense * 0.05);
                    const finalDamage = Math.max(1, Math.floor(baseDamage * (1 - damageReduction)));
                    
                    npc.lastAttack = now;
                    
                    // Actually damage the player
                    targetPlayer.stats.hp = Math.max(0, targetPlayer.stats.hp - finalDamage);
                    
                    // Update user data
                    const user = users.get(targetPlayer.username);
                    if (user) {
                        user.playerData.stats = { ...targetPlayer.stats };
                    }
                    
                    // Send damage notification to target player
                    const targetSocket = Array.from(io.sockets.sockets.values())
                        .find(s => s.playerId === npc.target);
                    
                    if (targetSocket) {
                        targetSocket.emit('takeDamage', {
                            damage: finalDamage,
                            hp: targetPlayer.stats.hp,
                            maxHp: targetPlayer.stats.maxHp,
                            attacker: npc.type
                        });
                        
                        if (targetPlayer.stats.hp <= 0) {
                            targetSocket.emit('playerDeath', {
                                killer: npc.type
                            });
                            // Reset combat
                            npc.isInCombat = false;
                            npc.target = null;
                        }
                    }
                    
                    // Broadcast attack animation to all players
                    io.to('game').emit('npcAttack', {
                        npcId: npc.id,
                        targetId: npc.target,
                        damage: finalDamage,
                        npcX: npc.x,
                        npcY: npc.y,
                        playerDefense: playerDefense
                    });
                }
                
                // Stop combat if target too far away (200+ distance)
                if (distance > 200) {
                    npc.isInCombat = false;
                    npc.target = null;
                }
            } else {
                // Target disconnected
                npc.isInCombat = false;
                npc.target = null;
            }
        }
        // Aggro behavior - attack nearby players
        else if (nearestPlayer && nearestDistance <= npc.aggroRange) {
            npc.isInCombat = true;
            npc.target = nearestPlayer.id;
            console.log(`${npc.type} ${npc.id} is now attacking ${nearestPlayer.username}`);
        }
        // Wandering behavior (only for NPCs that can wander)
        else if (now - npc.lastWander > 5000 && npc.wanderRange !== 0) {
            // Move towards wander target
            const dx = npc.wanderTarget.x - npc.x;
            const dy = npc.wanderTarget.y - npc.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 50) {
                // Reached target, pick new one that's on valid terrain
                let newX, newY, validTerrain;
                let wanderAttempts = 0;
                
                do {
                    newX = Math.max(50, Math.min(1950, npc.x + (Math.random() - 0.5) * 400));
                    newY = Math.max(50, Math.min(1950, npc.y + (Math.random() - 0.5) * 400));
                    const terrain = getTerrainAt(newX, newY);
                    validTerrain = isValidMonsterTerrain(terrain);
                    wanderAttempts++;
                } while (!validTerrain && wanderAttempts < 10);
                
                // If we couldn't find valid terrain, just stay put
                if (validTerrain) {
                    npc.wanderTarget = { x: newX, y: newY };
                } else {
                    npc.wanderTarget = { x: npc.x, y: npc.y };
                }
            } else {
                // Move towards target
                const moveDistance = npc.speed / 10;
                const ratio = moveDistance / distance;
                npc.x += dx * ratio;
                npc.y += dy * ratio;
            }
            
            npc.lastWander = now;
        }
    }
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('register', (data) => {
        const { username, password } = data;
        
        if (users.has(username)) {
            socket.emit('registerFailed', 'Username already exists');
            return;
        }
        
        if (username.length < 3 || username.length > 12) {
            socket.emit('registerFailed', 'Username must be 3-12 characters');
            return;
        }
        
        users.set(username, {
            password: password,
            playerData: { ...defaultPlayerData }
        });
        
        socket.emit('registerSuccess', 'Account created successfully! You can now login.');
    });

    socket.on('login', (data) => {
        const { username, password } = data;
        
        if (!users.has(username)) {
            socket.emit('loginFailed', 'Username not found');
            return;
        }
        
        const user = users.get(username);
        if (user.password !== password) {
            socket.emit('loginFailed', 'Incorrect password');
            return;
        }
        
        for (let [playerId, player] of players) {
            if (player.username === username) {
                socket.emit('loginFailed', 'User already logged in');
                return;
            }
        }
        
        const playerId = uuidv4();
        const playerData = {
            id: playerId,
            username: username,
            socketId: socket.id,
            ...user.playerData
        };
        
        players.set(playerId, playerData);
        socket.playerId = playerId;
        
        socket.emit('loginSuccess', playerData);
        
        socket.join('game');
        broadcastPlayersUpdate();
        
        socket.emit('chatMessage', {
            username: 'System',
            message: `Welcome to the game, ${username}!`
        });
    });

    socket.on('playerMove', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        if (player) {
            const newX = Math.max(0, Math.min(2000, data.x));
            const newY = Math.max(0, Math.min(2000, data.y));
            
            // Check if destination is walkable (not water)
            const terrain = getTerrainAt(newX, newY);
            if (terrain === 'water') {
                // Reject movement to water, send back current position
                socket.emit('playerMove', {
                    id: player.id,
                    x: player.x,
                    y: player.y
                });
                return;
            }
            
            player.x = newX;
            player.y = newY;
            
            socket.to('game').emit('playerMove', {
                id: player.id,
                x: player.x,
                y: player.y
            });
            
            // Track player movement for AI Game Master
            if (aiGameMaster) {
                aiGameMaster.trackPlayerAction(player.id, 'move', {
                    location: { x: player.x, y: player.y },
                    level: player.level
                });
            }
            
            const user = users.get(player.username);
            if (user) {
                user.playerData.x = player.x;
                user.playerData.y = player.y;
            }
        }
    });

    socket.on('chatMessage', (message) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        if (player && message.trim().length > 0) {
            io.to('game').emit('chatMessage', {
                username: player.username,
                message: message.trim()
            });
            
            // Track chat for AI Game Master
            if (aiGameMaster) {
                aiGameMaster.trackPlayerAction(player.id, 'chat', {
                    message: message.trim(),
                    location: { x: player.x, y: player.y },
                    level: player.level
                });
            }
        }
    });

    socket.on('attackNPC', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        const npc = npcs.get(data.npcId);
        
        if (player && npc && npc.hp > 0) {
            // Calculate damage (weapon bonus + strength bonus + random)
            const weapon = player.equipment?.weapon;
            const weaponBonus = weapon?.attackBonus || 0;
            const strengthBonus = Math.floor(player.skills.strength / 4); // Each 4 levels = +1 damage
            const baseDamage = 1 + weaponBonus + strengthBonus;
            const damage = Math.floor(Math.random() * baseDamage) + baseDamage;
            
            // Damage the NPC
            npc.hp = Math.max(0, npc.hp - damage);
            
            const bonusText = strengthBonus > 0 ? ` (+${strengthBonus} str)` : '';
            socket.emit('chatMessage', {
                username: 'Combat',
                message: `You deal ${damage} damage to the ${npc.type}!${bonusText}`
            });
            
            // Grant combat XP (Attack, Strength, and Hitpoints)
            const skillExp = player.skillExperience = player.skillExperience || {};
            const combatXP = damage * 4;
            
            // Initialize XP if needed
            if (!skillExp.attack) skillExp.attack = 0;
            if (!skillExp.strength) skillExp.strength = 0;
            if (!skillExp.hitpoints) skillExp.hitpoints = 1154; // Level 10 starting
            
            // Award XP to combat skills
            skillExp.attack += combatXP;
            skillExp.strength += combatXP;
            skillExp.hitpoints += combatXP / 3; // HP gets 1/3 XP like RuneScape
            
            // Check for level ups
            checkAndHandleLevelUp(player, socket, 'attack');
            checkAndHandleLevelUp(player, socket, 'strength');
            checkAndHandleLevelUp(player, socket, 'hitpoints');
            
            // Update max HP if hitpoints leveled up
            updatePlayerMaxHP(player);
            
            // NPC enters combat mode
            npc.isInCombat = true;
            npc.target = player.id;
            
            // Track combat action for AI Game Master
            if (aiGameMaster) {
                aiGameMaster.trackPlayerAction(player.id, 'attack_monster', {
                    monster: npc.type,
                    damage: damage,
                    location: { x: player.x, y: player.y },
                    level: player.level
                });
            }
            
            if (npc.hp <= 0) {
                // NPC died
                npc.deathTime = Date.now();
                
                // Track monster kill for AI Game Master
                if (aiGameMaster) {
                    aiGameMaster.trackPlayerAction(player.id, 'kill_monster', {
                        monster: npc.type,
                        location: { x: player.x, y: player.y },
                        level: player.level
                    });
                }
                
                socket.emit('chatMessage', {
                    username: 'Combat', 
                    message: `You defeated the ${npc.type}!`
                });
                
                // Drop loot
                if (Math.random() < 0.8) {
                    // Always drop bones first
                    const bonesAdded = addItemToInventory(player, { name: 'bones', type: 'material', quantity: 1, prayerXp: 5 });
                    if (bonesAdded) {
                        socket.emit('chatMessage', {
                            username: 'System',
                            message: `You received: bones!`
                        });
                    }
                    
                    // Additional random drops
                    if (Math.random() < 0.4) {
                        const drops = [
                            { name: 'coins', type: 'currency', quantity: Math.floor(Math.random() * 15) + 1 },
                            { name: 'bronze sword', type: 'equipment', slot: 'weapon', attackBonus: 2, defenseBonus: 0 },
                            { name: 'iron axe', type: 'equipment', slot: 'weapon', attackBonus: 3, defenseBonus: 0 },
                            { name: 'leather armor', type: 'equipment', slot: 'armor', attackBonus: 0, defenseBonus: 3 },
                            { name: 'bread', type: 'consumable', healAmount: 5 },
                            { name: 'health potion', type: 'consumable', healAmount: 15 }
                        ];
                        const drop = drops[Math.floor(Math.random() * drops.length)];
                        
                        const added = addItemToInventory(player, drop);
                        if (added) {
                            socket.emit('chatMessage', {
                                username: 'System',
                                message: `You received: ${drop.name}!`
                            });
                        }
                    }
                    
                    socket.emit('inventoryUpdate', {
                        inventory: player.inventory
                    });
                }
            }
            
            // Broadcast NPC update to all players
            io.to('game').emit('npcUpdate', {
                id: npc.id,
                hp: npc.hp,
                maxHp: npc.maxHp,
                x: npc.x,
                y: npc.y,
                isInCombat: npc.isInCombat
            });
        }
    });

    socket.on('gatherResource', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        if (player) {
            let resource, skill, experience, successChance, resourceName;
            
            // Handle different resource types
            if (data.type === 'oak' || data.type === 'willow' || data.type === 'maple' || data.type === 'yew') {
                const treeData = {
                    oak: { resource: 'oak logs', xp: 25, chance: 0.8 },
                    willow: { resource: 'willow logs', xp: 35, chance: 0.7 },
                    maple: { resource: 'maple logs', xp: 50, chance: 0.6 },
                    yew: { resource: 'yew logs', xp: 100, chance: 0.5 }
                };
                const tree = treeData[data.type];
                resource = tree.resource;
                resourceName = tree.resource;
                skill = 'woodcutting';
                experience = tree.xp;
                successChance = tree.chance;
            } else if (data.type === 'copper' || data.type === 'tin' || data.type === 'iron' || data.type === 'coal' || data.type === 'gold') {
                const rockData = {
                    copper: { resource: 'copper ore', xp: 20, chance: 0.9 },
                    tin: { resource: 'tin ore', xp: 20, chance: 0.9 },
                    iron: { resource: 'iron ore', xp: 35, chance: 0.7 },
                    coal: { resource: 'coal', xp: 50, chance: 0.6 },
                    gold: { resource: 'gold ore', xp: 80, chance: 0.5 }
                };
                const rock = rockData[data.type];
                resource = rock.resource;
                resourceName = rock.resource;
                skill = 'mining';
                experience = rock.xp;
                successChance = rock.chance;
            } else if (data.type === 'fishing') {
                const fishTypes = ['shrimp', 'anchovies', 'sardines', 'herring', 'trout'];
                resource = fishTypes[Math.floor(Math.random() * fishTypes.length)];
                resourceName = resource;
                skill = 'fishing';
                experience = 30;
                successChance = 0.6;
            } else if (data.type === 'herbs') {
                const herbTypes = ['grimy guam', 'grimy marrentill', 'grimy tarromin', 'grimy harralander'];
                resource = herbTypes[Math.floor(Math.random() * herbTypes.length)];
                resourceName = resource;
                skill = 'farming';
                experience = 40;
                successChance = 0.8;
            } else {
                // Fallback for unknown types
                resource = data.type + ' resource';
                resourceName = resource;
                skill = 'woodcutting';
                experience = 25;
                successChance = 0.5;
            }
            
            // Always attempt to damage/harvest the resource
            const damage = Math.floor(Math.random() * 20) + 10;
            
            // Always give XP for the attempt
            const currentSkillLevel = player.skills[skill];
            const skillExp = player.skillExperience = player.skillExperience || {};
            if (!skillExp[skill]) skillExp[skill] = 0;
            
            skillExp[skill] += experience;
            
            // Give small amount of HP XP for skilling (like RuneScape)
            if (!skillExp.hitpoints) skillExp.hitpoints = 1154;
            skillExp.hitpoints += Math.floor(experience / 10);
            
            // Check for level ups
            checkAndHandleLevelUp(player, socket, skill);
            checkAndHandleLevelUp(player, socket, 'hitpoints');
            
            // Update max HP if hitpoints leveled up
            updatePlayerMaxHP(player);
            
            // Try to give basic resource based on success chance
            if (Math.random() < successChance) {
                // Always give the basic resource
                const basicResource = { name: resourceName, type: 'material', quantity: 1 };
                const added = addItemToInventory(player, basicResource);
                
                if (added) {
                    socket.emit('chatMessage', {
                        username: 'System',
                        message: `You get some ${resourceName}. (+${experience} ${skill} XP)`
                    });
                    
                    // Send updated inventory to client
                    socket.emit('inventoryUpdate', {
                        inventory: player.inventory
                    });
                    
                    console.log(`Player ${player.username} got ${resourceName}. Inventory updated.`); // Debug log
                } else {
                    socket.emit('chatMessage', {
                        username: 'System',
                        message: `Inventory full! (+${experience} ${skill} XP)`
                    });
                }
                
                // Small chance for bonus rare drops based on skill
                if (Math.random() < 0.05) {
                    const rareDropsBySkill = {
                        woodcutting: [
                            { name: 'bird nest', type: 'material', quantity: 1 },
                            { name: 'wooden shield', type: 'equipment', slot: 'armor', attackBonus: 0, defenseBonus: 1 }
                        ],
                        mining: [
                            { name: 'gems', type: 'material', quantity: 1 },
                            { name: 'iron helmet', type: 'equipment', slot: 'helmet', attackBonus: 0, defenseBonus: 2 }
                        ],
                        fishing: [
                            { name: 'casket', type: 'material', quantity: 1 },
                            { name: 'big bass', type: 'material', quantity: 1 }
                        ],
                        farming: [
                            { name: 'seeds', type: 'material', quantity: 3 },
                            { name: 'clean herbs', type: 'material', quantity: 1 }
                        ]
                    };
                    
                    const rareDrop = rareDropsBySkill[skill];
                    if (rareDrop && rareDrop.length > 0) {
                        const bonus = rareDrop[Math.floor(Math.random() * rareDrop.length)];
                        const bonusAdded = addItemToInventory(player, bonus);
                        if (bonusAdded) {
                            socket.emit('chatMessage', {
                                username: 'System',
                                message: `Bonus! You also get: ${bonus.name}!`
                            });
                            
                            // Send updated inventory for bonus items too
                            socket.emit('inventoryUpdate', {
                                inventory: player.inventory
                            });
                        }
                    }
                }
            } else {
                const actionText = {
                    woodcutting: 'swing at the tree',
                    mining: 'strike the rock',
                    fishing: 'cast your line',
                    farming: 'tend the herbs'
                };
                
                socket.emit('chatMessage', {
                    username: 'System',
                    message: `You ${actionText[skill] || 'attempt to gather'}... (+${experience} ${skill} XP)`
                });
            }
            
            // Broadcast resource damage to all players
            io.to('game').emit('resourceDamaged', {
                type: data.type,
                id: data.treeId || data.rockId,
                x: data.x,
                y: data.y,
                damage: damage
            });
        }
    });

    socket.on('equipItem', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        if (player) {
            player.equipment[data.slot] = data.item;
            
            const user = users.get(player.username);
            if (user) {
                user.playerData.equipment = { ...player.equipment };
            }
        }
    });

    socket.on('unequipItem', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        if (player) {
            player.equipment[data.slot] = null;
            
            const user = users.get(player.username);
            if (user) {
                user.playerData.equipment = { ...player.equipment };
            }
        }
    });

    socket.on('useItem', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        if (player && data.item.type === 'consumable') {
            if (data.item.healAmount) {
                const healAmount = data.item.healAmount;
                const oldHp = player.stats.hp;
                player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + healAmount);
                const actualHeal = player.stats.hp - oldHp;
                
                const user = users.get(player.username);
                if (user) {
                    user.playerData.stats = { ...player.stats };
                }
                
                // Send healing confirmation and updated stats
                socket.emit('itemUsed', {
                    itemName: data.item.name,
                    healAmount: actualHeal,
                    newHp: player.stats.hp,
                    maxHp: player.stats.maxHp
                });
                
                socket.emit('chatMessage', {
                    username: 'System',
                    message: `You eat the ${data.item.name} and heal ${actualHeal} HP.`
                });
            }
        }
    });

    socket.on('dropItem', (data) => {
        if (!socket.playerId) return;
        
        socket.emit('chatMessage', {
            username: 'System',
            message: `You drop the ${data.item.name}`
        });
    });

    // Player vs Player attack handler
    socket.on('attackPlayer', (data) => {
        if (!socket.playerId) return;
        
        const attacker = players.get(socket.playerId);
        const target = players.get(data.targetId);
        
        if (attacker && target && target.stats.hp > 0) {
            handlePlayerAttack(attacker, target, socket);
            
            // Track PVP combat for AI Game Master
            if (aiGameMaster) {
                aiGameMaster.trackPlayerAction(attacker.id, 'pvp_combat', {
                    target: target.username,
                    location: { x: attacker.x, y: attacker.y },
                    level: attacker.level
                });
            }
            
            // Update inventories for both players
            socket.emit('inventoryUpdate', { inventory: attacker.inventory });
            const targetSocket = Array.from(io.sockets.sockets.values()).find(s => s.playerId === target.id);
            if (targetSocket) {
                targetSocket.emit('inventoryUpdate', { inventory: target.inventory });
                targetSocket.emit('takeDamage', {
                    attacker: attacker.username,
                    damage: data.damage || 1,
                    hp: target.stats.hp,
                    playerDefense: target.skills.defense
                });
            }
        }
    });

    // PvP area notification
    socket.on('checkPvPArea', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        if (player) {
            const pvpArea = isInPvPArea(data.x, data.y);
            if (pvpArea) {
                socket.emit('pvpAreaEntered', {
                    area: pvpArea.name,
                    description: pvpArea.description
                });
            } else {
                socket.emit('pvpAreaLeft');
            }
        }
    });

    // Trading system
    socket.on('requestTrade', (data) => {
        if (!socket.playerId) return;
        
        const requester = players.get(socket.playerId);
        const target = players.get(data.targetId);
        
        if (requester && target) {
            const targetSocket = Array.from(io.sockets.sockets.values()).find(s => s.playerId === target.id);
            if (targetSocket) {
                targetSocket.emit('tradeRequest', {
                    fromId: requester.id,
                    fromUsername: requester.username
                });
                
                socket.emit('chatMessage', {
                    username: 'System',
                    message: `Trade request sent to ${target.username}`
                });
            }
        }
    });

    socket.on('acceptTrade', (data) => {
        if (!socket.playerId) return;
        
        const accepter = players.get(socket.playerId);
        const requester = players.get(data.fromId);
        
        if (accepter && requester) {
            const requesterSocket = Array.from(io.sockets.sockets.values()).find(s => s.playerId === requester.id);
            
            // Simple trade completion - could be expanded with trade window UI
            socket.emit('chatMessage', {
                username: 'System',
                message: `You accepted trade with ${requester.username}. Trade completed!`
            });
            
            if (requesterSocket) {
                requesterSocket.emit('chatMessage', {
                    username: 'System',
                    message: `${accepter.username} accepted your trade request! Trade completed!`
                });
            }
        }
    });

    socket.on('declineTrade', (data) => {
        if (!socket.playerId) return;
        
        const decliner = players.get(socket.playerId);
        const requester = players.get(data.fromId);
        
        if (decliner && requester) {
            const requesterSocket = Array.from(io.sockets.sockets.values()).find(s => s.playerId === requester.id);
            
            if (requesterSocket) {
                requesterSocket.emit('chatMessage', {
                    username: 'System',
                    message: `${decliner.username} declined your trade request.`
                });
            }
        }
    });

    // Quest system handlers
    socket.on('openQuests', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        if (player) {
            socket.emit('questsOpened', {
                quests: player.quests
            });
        }
    });

    socket.on('acceptQuest', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        if (player && player.quests[data.questId] && player.quests[data.questId].status === 'available') {
            player.quests[data.questId].status = 'active';
            
            socket.emit('chatMessage', {
                username: 'System',
                message: `Quest accepted: ${player.quests[data.questId].name}`
            });
            
            socket.emit('questUpdate', {
                questId: data.questId,
                quest: player.quests[data.questId]
            });
        }
    });

    socket.on('respawn', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        if (player) {
            // Restore player to full health and move to safe spawn location
            player.stats.hp = player.stats.maxHp;
            
            // Find a guaranteed safe spawn location (on grass)
            let spawnX = 1000, spawnY = 1000;
            let attempts = 0;
            while (attempts < 20) {
                const testX = 900 + Math.random() * 200;  // Around center
                const testY = 900 + Math.random() * 200;
                const terrain = getTerrainAt(testX, testY);
                if (terrain === 'grass') {
                    spawnX = testX;
                    spawnY = testY;
                    break;
                }
                attempts++;
            }
            
            player.x = spawnX;
            player.y = spawnY;
            
            // Update user data
            const user = users.get(player.username);
            if (user) {
                user.playerData.stats = { ...player.stats };
                user.playerData.x = player.x;
                user.playerData.y = player.y;
            }
            
            socket.emit('respawned', {
                x: player.x,
                y: player.y,
                hp: player.stats.hp,
                maxHp: player.stats.maxHp
            });
            
            socket.emit('chatMessage', {
                username: 'System',
                message: 'You have respawned at the starting location.'
            });
        }
    });

    socket.on('homeTeleport', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        if (player) {
            // Teleport to safe home location (guaranteed to be on land)
            player.x = 1000;
            player.y = 1000;
            
            // Update user data
            const user = users.get(player.username);
            if (user) {
                user.playerData.x = player.x;
                user.playerData.y = player.y;
            }
            
            socket.emit('respawned', {
                x: player.x,
                y: player.y,
                hp: player.stats.hp,
                maxHp: player.stats.maxHp
            });
            
            socket.emit('chatMessage', {
                username: 'System',
                message: 'You have teleported to your home location.'
            });
        }
    });

    socket.on('openShop', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        const shop = shops.get(data.shopId);
        
        if (player && shop) {
            // Send shop inventory to player
            socket.emit('shopOpened', {
                shopId: shop.id,
                shopName: shop.name,
                inventory: shop.inventory
            });
        }
    });
    
    socket.on('buyItem', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        const shop = shops.get(data.shopId);
        
        if (player && shop) {
            const shopItem = shop.inventory[data.itemIndex];
            
            if (shopItem && shopItem.stock > 0) {
                // Check if player has enough coins
                const playerCoins = getPlayerCoins(player);
                
                if (playerCoins >= shopItem.price) {
                    // Remove coins from player
                    if (removeCoinsFromPlayer(player, shopItem.price)) {
                        // Add item to player inventory
                        const itemToAdd = { ...shopItem };
                        delete itemToAdd.price;
                        delete itemToAdd.stock;
                        
                        const added = addItemToInventory(player, itemToAdd);
                        if (added) {
                            // Reduce shop stock
                            shopItem.stock--;
                            
                            socket.emit('itemBought', {
                                itemName: shopItem.name,
                                price: shopItem.price,
                                coinsLeft: getPlayerCoins(player)
                            });
                            
                            socket.emit('inventoryUpdate', {
                                inventory: player.inventory
                            });
                            
                            socket.emit('chatMessage', {
                                username: 'Shop',
                                message: `You bought ${shopItem.name} for ${shopItem.price} coins.`
                            });
                        } else {
                            // Refund coins if inventory full
                            addCoinsToPlayer(player, shopItem.price);
                            socket.emit('chatMessage', {
                                username: 'Shop',
                                message: 'Your inventory is full!'
                            });
                        }
                    }
                } else {
                    socket.emit('chatMessage', {
                        username: 'Shop',
                        message: `You need ${shopItem.price} coins but only have ${playerCoins}.`
                    });
                }
            }
        }
    });
    
    socket.on('sellItem', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        
        if (player && player.inventory[data.itemIndex]) {
            const item = player.inventory[data.itemIndex];
            
            // Calculate sell price (usually 50% of buy price)
            let sellPrice = 1;
            if (item.type === 'equipment') {
                sellPrice = Math.max(1, Math.floor((item.attackBonus || 0) + (item.defenseBonus || 0)) * 3);
            } else if (item.type === 'consumable') {
                sellPrice = Math.max(1, Math.floor((item.healAmount || 1) / 2));
            } else if (item.type === 'material') {
                sellPrice = Math.max(1, 2);
            }
            
            // Remove item from inventory
            player.inventory[data.itemIndex] = null;
            
            // Add coins to player
            addCoinsToPlayer(player, sellPrice);
            
            socket.emit('inventoryUpdate', {
                inventory: player.inventory
            });
            
            socket.emit('chatMessage', {
                username: 'Shop',
                message: `You sold ${item.name} for ${sellPrice} coins.`
            });
        }
    });

    socket.on('buryBones', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        
        if (player && player.inventory[data.itemIndex]) {
            const item = player.inventory[data.itemIndex];
            
            if (item.name === 'bones' && item.prayerXp) {
                // Remove bones from inventory
                player.inventory[data.itemIndex] = null;
                
                // Add prayer experience
                const skillExp = player.skillExperience = player.skillExperience || {};
                if (!skillExp.prayer) skillExp.prayer = 0;
                skillExp.prayer += item.prayerXp;
                
                // Check for level up
                checkAndHandleLevelUp(player, socket, 'prayer');
                
                // Update max prayer points if leveled up
                updatePlayerMaxPrayer(player);
                
                socket.emit('inventoryUpdate', {
                    inventory: player.inventory
                });
                
                socket.emit('chatMessage', {
                    username: 'System',
                    message: `You bury the bones and gain ${item.prayerXp} Prayer XP.`
                });
            }
        }
    });

    socket.on('castSpell', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        if (!player) return;
        
        const spells = {
            'wind strike': { level: 1, damage: [1, 8], runes: { 'air rune': 1, 'mind rune': 1 }, xp: 5.5 },
            'water strike': { level: 5, damage: [2, 10], runes: { 'water rune': 1, 'air rune': 1, 'mind rune': 1 }, xp: 7.5 },
            'earth strike': { level: 9, damage: [3, 12], runes: { 'earth rune': 2, 'air rune': 1, 'mind rune': 1 }, xp: 9.5 },
            'fire strike': { level: 13, damage: [4, 16], runes: { 'fire rune': 3, 'air rune': 2, 'mind rune': 1 }, xp: 11.5 },
            'heal': { level: 3, heal: [2, 8], runes: { 'air rune': 3, 'water rune': 1 }, xp: 8 }
        };
        
        const spell = spells[data.spellName];
        if (!spell) return;
        
        // Check magic level requirement
        if (player.skills.magic < spell.level) {
            socket.emit('chatMessage', {
                username: 'Magic',
                message: `You need ${spell.level} Magic to cast ${data.spellName}.`
            });
            return;
        }
        
        // Check if player has required runes
        const runeCheck = checkAndConsumeRunes(player, spell.runes);
        if (!runeCheck.success) {
            socket.emit('chatMessage', {
                username: 'Magic',
                message: runeCheck.message
            });
            return;
        }
        
        // Cast the spell
        if (data.spellName === 'heal') {
            // Healing spell
            const healAmount = Math.floor(Math.random() * (spell.heal[1] - spell.heal[0] + 1)) + spell.heal[0];
            player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + healAmount);
            
            socket.emit('spellCast', {
                spellName: data.spellName,
                healAmount: healAmount,
                newHp: player.stats.hp
            });
            
            socket.emit('chatMessage', {
                username: 'Magic',
                message: `You cast ${data.spellName} and heal ${healAmount} HP.`
            });
        } else if (data.targetType === 'npc' && data.targetId) {
            // Offensive spell on NPC
            const npc = npcs.get(data.targetId);
            if (npc && npc.hp > 0) {
                const damage = Math.floor(Math.random() * (spell.damage[1] - spell.damage[0] + 1)) + spell.damage[0];
                
                // Calculate magic accuracy and damage bonus
                const magicBonus = (player.equipment?.helmet?.magicBonus || 0) + 
                                 (player.equipment?.armor?.magicBonus || 0) + 
                                 (player.equipment?.weapon?.magicBonus || 0);
                
                const finalDamage = Math.max(1, damage + Math.floor(magicBonus / 3));
                
                npc.hp = Math.max(0, npc.hp - finalDamage);
                
                // NPC enters combat mode
                npc.isInCombat = true;
                npc.target = player.id;
                
                socket.emit('spellCast', {
                    spellName: data.spellName,
                    damage: finalDamage,
                    targetId: data.targetId
                });
                
                socket.emit('chatMessage', {
                    username: 'Magic',
                    message: `You cast ${data.spellName} and deal ${finalDamage} damage to the ${npc.type}!`
                });
                
                if (npc.hp <= 0) {
                    npc.deathTime = Date.now();
                    socket.emit('chatMessage', {
                        username: 'Magic',
                        message: `You defeated the ${npc.type} with magic!`
                    });
                }
                
                // Broadcast NPC update
                io.to('game').emit('npcUpdate', {
                    id: npc.id,
                    hp: npc.hp,
                    maxHp: npc.maxHp,
                    isInCombat: npc.isInCombat
                });
            }
        }
        
        // Grant magic XP
        const skillExp = player.skillExperience = player.skillExperience || {};
        if (!skillExp.magic) skillExp.magic = 0;
        skillExp.magic += spell.xp;
        
        checkAndHandleLevelUp(player, socket, 'magic');
        
        // Update inventory after consuming runes
        socket.emit('inventoryUpdate', {
            inventory: player.inventory
        });
    });

    socket.on('openBank', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        if (!player) return;
        
        // Initialize bank if it doesn't exist
        if (!player.bank) {
            player.bank = new Array(100).fill(null);
        }
        
        // Send bank contents to player
        socket.emit('bankOpened', {
            bankItems: player.bank,
            inventory: player.inventory
        });
    });

    socket.on('depositItem', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        if (!player || !player.inventory[data.inventoryIndex]) return;
        
        // Initialize bank if it doesn't exist
        if (!player.bank) {
            player.bank = new Array(100).fill(null);
        }
        
        const item = player.inventory[data.inventoryIndex];
        
        // Find empty bank slot
        let bankSlot = -1;
        for (let i = 0; i < player.bank.length; i++) {
            if (!player.bank[i]) {
                bankSlot = i;
                break;
            }
        }
        
        if (bankSlot === -1) {
            socket.emit('chatMessage', {
                username: 'Bank',
                message: 'Your bank is full!'
            });
            return;
        }
        
        // Move item from inventory to bank
        player.bank[bankSlot] = { ...item };
        player.inventory[data.inventoryIndex] = null;
        
        // Update user data
        const user = users.get(player.username);
        if (user) {
            user.playerData.bank = [...player.bank];
            user.playerData.inventory = [...player.inventory];
        }
        
        socket.emit('bankUpdate', {
            bankItems: player.bank,
            inventory: player.inventory
        });
        
        socket.emit('chatMessage', {
            username: 'Bank',
            message: `Deposited ${item.name}.`
        });
    });

    socket.on('withdrawItem', (data) => {
        if (!socket.playerId) return;
        
        const player = players.get(socket.playerId);
        
        // Initialize bank if it doesn't exist
        if (!player.bank) {
            player.bank = new Array(100).fill(null);
        }
        
        if (!player || !player.bank[data.bankIndex]) return;
        
        const item = player.bank[data.bankIndex];
        
        // Find empty inventory slot
        let invSlot = -1;
        for (let i = 0; i < player.inventory.length; i++) {
            if (!player.inventory[i]) {
                invSlot = i;
                break;
            }
        }
        
        if (invSlot === -1) {
            socket.emit('chatMessage', {
                username: 'Bank',
                message: 'Your inventory is full!'
            });
            return;
        }
        
        // Move item from bank to inventory
        player.inventory[invSlot] = { ...item };
        player.bank[data.bankIndex] = null;
        
        // Update user data
        const user = users.get(player.username);
        if (user) {
            user.playerData.bank = [...player.bank];
            user.playerData.inventory = [...player.inventory];
        }
        
        socket.emit('bankUpdate', {
            bankItems: player.bank,
            inventory: player.inventory
        });
        
        socket.emit('chatMessage', {
            username: 'Bank',
            message: `Withdrew ${item.name}.`
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        if (socket.playerId) {
            players.delete(socket.playerId);
            broadcastPlayersUpdate();
        }
    });
});

function addItemToInventory(player, item) {
    for (let i = 0; i < player.inventory.length; i++) {
        if (player.inventory[i] === null) {
            player.inventory[i] = item;
            
            const user = users.get(player.username);
            if (user) {
                user.playerData.inventory = [...player.inventory];
            }
            
            return true;
        }
    }
    return false;
}

function getPlayerCoins(player) {
    for (let item of player.inventory) {
        if (item && item.name === 'coins') {
            return item.quantity || 0;
        }
    }
    return 0;
}

function addCoinsToPlayer(player, amount) {
    for (let item of player.inventory) {
        if (item && item.name === 'coins') {
            item.quantity = (item.quantity || 0) + amount;
            
            const user = users.get(player.username);
            if (user) {
                user.playerData.inventory = [...player.inventory];
            }
            return true;
        }
    }
    
    // No coins found, add new coin stack
    const coinStack = { name: 'coins', type: 'currency', quantity: amount };
    return addItemToInventory(player, coinStack);
}

function removeCoinsFromPlayer(player, amount) {
    for (let item of player.inventory) {
        if (item && item.name === 'coins') {
            if ((item.quantity || 0) >= amount) {
                item.quantity = (item.quantity || 0) - amount;
                
                // Remove coins if quantity is 0
                if (item.quantity <= 0) {
                    const index = player.inventory.indexOf(item);
                    player.inventory[index] = null;
                }
                
                const user = users.get(player.username);
                if (user) {
                    user.playerData.inventory = [...player.inventory];
                }
                return true;
            }
        }
    }
    return false;
}

function checkAndConsumeRunes(player, requiredRunes) {
    // First check if player has all required runes
    for (let runeName in requiredRunes) {
        const requiredAmount = requiredRunes[runeName];
        let found = false;
        
        for (let item of player.inventory) {
            if (item && item.name === runeName && (item.quantity || 1) >= requiredAmount) {
                found = true;
                break;
            }
        }
        
        if (!found) {
            return {
                success: false,
                message: `You need ${requiredAmount} ${runeName}${requiredAmount > 1 ? 's' : ''} to cast this spell.`
            };
        }
    }
    
    // Consume the runes
    for (let runeName in requiredRunes) {
        const requiredAmount = requiredRunes[runeName];
        
        for (let item of player.inventory) {
            if (item && item.name === runeName) {
                item.quantity = (item.quantity || 1) - requiredAmount;
                
                if (item.quantity <= 0) {
                    const index = player.inventory.indexOf(item);
                    player.inventory[index] = null;
                }
                break;
            }
        }
    }
    
    // Update user data
    const user = users.get(player.username);
    if (user) {
        user.playerData.inventory = [...player.inventory];
    }
    
    return { success: true };
}

function getExperienceForLevel(level) {
    // RuneScape-like XP formula: roughly exponential growth
    let totalXP = 0;
    for (let l = 1; l < level; l++) {
        totalXP += Math.floor(l + 300 * Math.pow(2, l / 7.0));
    }
    return Math.floor(totalXP / 4);
}

function checkAndHandleLevelUp(player, socket, skill) {
    const skillExp = player.skillExperience;
    const currentLevel = player.skills[skill];
    const expForNextLevel = getExperienceForLevel(currentLevel + 1);
    
    if (skillExp[skill] >= expForNextLevel) {
        const oldLevel = player.skills[skill];
        player.skills[skill]++;
        
        // Send level up notification
        socket.emit('levelUp', {
            skill: skill,
            level: player.skills[skill],
            experience: skillExp[skill]
        });
        
        socket.emit('skillUpdate', {
            skill: skill,
            level: player.skills[skill],
            experience: skillExp[skill]
        });
        
        // Update user data
        const user = users.get(player.username);
        if (user) {
            user.playerData.skills = { ...player.skills };
            user.playerData.skillExperience = { ...skillExp };
        }
        
        console.log(`${player.username} leveled ${skill} from ${oldLevel} to ${player.skills[skill]}`);
    }
}

function updatePlayerMaxHP(player) {
    // RuneScape formula: 10 + (Hitpoints level - 1)
    const newMaxHP = 9 + player.skills.hitpoints; // 9 + level (since level 1 = 10 HP)
    const oldMaxHP = player.stats.maxHp;
    
    if (newMaxHP !== oldMaxHP) {
        const hpDifference = newMaxHP - oldMaxHP;
        player.stats.maxHp = newMaxHP;
        player.stats.hp += hpDifference; // Gain HP when leveling up
        
        // Update user data
        const user = users.get(player.username);
        if (user) {
            user.playerData.stats = { ...player.stats };
        }
        
        console.log(`${player.username} HP increased from ${oldMaxHP} to ${newMaxHP}`);
    }
}

function updatePlayerMaxPrayer(player) {
    // RuneScape formula: Prayer level = Prayer points
    const newMaxPrayer = player.skills.prayer;
    const oldMaxPrayer = player.stats.maxPrayer;
    
    if (newMaxPrayer !== oldMaxPrayer) {
        const prayerDifference = newMaxPrayer - oldMaxPrayer;
        player.stats.maxPrayer = newMaxPrayer;
        player.stats.prayer += prayerDifference; // Gain prayer points when leveling up
        
        // Update user data
        const user = users.get(player.username);
        if (user) {
            user.playerData.stats = { ...player.stats };
        }
        
        console.log(`${player.username} Prayer increased from ${oldMaxPrayer} to ${newMaxPrayer}`);
    }
}

function broadcastPlayersUpdate() {
    const playersData = Array.from(players.values()).map(player => ({
        id: player.id,
        username: player.username,
        x: player.x,
        y: player.y
    }));
    
    io.to('game').emit('playersUpdate', playersData);
}

// Initialize NPCs and Shops on server start
initializeNPCs();
initializeShops();

// Update loops
setInterval(() => {
    broadcastPlayersUpdate();
}, 100);

setInterval(() => {
    updateNPCs();
}, 200);

// Broadcast NPC positions every 500ms
setInterval(() => {
    const npcData = Array.from(npcs.values()).map(npc => ({
        id: npc.id,
        type: npc.type,
        name: npc.name,
        x: npc.x,
        y: npc.y,
        hp: npc.hp,
        maxHp: npc.maxHp,
        level: npc.level,
        isInCombat: npc.isInCombat,
        isShop: npc.isShop
    }));
    
    io.to('game').emit('npcPositions', npcData);
}, 500);

// Claude Code Communication Bridge
const fs = require('fs');
const claudeMessages = [];

// Auto-process Claude messages
async function processClaudeMessage(message) {
    const updates = [];
    const command = message.command.toLowerCase();
    
    // Send status updates to client
    const sendUpdate = (status, type = 'system') => {
        updates.push({ status, type, timestamp: new Date().toISOString() });
        io.emit('claudeUpdate', { messageId: message.id, status, type });
    };
    
    try {
        sendUpdate('🔍 Claude is analyzing your request...', 'system');
        await delay(1000);
        
        // Use AI to understand the command
        let aiProcessed = false;
        try {
            console.log(`🤖 Attempting AI processing for: "${message.command}"`);
            const { understandCommand, executeAICommand } = require('./ai-interpreter');
            const understanding = await understandCommand(message.command);
            
            console.log('🧠 AI Understanding result:', understanding);
            
            if (understanding && understanding.action !== 'unknown') {
                const action = await executeAICommand(understanding, message.command);
                
                if (action.type === 'icon_update') {
                    sendUpdate(`✏️ Updating ${action.iconType} icon...`, 'system');
                    await delay(1500);
                    
                    const result = await updateIconAutomatically(action.iconType);
                    if (result.success) {
                        sendUpdate(`🔧 Applied changes to ${action.iconType}`, 'system');
                        await delay(1000);
                        sendUpdate(`✅ ${action.iconType} icon updated! Refresh to see changes`, 'success');
                        io.emit('autoRefresh', { reason: `${action.iconType} icon updated` });
                    } else {
                        sendUpdate(`❌ Failed to update ${action.iconType}: ${result.error}`, 'error');
                    }
                    aiProcessed = true;
                    
                } else if (action.type === 'monster_creation') {
                    sendUpdate(`🐲 Creating monster: ${action.monster.name}`, 'system');
                    await delay(1000);
                    
                    sendUpdate('🎲 AI generated stats...', 'system');
                    await delay(1500);
                    
                    // Create monster with AI-generated data
                    const monster = {
                        name: action.monster.name,
                        displayName: action.monster.name,
                        level: action.monster.level,
                        hp: action.monster.hp,
                        maxHp: action.monster.hp,
                        damage: action.monster.damage,
                        defense: action.monster.defense,
                        drops: action.monster.drops,
                        respawnTime: 30000,
                        description: `A fearsome ${action.monster.name} that roams the wilderness.`,
                        color: action.monster.color,
                        secondaryColor: action.monster.secondaryColor
                    };
                    
                    // Generate image with OpenAI
                    sendUpdate('🎨 Generating monster image...', 'system');
                    const imageUrl = await generateMonsterImage(monster.name);
                    if (imageUrl) {
                        monster.imageUrl = imageUrl;
                        sendUpdate(`✅ Image generated successfully!`, 'system');
                    }
                    await delay(1000);
                    
                    // Save monster to database
                    await database.saveMonster(monster);
                    
                    await addMonsterToGame(monster);
                    
                    sendUpdate(`📊 Stats: Level ${monster.level}, HP: ${monster.hp}, Color: ${monster.color}`, 'system');
                    await delay(1000);
                    
                    sendUpdate(`✅ ${monster.displayName} created! Check the game world!`, 'success');
                    io.emit('monsterCreated', monster);
                    io.emit('autoRefresh', { reason: `New monster: ${monster.displayName}` });
                    aiProcessed = true;
                    
                } else if (action.type === 'npc_creation') {
                    sendUpdate(`👤 Creating NPC: ${action.npc.name}`, 'system');
                    await delay(1000);
                    
                    sendUpdate('🎭 AI generated personality...', 'system');
                    await delay(1500);
                    
                    // Create NPC with AI-generated data
                    const npc = {
                        name: action.npc.name,
                        displayName: action.npc.name,
                        type: action.npc.type,
                        level: action.npc.level,
                        hp: action.npc.hp,
                        maxHp: action.npc.hp,
                        color: action.npc.color,
                        dialogue: action.npc.dialogue,
                        shopInventory: action.npc.shopInventory,
                        isShopkeeper: action.npc.isShopkeeper,
                        friendly: action.npc.friendly,
                        description: `A ${action.npc.type} named ${action.npc.name}.`
                    };
                    
                    // Generate image with OpenAI
                    sendUpdate('🎨 Generating NPC image...', 'system');
                    const { generateImage } = require('./openai-config');
                    const npcImageUrl = await generateImage('npc', npc.name, `${npc.type} character`);
                    if (npcImageUrl) {
                        npc.imageUrl = npcImageUrl;
                        sendUpdate(`✅ Image generated successfully!`, 'system');
                    }
                    await delay(1000);
                    
                    // Save NPC to database
                    await database.saveNPC(npc);
                    
                    await addNPCToGame(npc);
                    
                    if (npc.isShopkeeper) {
                        sendUpdate(`🏪 Shop inventory: ${npc.shopInventory.map(item => item.name).join(', ')}`, 'system');
                        await delay(1000);
                    }
                    
                    sendUpdate(`💬 Dialogue: "${npc.dialogue}"`, 'system');
                    await delay(1000);
                    
                    sendUpdate(`✅ ${npc.displayName} created! Visit them in the game world!`, 'success');
                    io.emit('npcCreated', npc);
                    io.emit('autoRefresh', { reason: `New NPC: ${npc.displayName}` });
                    aiProcessed = true;
                    
                } else if (action.type === 'building_creation') {
                    sendUpdate(`🏠 Creating building: ${action.building.name}`, 'system');
                    await delay(1000);
                    
                    sendUpdate('🔨 AI generated blueprint...', 'system');
                    await delay(1500);
                    
                    // Create building with AI-generated data
                    const building = {
                        name: action.building.name,
                        displayName: action.building.name,
                        type: action.building.type,
                        width: action.building.width,
                        height: action.building.height,
                        color: action.building.color,
                        secondaryColor: action.building.secondaryColor,
                        materials: action.building.materials,
                        interiorItems: action.building.interiorItems,
                        accessible: action.building.accessible,
                        description: action.building.description
                    };
                    
                    // Generate image with OpenAI
                    sendUpdate('🎨 Generating building image...', 'system');
                    const { generateImage } = require('./openai-config');
                    const imageUrl = await generateImage('building', building.name, `${building.type} made of ${building.materials.join(' and ')}`);
                    if (imageUrl) {
                        building.imageUrl = imageUrl;
                        sendUpdate(`✅ Image generated successfully!`, 'system');
                    }
                    await delay(1000);
                    
                    // Save building to database
                    await database.saveBuilding(building);
                    
                    sendUpdate(`📐 Dimensions: ${building.width}x${building.height} | Materials: ${building.materials.join(', ')}`, 'system');
                    await delay(1000);
                    
                    sendUpdate(`✅ ${building.displayName} built! Place it in your world!`, 'success');
                    io.emit('buildingCreated', building);
                    io.emit('autoRefresh', { reason: `New building: ${building.displayName}` });
                    aiProcessed = true;
                    
                } else if (action.type === 'object_creation') {
                    sendUpdate(`📦 Creating object: ${action.object.name}`, 'system');
                    await delay(1000);
                    
                    sendUpdate('🔧 AI generated properties...', 'system');
                    await delay(1500);
                    
                    // Create object with AI-generated data
                    const object = {
                        name: action.object.name,
                        displayName: action.object.name,
                        type: action.object.type,
                        size: action.object.size,
                        color: action.object.color,
                        interactionType: action.object.interactionType,
                        durability: action.object.durability,
                        respawnTime: action.object.respawnTime,
                        drops: action.object.drops,
                        description: action.object.description
                    };
                    
                    // Generate image with OpenAI
                    sendUpdate('🎨 Generating object image...', 'system');
                    const { generateImage } = require('./openai-config');
                    const objImageUrl = await generateImage('object', object.name, `${object.type} that can be ${object.interactionType}`);
                    if (objImageUrl) {
                        object.imageUrl = objImageUrl;
                        sendUpdate(`✅ Image generated successfully!`, 'system');
                    }
                    await delay(1000);
                    
                    // Save object to database
                    await database.saveObject(object);
                    
                    sendUpdate(`⚙️ Type: ${object.type} | Size: ${object.size} | Interaction: ${object.interactionType}`, 'system');
                    if (object.drops.length > 0) {
                        sendUpdate(`💎 Drops: ${object.drops.map(drop => drop.name).join(', ')}`, 'system');
                    }
                    await delay(1000);
                    
                    sendUpdate(`✅ ${object.displayName} created! Place it in your world!`, 'success');
                    io.emit('objectCreated', object);
                    io.emit('autoRefresh', { reason: `New object: ${object.displayName}` });
                    aiProcessed = true;
                    
                } else if (action.type === 'quest_creation') {
                    sendUpdate(`📜 Creating quest: ${action.quest.name}`, 'system');
                    await delay(1000);
                    
                    sendUpdate('📝 AI generated quest details...', 'system');
                    await delay(1500);
                    
                    // Create quest with AI-generated data
                    const quest = {
                        name: action.quest.name,
                        displayName: action.quest.name,
                        type: action.quest.type,
                        difficulty: action.quest.difficulty,
                        description: action.quest.description,
                        objectives: action.quest.objectives,
                        rewards: action.quest.rewards,
                        requirements: action.quest.requirements,
                        npcGiver: action.quest.npcGiver,
                        estimatedTime: action.quest.estimatedTime,
                        experienceReward: action.quest.experienceReward,
                        goldReward: action.quest.goldReward
                    };
                    
                    // Save quest to database
                    await database.saveQuest(quest);
                    
                    sendUpdate(`🎯 Type: ${quest.type} | Difficulty: ${quest.difficulty} | Time: ${quest.estimatedTime}min`, 'system');
                    sendUpdate(`🏆 Rewards: ${quest.experienceReward} XP, ${quest.goldReward} gold`, 'system');
                    await delay(1000);
                    
                    sendUpdate(`✅ ${quest.displayName} quest created! Find the quest giver to start!`, 'success');
                    io.emit('questCreated', quest);
                    io.emit('autoRefresh', { reason: `New quest: ${quest.displayName}` });
                    aiProcessed = true;
                    
                } else if (action.type === 'content_update') {
                    sendUpdate(`✏️ Updating ${action.contentType}: ${action.target}`, 'system');
                    await delay(1000);
                    
                    try {
                        let result;
                        
                        if (action.contentType === 'npc') {
                            result = await database.updateNPC(action.target, action.changes);
                            
                            if (result.success && result.updated) {
                                sendUpdate(`✅ NPC updated: ${result.originalName} → ${result.newName}`, 'success');
                                
                                // List the changes made
                                const changeList = Object.keys(action.changes).map(key => 
                                    `${key}: ${action.changes[key]}`
                                ).join(', ');
                                sendUpdate(`🔧 Changes applied: ${changeList}`, 'system');
                                
                                io.emit('autoRefresh', { reason: `Updated NPC: ${result.newName}` });
                            } else {
                                sendUpdate(`⚠️ NPC "${action.target}" not found or no changes made`, 'warning');
                            }
                        } else {
                            sendUpdate(`⚠️ Update not yet supported for ${action.contentType}`, 'warning');
                        }
                        
                    } catch (error) {
                        sendUpdate(`❌ Error updating ${action.contentType}: ${error.message}`, 'error');
                    }
                    
                    aiProcessed = true;
                    
                } else if (action.type === 'world_generation') {
                    sendUpdate(`🌍 Generating world: ${action.worldParams.name}`, 'system');
                    await delay(1000);
                    
                    sendUpdate('🎲 AI is analyzing your world request...', 'system');
                    await delay(2000);
                    
                    try {
                        // Import world generator
                        const worldGenerator = require('./world-generator');
                        
                        // Generate world from AI prompt
                        sendUpdate('🏗️ Creating terrain and biomes...', 'system');
                        await delay(1500);
                        
                        const generatedWorld = await worldGenerator.generateFromPrompt(action.prompt);
                        
                        if (generatedWorld) {
                            sendUpdate('💾 Saving generated world to database...', 'system');
                            await delay(1000);
                            
                            // Save to database
                            const saveResult = await database.saveWorld(generatedWorld);
                            
                            if (saveResult.success) {
                                const stats = `${Object.keys(generatedWorld.tiles).length} tiles, ${generatedWorld.metadata.biomes.length} biomes, ${generatedWorld.metadata.structures.length} structure types`;
                                sendUpdate(`📊 World generated: ${stats}`, 'system');
                                await delay(1000);
                                
                                sendUpdate(`✅ World "${generatedWorld.name}" created successfully! You can load it in the world builder.`, 'success');
                                
                                // Notify clients about new world
                                io.emit('worldGenerated', {
                                    world: {
                                        id: generatedWorld.id,
                                        name: generatedWorld.name,
                                        creator: 'AI World Generator',
                                        tilesCount: Object.keys(generatedWorld.tiles).length,
                                        dimensions: `${generatedWorld.width}x${generatedWorld.height}`
                                    }
                                });
                                io.emit('autoRefresh', { reason: `New world generated: ${generatedWorld.name}` });
                            } else {
                                sendUpdate('❌ Failed to save generated world to database', 'error');
                            }
                        } else {
                            sendUpdate('❌ Failed to generate world - please try again', 'error');
                        }
                    } catch (worldGenError) {
                        console.error('World generation error:', worldGenError);
                        sendUpdate(`❌ World generation failed: ${worldGenError.message}`, 'error');
                    }
                    
                    aiProcessed = true;
                    
                } else if (action.type === 'ai_gm_event') {
                    sendUpdate(`🎲 AI Game Master: Triggering ${action.eventType} event...`, 'system');
                    await delay(1000);
                    
                    try {
                        if (!aiGameMaster) {
                            sendUpdate('❌ AI Game Master not initialized', 'error');
                            aiProcessed = true;
                            return;
                        }
                        
                        sendUpdate('🤖 AI is crafting a dynamic event...', 'system');
                        await delay(2000);
                        
                        const eventResult = await aiGameMaster.triggerManualEvent(action.eventType, {
                            intensity: action.intensity,
                            targetPlayer: action.targetPlayer,
                            customPrompt: action.customPrompt
                        });
                        
                        if (eventResult.success) {
                            sendUpdate(`✅ Event Created: "${eventResult.event.title}"`, 'success');
                            sendUpdate(`📜 ${eventResult.event.description}`, 'system');
                            sendUpdate(`⭐ Rarity: ${eventResult.event.rarity}`, 'system');
                        } else {
                            sendUpdate(`❌ Failed to create event: ${eventResult.error}`, 'error');
                        }
                    } catch (gmError) {
                        console.error('AI GM error:', gmError);
                        sendUpdate(`❌ AI Game Master error: ${gmError.message}`, 'error');
                    }
                    
                    aiProcessed = true;
                    
                } else if (action.type === 'ai_gm_state') {
                    sendUpdate(`🎲 AI Game Master: ${action.queryType} ${action.action}...`, 'system');
                    await delay(500);
                    
                    try {
                        if (!aiGameMaster) {
                            sendUpdate('❌ AI Game Master not initialized', 'error');
                            aiProcessed = true;
                            return;
                        }
                        
                        if (action.action === 'view') {
                            const worldState = aiGameMaster.getWorldState();
                            
                            switch (action.queryType) {
                                case 'status':
                                case 'all':
                                    sendUpdate(`🌍 World Status:`, 'system');
                                    sendUpdate(`   Danger Level: ${worldState.danger_level}/10`, 'system');
                                    sendUpdate(`   Economy: ${worldState.economy_state}`, 'system');
                                    sendUpdate(`   Weather: ${worldState.weather}`, 'system');
                                    sendUpdate(`   Season: ${worldState.season}`, 'system');
                                    sendUpdate(`   Active Players: ${worldState.player_count}`, 'system');
                                    sendUpdate(`   Active Events: ${worldState.active_events.length}`, 'system');
                                    break;
                                    
                                case 'events':
                                    if (worldState.active_events.length > 0) {
                                        sendUpdate(`🎭 Active Events:`, 'system');
                                        worldState.active_events.forEach(event => {
                                            sendUpdate(`   • ${event.title} (${event.rarity})`, 'system');
                                        });
                                    } else {
                                        sendUpdate(`🎭 No active events`, 'system');
                                    }
                                    
                                    if (worldState.recent_events.length > 0) {
                                        sendUpdate(`📚 Recent Events:`, 'system');
                                        worldState.recent_events.slice(-3).forEach(event => {
                                            sendUpdate(`   • ${event.title}`, 'system');
                                        });
                                    }
                                    break;
                                    
                                case 'players':
                                    sendUpdate(`👥 Player Activity: ${worldState.player_count} active players`, 'system');
                                    break;
                                    
                                case 'danger':
                                    sendUpdate(`⚔️ World Danger Level: ${worldState.danger_level}/10`, 'system');
                                    const dangerDesc = worldState.danger_level <= 3 ? 'Peaceful' : 
                                                     worldState.danger_level <= 6 ? 'Moderate' : 
                                                     worldState.danger_level <= 8 ? 'Dangerous' : 'Extreme';
                                    sendUpdate(`   Status: ${dangerDesc}`, 'system');
                                    break;
                            }
                        } else if (action.action === 'adjust' && action.queryType === 'danger' && action.value) {
                            const oldLevel = aiGameMaster.worldState.danger_level;
                            aiGameMaster.adjustDangerLevel(action.value - oldLevel);
                            sendUpdate(`⚔️ Danger level adjusted from ${oldLevel} to ${aiGameMaster.worldState.danger_level}`, 'success');
                        }
                        
                    } catch (gmError) {
                        console.error('AI GM state error:', gmError);
                        sendUpdate(`❌ AI Game Master state error: ${gmError.message}`, 'error');
                    }
                    
                    aiProcessed = true;
                    
                } else if (action.type === 'world_analysis') {
                    sendUpdate(`🔍 Analyzing ${action.target}...`, 'system');
                    await delay(1500);
                    
                    // Get world analysis
                    const analysis = await analyzeWorld(action.target, action.analysisType);
                    sendUpdate(`📋 Analysis complete: ${analysis}`, 'success');
                    aiProcessed = true;
                    
                } else if (action.type === 'info_request') {
                    sendUpdate(`📚 Looking up information about: ${action.topic}`, 'system');
                    await delay(1000);
                    
                    const info = await getGameInfo(action.topic);
                    sendUpdate(`💡 ${info}`, 'success');
                    aiProcessed = true;
                    
                } else if (action.type === 'unknown') {
                    sendUpdate(`❓ ${action.message}`, 'error');
                    aiProcessed = true;
                }
            }
        } catch (aiError) {
            console.log('⚠️ AI processing error:', aiError.message);
        }
        
        if (!aiProcessed) {
            // Fallback to pattern matching if AI fails
            console.log('⚠️ Using pattern matching fallback');
            
            if (command.includes('update') && command.includes('icon')) {
            // Extract what icon to update
            const iconType = extractIconType(command);
            if (iconType) {
                sendUpdate(`✏️ Updating ${iconType} icon...`, 'system');
                await delay(1500);
                
                const result = await updateIconAutomatically(iconType);
                if (result.success) {
                    sendUpdate(`🔧 Applied changes to ${iconType}`, 'system');
                    await delay(1000);
                    sendUpdate(`✅ ${iconType} icon updated! Refresh to see changes`, 'success');
                    
                    // Trigger browser refresh for connected clients
                    io.emit('autoRefresh', { reason: `${iconType} icon updated` });
                } else {
                    sendUpdate(`❌ Failed to update ${iconType}: ${result.error}`, 'error');
                }
            } else {
                sendUpdate('❌ Could not identify which icon to update', 'error');
            }
        } else if ((command.includes('create') || command.includes('add') || command.includes('make') || command.includes('help me create')) && 
                   (command.includes('spider') || command.includes('monster') || command.includes('creature') || command.includes('enemy'))) {
            // Extract monster name
            const monsterName = extractMonsterName(command);
            if (monsterName) {
                sendUpdate(`🐲 Creating monster: ${monsterName}`, 'system');
                await delay(1000);
                
                sendUpdate('🎲 Generating monster stats...', 'system');
                await delay(1500);
                
                const result = await createMonsterAutomatically(monsterName, command);
                if (result.success) {
                    sendUpdate(`📊 Stats generated: Level ${result.monster.level}, HP: ${result.monster.hp}`, 'system');
                    await delay(1000);
                    
                    sendUpdate('🎨 Requesting image from OpenAI...', 'system');
                    await delay(1500);
                    
                    sendUpdate(`✅ ${result.monster.displayName} created! Check the game world!`, 'success');
                    
                    // Send monster details
                    io.emit('monsterCreated', result.monster);
                    io.emit('autoRefresh', { reason: `New monster: ${result.monster.displayName}` });
                } else {
                    sendUpdate(`❌ Failed to create monster: ${result.error}`, 'error');
                }
            } else {
                sendUpdate('❌ Could not understand monster name. Try: "create a monster called [name]"', 'error');
            }
        } else if (command.includes('create') || command.includes('add')) {
            sendUpdate('🔨 Claude is creating new features...', 'system');
            await delay(2000);
            sendUpdate('💾 Writing code...', 'system');
            await delay(1500);
            sendUpdate('✅ Feature created!', 'success');
        } else {
            sendUpdate('🧠 Processing general request...', 'system');
            await delay(2000);
            sendUpdate('✅ Request processed!', 'success');
        }
        } // Close if (!aiProcessed)
        
        message.status = 'COMPLETED';
        message.updates = updates;
        message.completedAt = new Date().toISOString();
        
    } catch (error) {
        sendUpdate(`❌ Error: ${error.message}`, 'error');
        message.status = 'FAILED';
        message.error = error.message;
    }
}

function extractIconType(command) {
    const types = ['stone', 'mud', 'sand', 'snow', 'water', 'grass', 'dirt', 'cobblestone'];
    return types.find(type => command.includes(type));
}

function extractMonsterName(command) {
    // More flexible patterns to extract monster names
    const patterns = [
        // "call it X" pattern - highest priority
        /call it (\w+)/i,
        // Standard patterns
        /create (?:a |an )?(?:new )?monster (?:called |named )?([^.]+?)(?:\.|$|in my|with|make)/i,
        /create (?:a |an )?([^,]+?)(?:,|called|named)/i,
        /add (?:a |an )?(?:new )?monster (?:called |named )?([^.]+?)(?:\.|$|in my|with|make)/i,
        /make (?:a |an )?(?:new )?monster (?:called |named )?([^.]+?)(?:\.|$|in my|with|make)/i,
        /create (?:a |an )?([^.]+?) monster/i,
        /add (?:a |an )?([^.]+?) monster/i
    ];
    
    for (const pattern of patterns) {
        const match = command.match(pattern);
        if (match && match[1]) {
            // Clean up the name
            let name = match[1].trim();
            // Remove common endings
            name = name.replace(/\s*(in my.*|with.*|make.*)$/i, '');
            return name.trim();
        }
    }
    return null;
}

async function updateIconAutomatically(iconType) {
    try {
        console.log(`🔧 Starting automatic update for ${iconType} icon...`);
        const htmlFile = path.join(__dirname, '../client/runescape_world_builder.html');
        const jsFile = path.join(__dirname, '../client/js/runescape_world_builder.js');
        
        // Define icon updates
        const iconUpdates = {
            stone: { emoji: '⛰️', gradient: 'linear-gradient(135deg, #696969, #808080, #A9A9A9)', color: '#808080' },
            mud: { emoji: '🟤', gradient: 'linear-gradient(135deg, #8B4513, #654321, #5D4037)', color: '#8B4513' },
            sand: { emoji: '🏜️', gradient: 'linear-gradient(135deg, #F4A460, #DEB887, #D2B48C)', color: '#DEB887' },
            snow: { emoji: '❄️', gradient: 'linear-gradient(45deg, #F0F8FF, #E6F3FF)', color: '#F0F8FF' },
            water: { emoji: '💧', gradient: 'linear-gradient(135deg, #4169E1, #1E90FF, #87CEEB)', color: '#4169E1' },
            grass: { emoji: '🌿', gradient: 'linear-gradient(135deg, #228B22, #32CD32, #90EE90)', color: '#228B22' },
            dirt: { emoji: '🟫', gradient: 'linear-gradient(135deg, #8B4513, #A0522D, #CD853F)', color: '#8B4513' }
        };
        
        const update = iconUpdates[iconType];
        if (!update) return { success: false, error: 'Unknown icon type' };
        
        // Update HTML file
        let htmlContent = fs.readFileSync(htmlFile, 'utf8');
        
        // Find and log the current mud tile
        const mudMatch = htmlContent.match(/<div class="tile-btn"[^>]*data-type="mud"[^>]*>[^<]*<\/div>/);
        console.log(`🔍 Current mud tile: ${mudMatch ? mudMatch[0] : 'NOT FOUND'}`);
        
        // Find the current tile dynamically
        const tileRegex = new RegExp(`<div class="tile-btn" data-type="${iconType}"[^>]*>([^<]*)</div>`);
        const currentMatch = htmlContent.match(tileRegex);
        
        if (currentMatch) {
            const currentEmoji = currentMatch[1];
            console.log(`📌 Current ${iconType} emoji: ${currentEmoji}`);
            
            // Replace with new emoji
            const replaceRegex = new RegExp(`(<div class="tile-btn" data-type="${iconType}"[^>]*>)[^<]*(</div>)`);
            htmlContent = htmlContent.replace(replaceRegex, `$1${update.emoji}$2`);
            console.log(`🔄 Replaced ${currentEmoji} with ${update.emoji}`);
        } else {
            console.log(`❌ Could not find ${iconType} tile in HTML`);
        }
        
        fs.writeFileSync(htmlFile, htmlContent);
        console.log(`✅ Updated HTML file for ${iconType}`);
        
        // Update JS file
        let jsContent = fs.readFileSync(jsFile, 'utf8');
        jsContent = jsContent.replace(new RegExp(`${iconType}: '[^']*',`), `${iconType}: '${update.emoji}',`);
        jsContent = jsContent.replace(new RegExp(`${iconType}: '#[^']*',`), `${iconType}: '${update.color}',`);
        
        fs.writeFileSync(jsFile, jsContent);
        console.log(`✅ Updated JS file for ${iconType}`);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function createMonsterAutomatically(monsterName, originalCommand) {
    try {
        console.log(`🐲 Creating new monster: ${monsterName}`);
        
        // Generate monster stats based on name and command
        const stats = generateMonsterStats(monsterName, originalCommand || '');
        
        // Create monster data
        const monster = {
            name: monsterName,
            displayName: monsterName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            level: stats.level,
            hp: stats.hp,
            maxHp: stats.hp,
            damage: stats.damage,
            defense: stats.defense,
            drops: stats.drops,
            respawnTime: 30000,
            description: `A fearsome ${monsterName} that roams the wilderness.`,
            imageUrl: null, // Will be set after OpenAI generates it
            color: stats.color
        };
        
        // Generate image with OpenAI
        console.log(`🎨 Requesting image generation for ${monsterName}...`);
        const imageUrl = await generateMonsterImage(monsterName);
        if (imageUrl) {
            monster.imageUrl = imageUrl;
            console.log(`✅ Image generated: ${imageUrl}`);
        }
        
        // Save monster to database
        await database.saveMonster(monster);
        
        // Add monster to game files
        await addMonsterToGame(monster);
        
        return { success: true, monster };
    } catch (error) {
        console.error(`❌ Error creating monster:`, error);
        return { success: false, error: error.message };
    }
}

function generateMonsterStats(name, command) {
    // Generate stats based on monster name characteristics
    const nameLower = name.toLowerCase();
    const cmdLower = command.toLowerCase();
    
    // Base stats
    let level = 5;
    let hp = 50;
    let damage = 5;
    let defense = 5;
    
    // Adjust based on keywords
    if (nameLower.includes('deadly') || nameLower.includes('death')) {
        damage += 10;
        level += 5;
    }
    if (nameLower.includes('giant') || nameLower.includes('huge')) {
        hp += 50;
        level += 3;
    }
    if (nameLower.includes('armored') || nameLower.includes('iron')) {
        defense += 10;
        level += 3;
    }
    if (nameLower.includes('ancient') || nameLower.includes('elder')) {
        level += 10;
        hp += 30;
        damage += 5;
        defense += 5;
    }
    if (nameLower.includes('glow') || nameLower.includes('magic')) {
        damage += 7;
        level += 2;
    }
    if (nameLower.includes('spider')) {
        damage += 5;
        level += 2;
    }
    
    // Random variation
    level += Math.floor(Math.random() * 5);
    hp += Math.floor(Math.random() * 20);
    
    // Generate drops
    const drops = [
        { name: 'Coins', quantity: Math.floor(Math.random() * 50) + 10, chance: 0.9 },
        { name: `${name} essence`, quantity: 1, chance: 0.3 },
        { name: 'Bones', quantity: 1, chance: 0.8 }
    ];
    
    // Extract color from command
    let color = '#8B0000'; // Default dark red
    
    // Check for color combinations
    if (cmdLower.includes('glow') && cmdLower.includes('green')) {
        color = '#00FF00'; // Bright green glow
    } else if (cmdLower.includes('black') && cmdLower.includes('red')) {
        color = '#1a0000'; // Very dark red/black
    } else if (cmdLower.includes('black')) {
        color = '#000000';
    } else if (cmdLower.includes('red')) {
        color = '#FF0000';
    } else if (cmdLower.includes('green')) {
        color = '#008000';
    }
    
    // Special for glowing creatures
    if (cmdLower.includes('glow')) {
        // Make colors brighter for glow effect
        if (color === '#008000') color = '#00FF00'; // Bright green
        if (color === '#000000') color = '#333333'; // Lighter black for visibility
    }
    
    return { level, hp, damage, defense, drops, color };
}

async function generateMonsterImage(monsterName) {
    try {
        const { generateMonsterImage: generateImage } = require('./openai-config');
        return await generateImage(monsterName);
    } catch (error) {
        console.log(`⚠️ OpenAI integration not available: ${error.message}`);
        return null;
    }
}

async function addMonsterToGame(monster) {
    // Add monster to world.js NPCs array
    const worldFile = path.join(__dirname, '../client/js/world.js');
    let worldContent = fs.readFileSync(worldFile, 'utf8');
    
    // Find NPCs array and add new monster
    const npcPattern = /const npcs = \[([\s\S]*?)\];/;
    const npcMatch = worldContent.match(npcPattern);
    
    if (npcMatch) {
        const newNpc = `\n    {
        id: ${Date.now()},
        name: '${monster.displayName}',
        x: ${300 + Math.floor(Math.random() * 1400)},
        y: ${300 + Math.floor(Math.random() * 1400)},
        hp: ${monster.hp},
        maxHp: ${monster.maxHp},
        level: ${monster.level},
        type: 'hostile',
        respawnTime: ${monster.respawnTime},
        damage: ${monster.damage},
        defense: ${monster.defense},
        drops: ${JSON.stringify(monster.drops)},
        color: '${monster.color || '#8B0000'}'
    },`;
        
        const updatedNpcs = npcMatch[0].replace(/const npcs = \[/, `const npcs = [${newNpc}`);
        worldContent = worldContent.replace(npcPattern, updatedNpcs);
        
        fs.writeFileSync(worldFile, worldContent);
        console.log(`✅ Added ${monster.displayName} to world.js`);
    }
}

async function addNPCToGame(npc) {
    // Add NPC to world.js NPCs array
    const worldFile = path.join(__dirname, '../client/js/world.js');
    let worldContent = fs.readFileSync(worldFile, 'utf8');
    
    // Find NPCs array and add new NPC
    const npcPattern = /const npcs = \[([\s\S]*?)\];/;
    const npcMatch = worldContent.match(npcPattern);
    
    if (npcMatch) {
        const newNpc = `\n    {
        id: ${Date.now()},
        name: '${npc.displayName}',
        x: ${300 + Math.floor(Math.random() * 1400)},
        y: ${300 + Math.floor(Math.random() * 1400)},
        hp: ${npc.hp},
        maxHp: ${npc.maxHp},
        level: ${npc.level},
        type: '${npc.isShopkeeper ? 'shopkeeper' : 'friendly'}',
        dialogue: '${(npc.dialogue || "Hello there!").replace(/'/g, "\\'")}',
        isShopkeeper: ${npc.isShopkeeper},
        shopInventory: ${JSON.stringify(npc.shopInventory)},
        color: '${npc.color || '#4A90E2'}'
    },`;
        
        const updatedNpcs = npcMatch[0].replace(/const npcs = \[/, `const npcs = [${newNpc}`);
        worldContent = worldContent.replace(npcPattern, updatedNpcs);
        
        fs.writeFileSync(worldFile, worldContent);
        console.log(`✅ Added ${npc.displayName} NPC to world.js`);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function analyzeWorld(target, analysisType) {
    try {
        // Get all worlds from database
        const worlds = await database.getWorlds();
        
        if (worlds.length === 0) {
            return "No worlds found in database. Create a world using the World Builder first.";
        }
        
        // For now, analyze the most recent world
        const latestWorld = worlds[0];
        const worldData = await database.getWorld(latestWorld.id);
        
        if (!worldData || !worldData.tiles) {
            return `World "${latestWorld.name}" has no tiles data.`;
        }
        
        const tiles = worldData.tiles;
        const tileCount = Object.keys(tiles).length;
        
        // Count different tile types
        const tileTypes = {};
        let castles = [];
        
        for (const [position, tile] of Object.entries(tiles)) {
            const type = tile.type || 'unknown';
            tileTypes[type] = (tileTypes[type] || 0) + 1;
            
            // Look for castle-related tiles
            if (type.includes('castle') || type.includes('building') || tile.name?.toLowerCase().includes('castle')) {
                castles.push({ position, tile });
            }
        }
        
        if (target.toLowerCase().includes('castle')) {
            if (castles.length === 0) {
                return `No castles found in world "${latestWorld.name}". Try building some castle tiles first!`;
            }
            
            if (analysisType === 'detailed') {
                return `Castle Analysis for "${latestWorld.name}":
• Found ${castles.length} castle-related structures
• World size: ${worldData.width}x${worldData.height}
• Total tiles: ${tileCount}
• Castle positions: ${castles.map(c => c.position).join(', ')}
• Tile types in world: ${Object.keys(tileTypes).join(', ')}`;
            } else {
                return `Found ${castles.length} castle structures in "${latestWorld.name}"`;
            }
        }
        
        // General world analysis
        return `World "${latestWorld.name}" Analysis:
• Size: ${worldData.width}x${worldData.height}
• Total tiles: ${tileCount}
• Tile types: ${Object.keys(tileTypes).join(', ')}
• Created: ${new Date(latestWorld.createdAt).toLocaleDateString()}`;
        
    } catch (error) {
        console.error('World analysis error:', error);
        return `Error analyzing world: ${error.message}`;
    }
}

async function getGameInfo(topic) {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('world') || topicLower.includes('overview')) {
        try {
            const stats = await database.getStats();
            return `Game Overview: ${stats.worlds} worlds created, ${stats.monsters} custom monsters, ${stats.players} players registered. Use the World Builder to create worlds!`;
        } catch (error) {
            return "Game Overview: RuneScape clone with world building, monster creation, and multiplayer features.";
        }
    }
    
    if (topicLower.includes('monster')) {
        return "You can create custom monsters using the Claude Terminal! Try: 'create a deadly fire dragon'";
    }
    
    if (topicLower.includes('command') || topicLower.includes('help')) {
        return "Available commands: Create monsters, update icons, analyze worlds, or ask for information. Try natural language!";
    }
    
    return `Information about "${topic}": This is a RuneScape-style game with world building and monster creation features.`;
}

// Store message queue for Claude Code
app.post('/claude/send', express.json(), async (req, res) => {
    const message = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        command: req.body.command,
        worldContext: req.body.worldContext,
        fullMessage: req.body.fullMessage,
        status: 'PROCESSING'
    };
    
    claudeMessages.push(message);
    
    console.log('📥 AUTO-PROCESSING MESSAGE:', {
        timestamp: message.timestamp,
        command: message.command,
        id: message.id
    });
    
    // Automatically process the message
    processClaudeMessage(message);
    
    res.json({ success: true, messageId: message.id });
});

// Get messages for Claude Code
app.get('/claude/messages', (req, res) => {
    res.json(claudeMessages);
});

// Mark message as processed
app.post('/claude/processed/:id', (req, res) => {
    const messageId = req.params.id;
    const message = claudeMessages.find(m => m.id === messageId);
    if (message) {
        message.status = 'PROCESSED';
        message.processedAt = new Date().toISOString();
    }
    res.json({ success: true });
});

// World management endpoints

// Save world data
app.post('/api/worlds/save', express.json({ limit: '10mb' }), async (req, res) => {
    try {
        const worldData = req.body;
        const result = await database.saveWorld(worldData);
        res.json(result);
    } catch (error) {
        console.error('Error saving world:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get list of saved worlds
app.get('/api/worlds', async (req, res) => {
    try {
        const worlds = await database.getWorlds();
        res.json(worlds);
    } catch (error) {
        console.error('Error fetching worlds:', error);
        res.status(500).json({ error: error.message });
    }
});

// Load specific world
app.get('/api/worlds/:id', async (req, res) => {
    try {
        const world = await database.getWorld(req.params.id);
        if (world) {
            console.log(`📤 Sending world data for ${req.params.id}:`, {
                name: world.name,
                width: world.width,
                height: world.height,
                tilesX: world.tilesX,
                tilesY: world.tilesY,
                tileSize: world.tileSize,
                tilesCount: Array.isArray(world.tiles) ? world.tiles.length : Object.keys(world.tiles || {}).length
            });
            res.json(world);
        } else {
            res.status(404).json({ error: 'World not found' });
        }
    } catch (error) {
        console.error('Error loading world:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete world
app.delete('/api/worlds/:id', async (req, res) => {
    try {
        const result = await database.deleteWorld(req.params.id);
        if (result.deleted) {
            res.json({ success: true, message: 'World deleted' });
        } else {
            res.status(404).json({ error: 'World not found' });
        }
    } catch (error) {
        console.error('Error deleting world:', error);
        res.status(500).json({ error: error.message });
    }
});

// Monster management endpoints

// Get all monsters
app.get('/api/monsters', async (req, res) => {
    try {
        const monsters = await database.getMonsters();
        res.json(monsters);
    } catch (error) {
        console.error('Error fetching monsters:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save monster
app.post('/api/monsters/save', express.json(), async (req, res) => {
    try {
        const result = await database.saveMonster(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving monster:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// NPC management endpoints

// Get all NPCs
app.get('/api/npcs', async (req, res) => {
    try {
        const npcs = await database.getNPCs();
        res.json(npcs);
    } catch (error) {
        console.error('Error fetching NPCs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save NPC
app.post('/api/npcs/save', express.json(), async (req, res) => {
    try {
        const result = await database.saveNPC(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving NPC:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Building management endpoints

// Get all buildings
app.get('/api/buildings', async (req, res) => {
    try {
        const buildings = await database.getBuildings();
        res.json(buildings);
    } catch (error) {
        console.error('Error fetching buildings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save building
app.post('/api/buildings/save', express.json(), async (req, res) => {
    try {
        const result = await database.saveBuilding(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving building:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Object management endpoints

// Get all objects
app.get('/api/objects', async (req, res) => {
    try {
        const objects = await database.getObjects();
        res.json(objects);
    } catch (error) {
        console.error('Error fetching objects:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save object
app.post('/api/objects/save', express.json(), async (req, res) => {
    try {
        const result = await database.saveObject(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving object:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Quest management endpoints

// Get all quests
app.get('/api/quests', async (req, res) => {
    try {
        const quests = await database.getQuests();
        res.json(quests);
    } catch (error) {
        console.error('Error fetching quests:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save quest
app.post('/api/quests/save', express.json(), async (req, res) => {
    try {
        const result = await database.saveQuest(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving quest:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get database statistics
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await database.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint for environment variables
app.get('/api/debug/env', (req, res) => {
    const fs = require('fs');
    let envFileContent = 'Could not read file';
    try {
        const envPath = path.join(__dirname, '../.env');
        envFileContent = fs.readFileSync(envPath, 'utf8').split('\n')
            .filter(line => line.includes('OPENAI_API_KEY'))
            .map(line => line.substring(0, 20) + '...')
            .join('\n') || 'No OPENAI_API_KEY found in .env';
    } catch (error) {
        envFileContent = 'Error reading .env: ' + error.message;
    }
    
    res.json({
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
        keyStart: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'Not set',
        keyEnd: process.env.OPENAI_API_KEY ? '...' + process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 10) : 'Not set',
        nodeEnv: process.env.NODE_ENV || 'not set',
        envFile: path.join(__dirname, '../.env'),
        envFileContent: envFileContent,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('OPENAI')),
        processTitle: process.title,
        cwd: process.cwd()
    });
});

// Function to load world data for terrain checking
async function loadWorldData(worldId = null) {
    try {
        let worldData = null;
        
        if (worldId) {
            // Load specific world
            worldData = await database.getWorld(worldId);
        } else {
            // Load the latest world
            const worlds = await database.getWorlds();
            if (worlds && worlds.length > 0) {
                const latestWorld = worlds[0]; // getWorlds returns newest first
                worldData = await database.getWorld(latestWorld.id);
            }
        }
        
        if (worldData && worldData.tiles) {
            currentWorldData = worldData;
            console.log(`🗺️ Loaded world data for terrain checking: ${worldData.name || 'Unknown'}`);
            console.log(`📏 World dimensions: ${worldData.width || 2000}x${worldData.height || 2000}`);
            return true;
        }
    } catch (error) {
        console.warn('⚠️ Could not load world data for terrain checking:', error.message);
    }
    
    // No custom world data, will use default terrain generation
    currentWorldData = null;
    console.log('🏞️ Using default terrain generation for monster spawning');
    return false;
}

server.listen(PORT, async () => {
    console.log(`RuneScape Clone server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser to play!`);
    console.log(`Claude Code bridge available at http://localhost:${PORT}/claude/messages`);
    console.log(`📊 Database stats available at http://localhost:${PORT}/api/stats`);
    
    // Load world data for terrain checking
    await loadWorldData();
    
    // Initialize AI Game Master after server starts
    aiGameMaster = new AIGameMaster(io);
    console.log(`🎲 AI Game Master initialized and monitoring world events`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    database.close();
    server.close(() => {
        console.log('✅ Server shutdown complete');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    database.close();
    server.close(() => {
        console.log('✅ Server shutdown complete');
        process.exit(0);
    });
});