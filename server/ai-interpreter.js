// AI Command Interpreter using OpenAI
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables if not already loaded
if (!process.env.OPENAI_API_KEY) {
    const envPath = path.join(__dirname, '../.env');
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
        console.warn('⚠️ AI Interpreter: Could not load .env file:', result.error.message);
    } else {
        console.log('✅ AI Interpreter: Loaded environment variables');
    }
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function understandCommand(userCommand) {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-api-key-here') {
        console.log('⚠️ OpenAI API key not configured for AI interpreter');
        return null;
    }
    
    console.log('🤖 AI Understanding command:', userCommand);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a creative game command interpreter for a RuneScape-style game. Extract structured data from user commands and be creative with incomplete requests.

When users mention franchises like "Five Nights at Freddy's", "Pokemon", "Zelda", etc., create appropriate monsters inspired by those themes.

Return a JSON object with one of these action types:
1. For icon updates: { "action": "update_icon", "iconType": "grass/water/stone/etc" }
2. For monster creation: { "action": "create_monster", "name": "monster name", "attributes": { "color": "hex or description", "level": number, "traits": ["deadly", "animatronic", "mechanical", etc] } }
3. For NPC/shopkeeper creation: { "action": "create_npc", "name": "npc name", "type": "shopkeeper/guard/villager", "attributes": { "color": "hex or description", "shop": ["item1", "item2"], "dialogue": "greeting text" } }
4. For building creation: { "action": "create_building", "name": "building name", "type": "house/shop/tower/castle", "attributes": { "color": "hex or description", "width": number, "height": number, "materials": ["wood", "stone"], "description": "text" } }
5. For object creation: { "action": "create_object", "name": "object name", "type": "item/resource/decoration", "attributes": { "color": "hex or description", "size": "small/medium/large", "interaction": "pickup/use/harvest", "drops": ["item1", "item2"] } }
6. For quest creation: { "action": "create_quest", "name": "quest name", "type": "fetch/kill/talk/explore", "attributes": { "difficulty": "easy/medium/hard", "description": "quest description", "objectives": ["objective1", "objective2"], "rewards": ["reward1", "reward2"], "npcGiver": "NPC name" } }
7. For editing/updating content: { "action": "update_content", "contentType": "monster/npc/building/object/quest", "target": "current name", "changes": { "name": "new name", "level": number, "color": "new color", etc } }
8. For item creation: { "action": "create_item", "name": "item name", "type": "weapon/armor/consumable", "stats": {} }
9. For world analysis: { "action": "analyze_world", "target": "castle/building/area", "analysisType": "detailed/basic/stats" }
10. For world generation: { "action": "generate_world", "prompt": "world description", "name": "world name", "attributes": { "theme": "fantasy/medieval/modern", "biomes": ["forest", "desert"], "structures": ["village", "castle"], "size": "small/medium/large" } }
11. For AI Game Master events: { "action": "ai_gm_event", "eventType": "encounter/weather/economy/quest/celebration/disaster", "intensity": "low/medium/high", "targetPlayer": "player_id or null", "customPrompt": "specific event description" }
12. For AI GM world state: { "action": "ai_gm_state", "queryType": "status/events/players/danger", "action": "view/adjust", "value": number }
13. For general information: { "action": "info_request", "topic": "what they want to know about" }
14. For unknown: { "action": "unknown", "message": "what user might want" }

Examples:
"update grass icon" → { "action": "update_icon", "iconType": "grass" }
"create a glowing green spider called Bob" → { "action": "create_monster", "name": "Bob", "attributes": { "color": "#00FF00", "traits": ["glowing", "spider"] } }
"create a shopkeeper named Shoey selling mud" → { "action": "create_npc", "name": "Shoey", "type": "shopkeeper", "attributes": { "color": "#8B4513", "shop": ["mud", "dirt", "clay"], "dialogue": "Welcome to my mud shop!" } }
"build a wooden house" → { "action": "create_building", "name": "Wooden House", "type": "house", "attributes": { "color": "#8B4513", "width": 96, "height": 96, "materials": ["wood", "nails"], "description": "A cozy wooden house" } }
"add a magic crystal that gives mana" → { "action": "create_object", "name": "Magic Crystal", "type": "resource", "attributes": { "color": "#9966FF", "size": "medium", "interaction": "harvest", "drops": ["mana potion", "crystal shard"] } }
"create a quest to find 5 apples" → { "action": "create_quest", "name": "Apple Gathering", "type": "fetch", "attributes": { "difficulty": "easy", "description": "Help gather apples for the village", "objectives": ["Find 5 red apples"], "rewards": ["50 gold", "experience"], "npcGiver": "Village Elder" } }
"change NPC John name to Johnny" → { "action": "update_content", "contentType": "npc", "target": "John", "changes": { "name": "Johnny" } }
"make the dragon stronger level 25" → { "action": "update_content", "contentType": "monster", "target": "dragon", "changes": { "level": 25 } }
"change the house color to blue" → { "action": "update_content", "contentType": "building", "target": "house", "changes": { "color": "#0000FF" } }
"add a monster based on Five Nights at Freddy's" → { "action": "create_monster", "name": "Freddy Animatronic", "attributes": { "color": "#8B4513", "level": 15, "traits": ["animatronic", "mechanical", "scary", "nighttime"] } }
"analyze the castle in detail" → { "action": "analyze_world", "target": "castle", "analysisType": "detailed" }
"generate a medieval fantasy world with forests and castles" → { "action": "generate_world", "prompt": "medieval fantasy world with forests and castles", "name": "Medieval Fantasy Realm", "attributes": { "theme": "medieval", "biomes": ["forest"], "structures": ["castle"], "size": "medium" } }
"create a small desert world called Sandlands" → { "action": "generate_world", "prompt": "small desert world", "name": "Sandlands", "attributes": { "theme": "desert", "biomes": ["desert"], "structures": ["oasis", "ruins"], "size": "small" } }
"make a large world with everything" → { "action": "generate_world", "prompt": "large diverse world with multiple biomes", "name": "The Great Realm", "attributes": { "theme": "fantasy", "biomes": ["forest", "desert", "snow", "plains"], "structures": ["village", "castle", "cave", "tower"], "size": "large" } }
"AI GM create a monster invasion" → { "action": "ai_gm_event", "eventType": "encounter", "intensity": "high", "customPrompt": "monster invasion event" }
"start a village celebration" → { "action": "ai_gm_event", "eventType": "celebration", "intensity": "medium", "customPrompt": "village festival with music and dancing" }
"make the world more dangerous" → { "action": "ai_gm_state", "queryType": "danger", "action": "adjust", "value": 3 }
"show AI GM status" → { "action": "ai_gm_state", "queryType": "status", "action": "view" }
"trigger random event" → { "action": "ai_gm_event", "eventType": "random", "intensity": "medium" }
"create weather storm" → { "action": "ai_gm_event", "eventType": "weather", "intensity": "high", "customPrompt": "thunderstorm with lightning" }`
                    },
                    {
                        role: "user",
                        content: userCommand
                    }
                ],
                temperature: 0.3,
                max_tokens: 300
            })
        });

        const data = await response.json();
        
        console.log('📡 OpenAI API Response Status:', response.status);
        console.log('📡 OpenAI API Response:', JSON.stringify(data, null, 2));
        
        if (!response.ok) {
            console.error('❌ OpenAI API Error:', data.error);
            return null;
        }
        
        if (data.choices && data.choices[0]) {
            const content = data.choices[0].message.content;
            console.log('🎯 Raw AI response content:', content);
            
            try {
                const understanding = JSON.parse(content);
                console.log('✅ Parsed AI Understanding:', understanding);
                return understanding;
            } catch (parseError) {
                console.error('❌ Failed to parse AI response as JSON:', content);
                console.error('Parse error:', parseError.message);
                return null;
            }
        } else {
            console.error('❌ No choices in OpenAI response');
            return null;
        }
    } catch (error) {
        console.error('❌ AI interpreter error:', error.message);
        console.error('Full error:', error);
        return null;
    }
}

// Process the AI understanding into game actions
async function executeAICommand(understanding, originalCommand) {
    switch (understanding.action) {
        case 'update_icon':
            return {
                type: 'icon_update',
                iconType: understanding.iconType
            };
            
        case 'create_monster':
            const monster = {
                name: understanding.name,
                color: understanding.attributes?.color || '#8B0000',
                secondaryColor: understanding.attributes?.secondaryColor,
                traits: understanding.attributes?.traits || [],
                level: understanding.attributes?.level
            };
            
            // Generate stats based on traits
            let baseStats = {
                level: monster.level || 5,
                hp: 50,
                damage: 5,
                defense: 5
            };
            
            // Apply trait modifiers
            if (monster.traits.includes('deadly')) {
                baseStats.damage += 10;
                baseStats.level += 5;
            }
            if (monster.traits.includes('glowing') || monster.traits.includes('magic')) {
                baseStats.damage += 7;
                baseStats.level += 2;
            }
            if (monster.traits.includes('spider')) {
                baseStats.damage += 5;
                baseStats.level += 2;
            }
            if (monster.traits.includes('giant') || monster.traits.includes('huge')) {
                baseStats.hp += 50;
                baseStats.level += 3;
            }
            if (monster.traits.includes('animatronic') || monster.traits.includes('mechanical')) {
                baseStats.hp += 30;
                baseStats.defense += 8;
                baseStats.level += 4;
            }
            if (monster.traits.includes('scary') || monster.traits.includes('nightmare')) {
                baseStats.damage += 8;
                baseStats.level += 3;
            }
            if (monster.traits.includes('nighttime')) {
                baseStats.damage += 5;
                baseStats.level += 2;
            }
            
            return {
                type: 'monster_creation',
                monster: {
                    ...monster,
                    ...baseStats,
                    drops: [
                        { name: 'Coins', quantity: Math.floor(Math.random() * 50) + 10, chance: 0.9 },
                        { name: `${monster.name} essence`, quantity: 1, chance: 0.3 },
                        { name: 'Bones', quantity: 1, chance: 0.8 }
                    ]
                }
            };

        case 'create_npc':
            const npc = {
                name: understanding.name,
                type: understanding.type || 'villager',
                color: understanding.attributes?.color || '#4A90E2',
                dialogue: understanding.attributes?.dialogue || `Hello, I'm ${understanding.name}!`,
                shop: understanding.attributes?.shop || []
            };

            return {
                type: 'npc_creation',
                npc: {
                    ...npc,
                    id: `npc_${Date.now()}`,
                    level: 1,
                    hp: 100,
                    maxHp: 100,
                    friendly: true,
                    isShopkeeper: npc.type === 'shopkeeper',
                    shopInventory: npc.shop.map(item => ({
                        name: item,
                        price: Math.floor(Math.random() * 100) + 10,
                        stock: Math.floor(Math.random() * 50) + 5
                    }))
                }
            };

        case 'create_building':
            const building = {
                name: understanding.name,
                type: understanding.type || 'structure',
                color: understanding.attributes?.color || '#8B4513',
                secondaryColor: understanding.attributes?.secondaryColor,
                width: understanding.attributes?.width || 64,
                height: understanding.attributes?.height || 64,
                materials: understanding.attributes?.materials || ['wood', 'stone'],
                description: understanding.attributes?.description || `A ${understanding.type || 'structure'} called ${understanding.name}.`
            };

            return {
                type: 'building_creation',
                building: {
                    ...building,
                    interiorItems: [],
                    accessible: true
                }
            };

        case 'create_object':
            const object = {
                name: understanding.name,
                type: understanding.type || 'item',
                color: understanding.attributes?.color || '#654321',
                size: understanding.attributes?.size || 'small',
                interactionType: understanding.attributes?.interaction || 'pickup',
                drops: understanding.attributes?.drops?.map(drop => ({
                    name: drop,
                    quantity: Math.floor(Math.random() * 3) + 1,
                    chance: 0.7
                })) || [],
                description: understanding.attributes?.description || `A ${understanding.type || 'item'} called ${understanding.name}.`,
                durability: 100,
                respawnTime: 60000
            };

            return {
                type: 'object_creation',
                object: object
            };

        case 'create_quest':
            const quest = {
                name: understanding.name,
                type: understanding.type || 'fetch',
                difficulty: understanding.attributes?.difficulty || 'easy',
                description: understanding.attributes?.description || `Help complete the ${understanding.name} quest.`,
                objectives: understanding.attributes?.objectives || [`Complete the ${understanding.name} task`],
                rewards: understanding.attributes?.rewards?.map(reward => ({
                    name: reward,
                    quantity: reward.toLowerCase().includes('gold') ? Math.floor(Math.random() * 100) + 50 : 1
                })) || [{ name: 'Gold', quantity: 50 }, { name: 'Experience', quantity: 100 }],
                requirements: understanding.attributes?.requirements || [],
                npcGiver: understanding.attributes?.npcGiver || 'Quest Giver',
                estimatedTime: understanding.attributes?.estimatedTime || 10,
                experienceReward: 100,
                goldReward: 50
            };

            return {
                type: 'quest_creation',
                quest: quest
            };

        case 'update_content':
            return {
                type: 'content_update',
                contentType: understanding.contentType,
                target: understanding.target,
                changes: understanding.changes || {}
            };

        case 'generate_world':
            const worldParams = {
                name: understanding.name || understanding.attributes?.name || 'AI Generated World',
                theme: understanding.attributes?.theme || 'fantasy',
                biomes: understanding.attributes?.biomes || ['forest', 'plains'],
                structures: understanding.attributes?.structures || ['village', 'cave']
            };

            // Map size to dimensions
            const sizeMap = {
                small: { width: 1000, height: 1000 },
                medium: { width: 2000, height: 2000 },
                large: { width: 3000, height: 3000 }
            };
            
            const size = understanding.attributes?.size || 'medium';
            const dimensions = sizeMap[size] || sizeMap.medium;

            return {
                type: 'world_generation',
                prompt: understanding.prompt || originalCommand,
                worldParams: {
                    ...worldParams,
                    width: dimensions.width,
                    height: dimensions.height
                }
            };

        case 'ai_gm_event':
            return {
                type: 'ai_gm_event',
                eventType: understanding.eventType || 'random',
                intensity: understanding.intensity || 'medium',
                targetPlayer: understanding.targetPlayer,
                customPrompt: understanding.customPrompt || originalCommand
            };

        case 'ai_gm_state':
            return {
                type: 'ai_gm_state',
                queryType: understanding.queryType || 'status',
                action: understanding.action || 'view',
                value: understanding.value
            };
            
        case 'create_item':
            return {
                type: 'item_creation',
                item: understanding
            };
            
        case 'analyze_world':
            return {
                type: 'world_analysis',
                target: understanding.target,
                analysisType: understanding.analysisType || 'basic'
            };
            
        case 'info_request':
            return {
                type: 'info_request',
                topic: understanding.topic
            };
            
        default:
            return {
                type: 'unknown',
                message: understanding.message || 'Command not understood'
            };
    }
}

module.exports = { understandCommand, executeAICommand };