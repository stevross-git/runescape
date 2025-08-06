// AI-Powered World Generation System
const { generateImage } = require('./openai-config');
const { v4: uuidv4 } = require('uuid');

class WorldGenerator {
    constructor() {
        this.seed = Math.random();
        this.noiseCache = new Map();
    }

    // Simple noise function for terrain generation
    noise(x, y, scale = 1, octaves = 4) {
        const key = `${x}_${y}_${scale}_${octaves}`;
        if (this.noiseCache.has(key)) {
            return this.noiseCache.get(key);
        }

        let value = 0;
        let frequency = scale;
        let amplitude = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            value += this.simpleNoise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        const result = value / maxValue;
        this.noiseCache.set(key, result);
        return result;
    }

    // Simple pseudo-random noise function
    simpleNoise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }

    // Generate biome based on temperature and moisture
    getBiome(temperature, moisture) {
        if (temperature > 0.6 && moisture < 0.3) return 'desert';
        if (temperature > 0.4 && moisture > 0.7) return 'jungle';
        if (temperature < -0.3) return 'snow';
        if (moisture > 0.5) return 'forest';
        if (temperature > 0.2) return 'grassland';
        return 'plains';
    }

    // Get tile type based on biome and elevation
    getTileForBiome(biome, elevation, moisture) {
        const waterLevel = -0.2;
        
        if (elevation < waterLevel) return 'water';
        if (elevation < waterLevel + 0.1) return 'sand';
        
        switch (biome) {
            case 'desert':
                return elevation > 0.4 ? 'stone' : 'sand';
            case 'jungle':
                return elevation > 0.5 ? 'stone' : 'dirt';
            case 'snow':
                return elevation > 0.3 ? 'snow' : 'ice';
            case 'forest':
                return elevation > 0.4 ? 'stone' : 'dirt';
            case 'grassland':
                return elevation > 0.5 ? 'stone' : 'grass';
            default:
                return elevation > 0.3 ? 'grass' : 'dirt';
        }
    }

    // Generate a world based on AI parameters
    async generateWorld(params = {}) {
        const {
            width = 2000,
            height = 2000,
            tileSize = 32,
            theme = 'fantasy',
            biomes = ['forest', 'plains', 'desert', 'snow'],
            structures = ['village', 'castle', 'cave'],
            name = 'AI Generated World'
        } = params;

        console.log(`🌍 Generating world: ${name} (${width}x${height})`);
        
        const world = {
            id: uuidv4(),
            name,
            version: '2.0',
            width,
            height,
            tileSize,
            tiles: {},
            metadata: {
                creator: 'AI World Generator',
                theme,
                biomes,
                structures,
                generated: true,
                seed: this.seed
            }
        };

        const tilesX = Math.floor(width / tileSize);
        const tilesY = Math.floor(height / tileSize);
        
        console.log(`📊 Generating ${tilesX}x${tilesY} tiles...`);

        // Generate base terrain
        for (let x = 0; x < tilesX; x++) {
            for (let y = 0; y < tilesY; y++) {
                const elevation = this.noise(x * 0.01, y * 0.01, 0.01, 6);
                const temperature = this.noise(x * 0.005, y * 0.005, 0.005, 3);
                const moisture = this.noise(x * 0.008, y * 0.008, 0.008, 4);
                
                const biome = this.getBiome(temperature, moisture);
                const tileType = this.getTileForBiome(biome, elevation, moisture);
                
                world.tiles[`${x},${y}`] = {
                    type: tileType,
                    biome,
                    elevation: Math.round(elevation * 100) / 100,
                    temperature: Math.round(temperature * 100) / 100,
                    moisture: Math.round(moisture * 100) / 100
                };
            }
        }

        // Place structures intelligently
        await this.placeStructures(world, structures, tilesX, tilesY);

        console.log(`✅ World generation complete: ${Object.keys(world.tiles).length} tiles`);
        return world;
    }

    // Place structures based on terrain and biome
    async placeStructures(world, structures, tilesX, tilesY) {
        const structureCount = Math.min(structures.length * 3, 15); // Limit structures
        
        for (let i = 0; i < structureCount; i++) {
            const structure = structures[Math.floor(Math.random() * structures.length)];
            const attempts = 50;
            
            for (let attempt = 0; attempt < attempts; attempt++) {
                const x = Math.floor(Math.random() * (tilesX - 10)) + 5;
                const y = Math.floor(Math.random() * (tilesY - 10)) + 5;
                
                const tile = world.tiles[`${x},${y}`];
                if (!tile || tile.type === 'water' || tile.hasStructure) continue;
                
                // Check if this is a good location for this structure
                if (this.isValidStructureLocation(structure, tile, world, x, y)) {
                    await this.placeStructure(world, structure, x, y);
                    break;
                }
            }
        }
    }

    // Check if location is valid for structure type
    isValidStructureLocation(structure, tile, world, x, y) {
        switch (structure) {
            case 'village':
                return tile.biome === 'plains' || tile.biome === 'grassland';
            case 'castle':
                return tile.elevation > 0.2 && (tile.biome === 'plains' || tile.biome === 'forest');
            case 'cave':
                return tile.elevation > 0.3 && tile.biome !== 'desert';
            case 'tower':
                return tile.elevation > 0.4;
            case 'temple':
                return tile.biome === 'forest' || tile.biome === 'jungle';
            default:
                return tile.type !== 'water';
        }
    }

    // Place a structure at given coordinates
    async placeStructure(world, structureType, x, y) {
        const structureSize = this.getStructureSize(structureType);
        
        // Mark tiles as having structures
        for (let dx = 0; dx < structureSize.width; dx++) {
            for (let dy = 0; dy < structureSize.height; dy++) {
                const tileKey = `${x + dx},${y + dy}`;
                if (world.tiles[tileKey]) {
                    world.tiles[tileKey].hasStructure = true;
                    world.tiles[tileKey].structureType = structureType;
                }
            }
        }

        // Add to metadata for reference
        if (!world.metadata.placedStructures) {
            world.metadata.placedStructures = [];
        }
        
        world.metadata.placedStructures.push({
            type: structureType,
            x: x * world.tileSize,
            y: y * world.tileSize,
            width: structureSize.width * world.tileSize,
            height: structureSize.height * world.tileSize
        });

        console.log(`🏗️ Placed ${structureType} at (${x}, ${y})`);
    }

    // Get structure dimensions
    getStructureSize(structureType) {
        const sizes = {
            village: { width: 6, height: 6 },
            castle: { width: 8, height: 8 },
            cave: { width: 3, height: 3 },
            tower: { width: 2, height: 2 },
            temple: { width: 4, height: 4 },
            default: { width: 3, height: 3 }
        };
        
        return sizes[structureType] || sizes.default;
    }

    // Generate world from AI prompt
    async generateFromPrompt(prompt) {
        console.log(`🤖 Generating world from prompt: "${prompt}"`);
        
        // Parse prompt for parameters (simple keyword matching for now)
        const params = {
            theme: 'fantasy',
            biomes: [],
            structures: [],
            name: 'AI Generated World'
        };

        // Extract theme
        if (prompt.includes('medieval')) params.theme = 'medieval';
        if (prompt.includes('modern')) params.theme = 'modern';
        if (prompt.includes('post-apocalyptic')) params.theme = 'post-apocalyptic';
        if (prompt.includes('steampunk')) params.theme = 'steampunk';

        // Extract biomes
        if (prompt.includes('forest') || prompt.includes('woods')) params.biomes.push('forest');
        if (prompt.includes('desert')) params.biomes.push('desert');
        if (prompt.includes('snow') || prompt.includes('winter')) params.biomes.push('snow');
        if (prompt.includes('jungle')) params.biomes.push('jungle');
        if (prompt.includes('plains') || prompt.includes('grassland')) params.biomes.push('plains');

        // Extract structures
        if (prompt.includes('village') || prompt.includes('town')) params.structures.push('village');
        if (prompt.includes('castle') || prompt.includes('fortress')) params.structures.push('castle');
        if (prompt.includes('cave') || prompt.includes('dungeon')) params.structures.push('cave');
        if (prompt.includes('tower')) params.structures.push('tower');
        if (prompt.includes('temple') || prompt.includes('shrine')) params.structures.push('temple');

        // Default values if nothing specified
        if (params.biomes.length === 0) params.biomes = ['forest', 'plains', 'desert'];
        if (params.structures.length === 0) params.structures = ['village', 'cave'];

        // Extract world name if quoted
        const nameMatch = prompt.match(/"([^"]+)"/);
        if (nameMatch) {
            params.name = nameMatch[1];
        } else {
            // Generate name based on theme and biomes
            const themeNames = {
                fantasy: ['Mystical', 'Enchanted', 'Ancient'],
                medieval: ['Royal', 'Noble', 'Historic'],
                modern: ['New', 'Metro', 'Urban'],
                'post-apocalyptic': ['Wasteland', 'Ruins of', 'Lost'],
                steampunk: ['Clockwork', 'Steam-powered', 'Industrial']
            };
            
            const biomeNames = {
                forest: 'Woodlands',
                desert: 'Dunes',
                snow: 'Tundra',
                jungle: 'Wilds',
                plains: 'Fields'
            };
            
            const themeName = themeNames[params.theme] ? 
                themeNames[params.theme][Math.floor(Math.random() * themeNames[params.theme].length)] : 'Generated';
            const biomeName = params.biomes.length > 0 ? 
                biomeNames[params.biomes[0]] || 'Lands' : 'Realm';
                
            params.name = `${themeName} ${biomeName}`;
        }

        return await this.generateWorld(params);
    }

    // Reset noise cache and seed for new generation
    reset() {
        this.seed = Math.random();
        this.noiseCache.clear();
        console.log('🔄 World generator reset');
    }
}

module.exports = new WorldGenerator();