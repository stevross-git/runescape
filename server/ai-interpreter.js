// AI Command Interpreter using OpenAI
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-api-key-here';

async function understandCommand(userCommand) {
    if (OPENAI_API_KEY === 'your-api-key-here') {
        console.log('⚠️ OpenAI API key not configured for AI interpreter');
        return null;
    }

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
                        content: `You are a game command interpreter. Extract structured data from user commands.
                        
Return a JSON object with one of these action types:
1. For icon updates: { "action": "update_icon", "iconType": "grass/water/stone/etc" }
2. For monster creation: { "action": "create_monster", "name": "monster name", "attributes": { "color": "hex or description", "level": number, "traits": ["deadly", "glowing", etc] } }
3. For item creation: { "action": "create_item", "name": "item name", "type": "weapon/armor/consumable", "stats": {} }
4. For unknown: { "action": "unknown", "message": "what user might want" }

Examples:
"update grass icon" → { "action": "update_icon", "iconType": "grass" }
"create a glowing green spider called Bob" → { "action": "create_monster", "name": "Bob", "attributes": { "color": "#00FF00", "traits": ["glowing", "spider"] } }
"make a deadly black spider with red butt" → { "action": "create_monster", "name": "Deadly Black Spider", "attributes": { "color": "#000000", "secondaryColor": "#FF0000", "traits": ["deadly", "spider"] } }`
                    },
                    {
                        role: "user",
                        content: userCommand
                    }
                ],
                temperature: 0.3,
                max_tokens: 200
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            const content = data.choices[0].message.content;
            try {
                const understanding = JSON.parse(content);
                console.log('🤖 AI Understanding:', understanding);
                return understanding;
            } catch (parseError) {
                console.error('Failed to parse AI response:', content);
                return null;
            }
        }
        
        return null;
    } catch (error) {
        console.error('AI interpreter error:', error.message);
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
            
        case 'create_item':
            return {
                type: 'item_creation',
                item: understanding
            };
            
        default:
            return {
                type: 'unknown',
                message: understanding.message || 'Command not understood'
            };
    }
}

module.exports = { understandCommand, executeAICommand };