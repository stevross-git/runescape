// OpenAI Configuration for Monster Image Generation
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables if not already loaded
if (!process.env.OPENAI_API_KEY) {
    const envPath = path.join(__dirname, '../.env');
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
        console.warn('⚠️ OpenAI Config: Could not load .env file:', result.error.message);
    }
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateImage(contentType, name, description = '') {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-api-key-here') {
        console.log('⚠️ OpenAI API key not configured!');
        console.log('Set OPENAI_API_KEY environment variable or update openai-config.js');
        return null;
    }

    let prompt;
    
    switch (contentType) {
        case 'monster':
            prompt = `2D RPG game sprite of ${name}, classic 16-bit pixel art, 2D side view, video game character design, detailed sprite animation frame, retro gaming style, clean pixel graphics, transparent background, no background, game asset ready, fantasy RPG monster, creature, beast`;
            break;
            
        case 'npc':
            prompt = `2D RPG game sprite of ${name}, friendly NPC character, classic 16-bit pixel art, 2D side view, video game character design, human character, villager, shopkeeper, guard, detailed sprite animation frame, retro gaming style, clean pixel graphics, transparent background, no background, game asset ready`;
            break;
            
        case 'building':
            prompt = `2D RPG game building sprite of ${name}, classic 16-bit pixel art, isometric or top-down view, video game building design, ${description}, architecture, structure, detailed building sprite, retro gaming style, clean pixel graphics, transparent background, no background, game asset ready`;
            break;
            
        case 'object':
            prompt = `2D RPG game object sprite of ${name}, classic 16-bit pixel art, item sprite, video game object design, ${description}, collectible, interactive object, detailed item sprite, retro gaming style, clean pixel graphics, transparent background, no background, game asset ready`;
            break;
            
        default:
            prompt = `2D RPG game sprite of ${name}, classic 16-bit pixel art, 2D side view, video game design, detailed sprite, retro gaming style, clean pixel graphics, transparent background, no background, game asset ready`;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                prompt: prompt,
                n: 1,
                size: "256x256",
                response_format: "url"
            })
        });

        const data = await response.json();
        
        if (data.data && data.data[0]) {
            return data.data[0].url;
        } else {
            console.error('Failed to generate image:', data.error);
            return null;
        }
    } catch (error) {
        console.error('OpenAI API error:', error);
        return null;
    }
}

// Backward compatibility
async function generateMonsterImage(monsterName) {
    return generateImage('monster', monsterName);
}

module.exports = { generateMonsterImage, generateImage };