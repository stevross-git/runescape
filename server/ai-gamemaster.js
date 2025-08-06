// AI Game Master System - Dynamic World Events & Storytelling
const path = require('path');
const dotenv = require('dotenv');
const database = require('./database');
const { generateImage } = require('./openai-config');
const { v4: uuidv4 } = require('uuid');

// Load environment variables if not already loaded
if (!process.env.OPENAI_API_KEY) {
    const envPath = path.join(__dirname, '../.env');
    dotenv.config({ path: envPath });
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

class AIGameMaster {
    constructor(io) {
        this.io = io; // Socket.IO instance for real-time events
        this.playerActions = new Map(); // Track player behavior
        this.worldState = {
            danger_level: 1, // 1-10 scale
            economy_state: 'stable', // stable, inflation, recession, boom
            weather: 'clear', // clear, rain, storm, fog
            season: 'spring', // spring, summer, autumn, winter
            active_events: new Map(),
            faction_relations: new Map()
        };
        this.eventHistory = [];
        this.lastEventTime = Date.now();
        this.eventCooldown = 30000; // 30 seconds between events minimum
        
        console.log('🎲 AI Game Master initialized');
        this.startEventLoop();
    }

    // Monitor and analyze player actions
    trackPlayerAction(playerId, action, details = {}) {
        if (!this.playerActions.has(playerId)) {
            this.playerActions.set(playerId, {
                playerId,
                actions: [],
                preferences: {
                    combat: 0,
                    exploration: 0,
                    social: 0,
                    trading: 0,
                    building: 0
                },
                lastSeen: Date.now(),
                level: details.level || 1,
                location: details.location || { x: 1000, y: 1000 },
                totalActions: 0
            });
        }

        const playerData = this.playerActions.get(playerId);
        playerData.actions.push({
            type: action,
            timestamp: Date.now(),
            details
        });
        playerData.lastSeen = Date.now();
        playerData.totalActions++;

        // Update preferences based on action type
        switch (action) {
            case 'attack_monster':
            case 'kill_monster':
            case 'pvp_combat':
                playerData.preferences.combat++;
                break;
            case 'move':
            case 'explore_area':
                playerData.preferences.exploration++;
                break;
            case 'chat':
            case 'talk_npc':
                playerData.preferences.social++;
                break;
            case 'buy_item':
            case 'sell_item':
                playerData.preferences.trading++;
                break;
            case 'place_tile':
            case 'build_structure':
                playerData.preferences.building++;
                break;
        }

        // Keep only last 50 actions per player to manage memory
        if (playerData.actions.length > 50) {
            playerData.actions = playerData.actions.slice(-50);
        }

        // Update location and level if provided
        if (details.location) playerData.location = details.location;
        if (details.level) playerData.level = details.level;

        console.log(`🎯 GM tracked: ${playerId} -> ${action} (${playerData.totalActions} total actions)`);
    }

    // Analyze player behavior and generate appropriate events
    async generateDynamicEvent(triggerType = 'random', targetPlayer = null) {
        if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-api-key-here') {
            console.log('⚠️ AI GM: OpenAI API key not configured');
            return null;
        }

        try {
            // Gather context for AI decision making
            const context = this.gatherWorldContext(targetPlayer);
            
            const prompt = `You are an AI Game Master for a RuneScape-style MMO. Create a dynamic event based on the current world state and player behavior.

World Context:
- Danger Level: ${context.dangerLevel}/10
- Economy: ${context.economy}
- Weather: ${context.weather}
- Season: ${context.season}
- Active Players: ${context.activePlayers}
- Recent Events: ${context.recentEvents.join(', ') || 'None'}

${targetPlayer ? `Target Player Context:
- Level: ${context.playerContext?.level}
- Combat Actions: ${context.playerContext?.combatActions}
- Exploration: ${context.playerContext?.exploration}
- Recent Activity: ${context.playerContext?.recentActivity}
- Location: (${context.playerContext?.location?.x}, ${context.playerContext?.location?.y})` : ''}

Trigger: ${triggerType}

Create an event that fits the current situation. Return a JSON object with this structure:
{
    "eventType": "encounter/weather/economy/quest/celebration/disaster/mystery",
    "title": "Event Name",
    "description": "What happens to players",
    "duration": minutes,
    "effects": {
        "monsters": "spawn_type or null",
        "weather": "new_weather or null", 
        "economy": "price_change or null",
        "experience": "bonus_multiplier or null"
    },
    "targetArea": {
        "x": number,
        "y": number,
        "radius": number
    },
    "message": "Message to display to players",
    "rarity": "common/uncommon/rare/legendary"
}

Examples:
- High combat activity → Monster invasion event
- Lots of trading → Merchant caravan arrives
- Player exploring alone → Mystery encounter
- Peaceful period → Festival celebration
- High danger level → Disaster event
- New player → Helpful NPC guide appears`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: prompt },
                        { role: "user", content: `Generate an event for trigger: ${triggerType}` }
                    ],
                    temperature: 0.8,
                    max_tokens: 400
                })
            });

            const data = await response.json();
            
            if (data.choices && data.choices[0]) {
                const eventData = JSON.parse(data.choices[0].message.content);
                return await this.executeEvent(eventData);
            }
        } catch (error) {
            console.error('🎲 AI GM event generation error:', error);
        }

        return null;
    }

    // Gather context for AI decision making
    gatherWorldContext(targetPlayer = null) {
        const activePlayers = Array.from(this.playerActions.values())
            .filter(p => Date.now() - p.lastSeen < 300000) // Active in last 5 minutes
            .length;

        const recentEvents = this.eventHistory
            .filter(e => Date.now() - e.timestamp < 600000) // Last 10 minutes
            .map(e => e.title);

        let playerContext = null;
        if (targetPlayer && this.playerActions.has(targetPlayer)) {
            const player = this.playerActions.get(targetPlayer);
            playerContext = {
                level: player.level,
                combatActions: player.preferences.combat,
                exploration: player.preferences.exploration,
                recentActivity: player.actions.slice(-5).map(a => a.type).join(', '),
                location: player.location
            };
        }

        return {
            dangerLevel: this.worldState.danger_level,
            economy: this.worldState.economy_state,
            weather: this.worldState.weather,
            season: this.worldState.season,
            activePlayers,
            recentEvents,
            playerContext
        };
    }

    // Execute the generated event
    async executeEvent(eventData) {
        const eventId = uuidv4();
        const event = {
            id: eventId,
            ...eventData,
            startTime: Date.now(),
            endTime: Date.now() + (eventData.duration * 60000), // Convert minutes to milliseconds
            active: true
        };

        // Store in active events
        this.worldState.active_events.set(eventId, event);
        
        // Add to history
        this.eventHistory.push({
            id: eventId,
            title: event.title,
            timestamp: Date.now(),
            rarity: event.rarity
        });

        // Apply world state changes
        if (event.effects.weather) {
            this.worldState.weather = event.effects.weather;
        }
        if (event.effects.economy) {
            this.worldState.economy_state = event.effects.economy;
        }

        // Broadcast event to all players
        this.io.emit('aiGameMasterEvent', {
            event: {
                id: eventId,
                type: event.eventType,
                title: event.title,
                description: event.description,
                message: event.message,
                duration: event.duration,
                effects: event.effects,
                targetArea: event.targetArea,
                rarity: event.rarity
            }
        });

        console.log(`🎲 AI GM Event Triggered: ${event.title} (${event.rarity})`);
        console.log(`📍 Target Area: (${event.targetArea.x}, ${event.targetArea.y}) radius ${event.targetArea.radius}`);

        // Schedule event cleanup
        setTimeout(() => {
            this.endEvent(eventId);
        }, event.duration * 60000);

        return event;
    }

    // End an active event
    endEvent(eventId) {
        if (this.worldState.active_events.has(eventId)) {
            const event = this.worldState.active_events.get(eventId);
            event.active = false;
            
            this.worldState.active_events.delete(eventId);
            
            // Notify players event ended
            this.io.emit('aiGameMasterEventEnd', {
                eventId,
                title: event.title,
                message: `The ${event.title} has ended.`
            });

            console.log(`🎲 AI GM Event Ended: ${event.title}`);
        }
    }

    // Main event loop - periodically check for opportunities to create events
    startEventLoop() {
        setInterval(() => {
            this.checkForEventOpportunities();
        }, 45000); // Check every 45 seconds
    }

    async checkForEventOpportunities() {
        // Don't create events too frequently
        if (Date.now() - this.lastEventTime < this.eventCooldown) {
            return;
        }

        // Limit concurrent events
        if (this.worldState.active_events.size >= 3) {
            return;
        }

        // Random chance for spontaneous events
        const eventChance = Math.random();
        const activePlayers = Array.from(this.playerActions.values())
            .filter(p => Date.now() - p.lastSeen < 300000).length;

        // Higher chance with more active players
        const baseChance = 0.1 + (activePlayers * 0.05);
        
        if (eventChance < baseChance) {
            console.log('🎲 AI GM: Generating spontaneous event...');
            await this.generateDynamicEvent('random');
            this.lastEventTime = Date.now();
        }

        // Check for player-specific event triggers
        for (const [playerId, playerData] of this.playerActions.entries()) {
            if (Date.now() - playerData.lastSeen > 300000) continue; // Skip inactive players
            
            // Check for specific trigger conditions
            if (this.shouldTriggerPlayerEvent(playerData)) {
                console.log(`🎲 AI GM: Generating player-specific event for ${playerId}...`);
                await this.generateDynamicEvent('player_behavior', playerId);
                this.lastEventTime = Date.now();
                break; // One event at a time
            }
        }
    }

    // Determine if a player's behavior warrants a specific event
    shouldTriggerPlayerEvent(playerData) {
        const recentActions = playerData.actions.filter(a => Date.now() - a.timestamp < 180000); // Last 3 minutes
        
        // Lots of combat activity
        if (recentActions.filter(a => a.type.includes('attack') || a.type.includes('kill')).length >= 5) {
            return true;
        }
        
        // Extensive exploration
        if (recentActions.filter(a => a.type === 'move').length >= 10) {
            return true;
        }
        
        // New player (low total actions)
        if (playerData.totalActions <= 5 && playerData.level <= 2) {
            return true;
        }
        
        // Player hasn't had an event recently
        const recentPlayerEvents = this.eventHistory.filter(e => 
            Date.now() - e.timestamp < 600000 // Last 10 minutes
        );
        
        return recentPlayerEvents.length === 0 && Math.random() < 0.2;
    }

    // Manual event trigger from Claude terminal
    async triggerManualEvent(eventType, params = {}) {
        console.log(`🎲 AI GM: Manual event triggered - ${eventType}`);
        
        const context = this.gatherWorldContext();
        const event = await this.generateDynamicEvent(eventType, params.targetPlayer);
        
        if (event) {
            return {
                success: true,
                event: {
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    rarity: event.rarity
                }
            };
        }
        
        return { success: false, error: 'Failed to generate event' };
    }

    // Get current world state for display
    getWorldState() {
        return {
            ...this.worldState,
            active_events: Array.from(this.worldState.active_events.values()),
            recent_events: this.eventHistory.slice(-10),
            player_count: Array.from(this.playerActions.values())
                .filter(p => Date.now() - p.lastSeen < 300000).length
        };
    }

    // Update world danger level based on events
    adjustDangerLevel(change) {
        this.worldState.danger_level = Math.max(1, Math.min(10, this.worldState.danger_level + change));
        console.log(`🎲 AI GM: Danger level adjusted to ${this.worldState.danger_level}/10`);
        
        // Broadcast danger level change
        this.io.emit('worldStateChange', {
            type: 'danger_level',
            value: this.worldState.danger_level
        });
    }

    // Clean up old player data
    cleanupInactivePlayers() {
        const cutoff = Date.now() - 1800000; // 30 minutes
        let cleaned = 0;
        
        for (const [playerId, playerData] of this.playerActions.entries()) {
            if (playerData.lastSeen < cutoff) {
                this.playerActions.delete(playerId);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🎲 AI GM: Cleaned up ${cleaned} inactive players`);
        }
    }
}

module.exports = AIGameMaster;