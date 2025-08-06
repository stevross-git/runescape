// OpenAI Configuration for Monster Image Generation
// To use this:
// 1. Get an API key from https://platform.openai.com/api-keys
// 2. Set the environment variable: OPENAI_API_KEY=your-key-here
// 3. Or replace 'your-api-key-here' below

// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-api-key-here';

async function generateMonsterImage(monsterName) {
    if (OPENAI_API_KEY === 'your-api-key-here') {
        console.log('⚠️ OpenAI API key not configured!');
        console.log('Set OPENAI_API_KEY environment variable or update openai-config.js');
        return null;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                prompt: `Fantasy RPG monster sprite: ${monsterName}, pixel art style, game asset, transparent background, facing forward, full body, RuneScape style`,
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

module.exports = { generateMonsterImage };