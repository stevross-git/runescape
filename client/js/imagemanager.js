class ImageManager {
    constructor() {
        this.images = new Map();
        this.loadPromises = new Map();
        this.loaded = false;
        this.totalImages = 0;
        this.loadedImages = 0;
        
        // Define all game images
        this.imageDefinitions = {
            // Ground tiles
            'grass': 'assets/tiles/grass.png',
            'grass1': 'assets/tiles/grass1.png',
            'grass2': 'assets/tiles/grass2.png',
            'grass3': 'assets/tiles/grass3.png',
            'dirt': 'assets/tiles/dirt.png',
            'path': 'assets/tiles/path.png',
            'stone': 'assets/tiles/stone.png',
            'water': 'assets/tiles/water.png',
            'sand': 'assets/tiles/sand.png',
            'mud': 'assets/tiles/mud.png',
            
            // Trees and resources
            'tree_oak': 'assets/resources/tree_oak.png',
            'tree_willow': 'assets/resources/tree_willow.png',
            'tree_maple': 'assets/resources/tree_maple.png',
            'tree_yew': 'assets/resources/tree_yew.png',
            'stump': 'assets/resources/stump.png',
            
            // Mining rocks
            'rock_copper': 'assets/resources/rock_copper.png',
            'rock_tin': 'assets/resources/rock_tin.png',
            'rock_iron': 'assets/resources/rock_iron.png',
            'rock_coal': 'assets/resources/rock_coal.png',
            'rock_gold': 'assets/resources/rock_gold.png',
            'rock_depleted': 'assets/resources/rock_depleted.png',
            
            // NPCs
            'npc_goblin': 'assets/npcs/goblin.png',
            'npc_shopkeeper': 'assets/npcs/shopkeeper.png',
            'npc_banker': 'assets/npcs/banker.png',
            'npc_quest_giver': 'assets/npcs/quest_giver.png',
            
            // Player sprites
            'player_male': 'assets/player/male.png',
            'player_male_walking': 'assets/player/male_walking.png',
            'player_female': 'assets/player/female.png',
            
            // UI elements (removed - not needed for basic functionality)
            
            // Items
            'item_sword': 'assets/items/sword.png',
            'item_axe': 'assets/items/axe.png',
            'item_pickaxe': 'assets/items/pickaxe.png',
            'item_bread': 'assets/items/bread.png',
            'item_coins': 'assets/items/coins.png',
            
            // Effects
            'fire': 'assets/effects/fire.png',
            
            // Buildings
            'bank': 'assets/buildings/bank.png',
            'general_store': 'assets/buildings/general_store.png',
            'house': 'assets/buildings/house.png',
            'magic_shop': 'assets/buildings/magic_shop.png',
            'well': 'assets/buildings/well.png',
            'fence': 'assets/buildings/fence.png',
            
            // Building Interiors
            'bank_interior': 'assets/interiors/bank_interior.png',
            'general_store_interior': 'assets/interiors/general_store_interior.png',
            'house_interior': 'assets/interiors/house_interior.png',
            'magic_shop_interior': 'assets/interiors/magic_shop_interior.png'
        };
    }

    async loadAllImages() {
        console.log('Starting image loading...');
        
        this.totalImages = Object.keys(this.imageDefinitions).length;
        const loadPromises = [];

        for (const [key, path] of Object.entries(this.imageDefinitions)) {
            loadPromises.push(this.loadImage(key, path));
        }

        try {
            await Promise.all(loadPromises);
            this.loaded = true;
            console.log(`Successfully loaded ${this.loadedImages}/${this.totalImages} images`);
            return true;
        } catch (error) {
            console.error('Failed to load some images:', error);
            return false;
        }
    }

    loadImage(key, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.images.set(key, img);
                this.loadedImages++;
                console.log(`Loaded: ${key} (${this.loadedImages}/${this.totalImages})`);
                resolve(img);
            };
            
            img.onerror = () => {
                // Create fallback colored rectangle for missing images
                const canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
                const ctx = canvas.getContext('2d');
                
                
                // Different colors for different types
                const fallbackColors = {
                    'grass': '#228B22',
                    'dirt': '#8B4513',
                    'stone': '#696969',
                    'water': '#4169E1',
                    'tree_oak': '#228B22',
                    'tree_willow': '#90EE90',
                    'tree_maple': '#FF6347',
                    'tree_yew': '#2F4F4F',
                    'stump': '#8B4513',
                    'rock_copper': '#CD853F',
                    'rock_tin': '#C0C0C0',
                    'rock_iron': '#A0A0A0',
                    'rock_coal': '#2F2F2F',
                    'rock_gold': '#FFD700',
                    'npc_goblin': '#8B0000',
                    'npc_shopkeeper': '#4B0082',
                    'npc_banker': '#000080',
                    'npc_quest_giver': '#8B4513',
                    'player_male': '#0000FF',
                    'player_female': '#FF1493',
                    'fire': '#FF4500',
                    'bank': '#FFD700',
                    'general_store': '#8B4513',
                    'house': '#D2B48C',
                    'magic_shop': '#9932CC',
                    'well': '#708090',
                    'fence': '#8B4513'
                };
                
                ctx.fillStyle = fallbackColors[key] || '#808080';
                ctx.fillRect(0, 0, 32, 32);
                
                // Add border
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(0, 0, 32, 32);
                
                // Add text label for debugging
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(key.split('_')[0], 16, 20);
                
                this.images.set(key, canvas);
                this.loadedImages++;
                console.warn(`Using fallback for missing image: ${path} - Check if file exists`);
                resolve(canvas);
            };
            
            img.src = path;
        });
    }

    getImage(key, variant = 1) {
        // Try to get the exact image with variant
        const variantKey = variant > 1 ? `${key}_${variant}` : key;
        let image = this.images.get(variantKey);
        
        if (image) {
            return image;
        }
        
        // Try to get base image without variant
        image = this.images.get(key);
        if (image) {
            return image;
        }
        
        // Try to load from world builder assets dynamically
        this.loadWorldBuilderImage(key, variant);
        
        // Return placeholder for now
        return this.createPlaceholder(key);
    }
    
    async loadWorldBuilderImage(tileType, variant = 1) {
        const worldBuilderPaths = {
            // Terrain
            'grass': 'assets/world_builder/terrain/grass',
            'dirt': 'assets/world_builder/terrain/dirt', 
            'stone': 'assets/world_builder/terrain/stone',
            'water': 'assets/world_builder/terrain/water',
            'sand': 'assets/world_builder/terrain/sand',
            'mud': 'assets/world_builder/terrain/mud',
            'cobblestone': 'assets/world_builder/terrain/cobblestone',
            
            // Buildings
            'house_small': 'assets/world_builder/buildings/house_small',
            'house_large': 'assets/world_builder/buildings/house_large',
            'castle': 'assets/world_builder/buildings/castle',
            'church': 'assets/world_builder/buildings/church',
            'inn': 'assets/world_builder/buildings/inn',
            'hut': 'assets/world_builder/buildings/hut',
            
            // Trees
            'tree_oak': 'assets/world_builder/trees/tree_oak',
            'tree_normal': 'assets/world_builder/trees/tree_normal',
            'tree_palm': 'assets/world_builder/trees/tree_palm',
            'tree_dead': 'assets/world_builder/trees/tree_dead',
            
            // Rocks  
            'rock_iron': 'assets/world_builder/rocks/rock_iron',
            'rock_coal': 'assets/world_builder/rocks/rock_coal',
            'rock_gold': 'assets/world_builder/rocks/rock_gold'
        };
        
        const basePath = worldBuilderPaths[tileType];
        if (basePath) {
            const imagePath = `${basePath}/${variant}.png`;
            const variantKey = variant > 1 ? `${tileType}_${variant}` : tileType;
            
            // Don't reload if already loading or loaded
            if (this.loadPromises.has(variantKey)) {
                return this.loadPromises.get(variantKey);
            }
            
            const promise = this.loadImage(variantKey, imagePath);
            this.loadPromises.set(variantKey, promise);
            return promise;
        }
    }
    
    createPlaceholder(key) {
        // Create a simple colored canvas as placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Different colors for different tile types
        const colors = {
            'grass': '#228B22',
            'dirt': '#8B4513', 
            'stone': '#708090',
            'water': '#4169E1',
            'sand': '#F4A460',
            'tree_oak': '#8B4513',
            'rock_iron': '#696969'
        };
        
        ctx.fillStyle = colors[key] || '#666666';
        ctx.fillRect(0, 0, 32, 32);
        
        return canvas;
    }

    hasImage(key) {
        return this.images.has(key);
    }

    drawImage(ctx, key, x, y, width = null, height = null) {
        const image = this.getImage(key);
        if (image) {
            if (width && height) {
                ctx.drawImage(image, x, y, width, height);
            } else {
                ctx.drawImage(image, x, y);
            }
            return true;
        }
        return false;
    }

    // Utility method to create tiled backgrounds
    drawTiledBackground(ctx, key, startX, startY, endX, endY, tileSize = 32) {
        const image = this.getImage(key);
        if (!image) return false;

        for (let x = startX; x < endX; x += tileSize) {
            for (let y = startY; y < endY; y += tileSize) {
                ctx.drawImage(image, x, y, tileSize, tileSize);
            }
        }
        return true;
    }

    getLoadingProgress() {
        return {
            loaded: this.loadedImages,
            total: this.totalImages,
            percentage: Math.round((this.loadedImages / this.totalImages) * 100)
        };
    }

    isLoaded() {
        return this.loaded;
    }

    // Method to preload critical images first
    async loadCriticalImages() {
        const criticalImages = [
            'grass', 'dirt', 'player_male', 'player_male_walking', 'npc_goblin', 'tree_oak', 'rock_copper'
        ];

        const promises = criticalImages.map(key => {
            if (this.imageDefinitions[key]) {
                return this.loadImage(key, this.imageDefinitions[key]);
            }
        }).filter(Boolean);

        try {
            await Promise.all(promises);
            console.log('Critical images loaded');
            return true;
        } catch (error) {
            console.error('Failed to load critical images:', error);
            return false;
        }
    }
}

// Global image manager instance
const imageManager = new ImageManager();