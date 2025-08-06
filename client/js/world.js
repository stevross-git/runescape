class World {
    constructor() {
        this.width = 2000;
        this.height = 2000;
        this.tileSize = 32;
        this.customWorldData = null;
        this.worldId = null;
        
        this.camera = {
            x: 0,
            y: 0
        };
        
        this.trees = [];
        this.rocks = [];
        this.fires = [];
        this.npcs = new Map();
        this.buildings = [];
        
        // PvP Areas (matching server-side definitions)
        this.pvpAreas = [
            {
                name: 'Wilderness',
                x1: 500, y1: 100,
                x2: 1500, y2: 400,
                level: 1,
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
        
        this.currentPvPArea = null;
        
        this.generateWorld();
    }

    // Get terrain type at a specific position
    getTerrainAt(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
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
        else if (y > this.height - 300 || (noise > 0.7 && y > 1200)) {
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

    generateTown() {
        // Create a town layout around spawn area (1000, 1000)
        const spawnX = 1000;
        const spawnY = 1000;
        
        // Town buildings layout
        const townBuildings = [
            { type: 'bank', x: spawnX - 80, y: spawnY - 60, width: 96, height: 80 },
            { type: 'general_store', x: spawnX + 40, y: spawnY - 50, width: 80, height: 64 },
            { type: 'house', x: spawnX - 120, y: spawnY + 40, width: 64, height: 48 },
            { type: 'house', x: spawnX + 80, y: spawnY + 30, width: 64, height: 48 },
            { type: 'magic_shop', x: spawnX - 40, y: spawnY + 60, width: 72, height: 64 },
            { type: 'well', x: spawnX + 10, y: spawnY - 10, width: 32, height: 24 }
        ];
        
        // Add buildings to the world
        this.buildings = townBuildings;
        
        console.log(`Generated town with ${this.buildings.length} buildings around spawn (${spawnX}, ${spawnY})`);
    }

    async loadCustomWorld(worldId) {
        try {
            const response = await fetch(`/api/worlds/${worldId}`);
            const worldData = await response.json();
            
            if (worldData && worldData.tiles) {
                this.customWorldData = worldData;
                this.worldId = worldId;
                this.width = worldData.width || 2000;
                this.height = worldData.height || 2000;
                this.tileSize = worldData.tileSize || 32;
                
                console.log(`✅ Loaded custom world: ${worldData.name}`);
                console.log(`🌍 World dimensions: ${this.width}x${this.height} pixels (${worldData.tilesX || '?'}x${worldData.tilesY || '?'} tiles)`);
                console.log(`📦 World data structure:`, Object.keys(worldData));
                return true;
            }
        } catch (error) {
            console.error('Failed to load custom world:', error);
        }
        return false;
    }
    
    generateWorld() {
        // Check if we should load a custom world
        const urlParams = new URLSearchParams(window.location.search);
        const worldId = urlParams.get('worldId');
        
        if (worldId) {
            console.log(`🌍 Loading custom world: ${worldId}`);
            this.loadCustomWorld(worldId).then(loaded => {
                if (loaded) {
                    console.log(`✅ Custom world loaded. Dimensions: ${this.width}x${this.height} (${this.width/this.tileSize}x${this.height/this.tileSize} tiles)`);
                    // Notify any listeners that the world has loaded
                    if (this.onWorldLoaded) {
                        console.log(`🔔 Calling onWorldLoaded callback...`);
                        this.onWorldLoaded();
                    } else {
                        console.warn(`⚠️ No onWorldLoaded callback registered!`);
                    }
                } else {
                    console.warn(`❌ Failed to load custom world, using default`);
                    // Fallback to default generation
                    this.generateDefaultWorld();
                }
            });
        } else {
            console.log(`🏞️ No worldId parameter found, generating default world`);
            this.generateDefaultWorld();
        }
    }
    
    generateDefaultWorld() {
        console.log(`🏗️ Generating default world with dimensions: ${this.width}x${this.height}`);
        // First, generate the town buildings around spawn area (1000, 1000)
        this.generateTown();
        
        // Generate trees only on appropriate terrain
        const treeTypes = [
            { type: 'oak', health: 80, maxHealth: 80, category: 'tree', emoji: '🌳' },
            { type: 'willow', health: 60, maxHealth: 60, category: 'tree', emoji: '🌲' },
            { type: 'maple', health: 120, maxHealth: 120, category: 'tree', emoji: '🍁' },
            { type: 'yew', health: 200, maxHealth: 200, category: 'tree', emoji: '🌲' }
        ];
        
        // Spawn trees with terrain checking
        let treeCount = 0;
        let attempts = 0;
        while (treeCount < 40 && attempts < 200) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const terrain = this.getTerrainAt(x, y);
            
            // Trees only spawn on grass, dirt, or mud
            if (terrain === 'grass' || terrain === 'dirt' || terrain === 'mud') {
                const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
                this.trees.push({
                    id: `tree_${treeCount}`,
                    x: x,
                    y: y,
                    ...treeType
                });
                treeCount++;
            }
            attempts++;
        }
        
        // Generate mining rocks only on appropriate terrain
        const rockTypes = [
            { type: 'copper', health: 30, maxHealth: 30 },
            { type: 'tin', health: 30, maxHealth: 30 },
            { type: 'iron', health: 50, maxHealth: 50 },
            { type: 'coal', health: 60, maxHealth: 60 },
            { type: 'gold', health: 80, maxHealth: 80 }
        ];
        
        // Spawn rocks with terrain checking
        let rockCount = 0;
        attempts = 0;
        while (rockCount < 25 && attempts < 150) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const terrain = this.getTerrainAt(x, y);
            
            // Rocks spawn on stone, dirt, or occasionally grass
            if (terrain === 'stone' || terrain === 'dirt' || (terrain === 'grass' && Math.random() < 0.3)) {
                const rockType = rockTypes[Math.floor(Math.random() * rockTypes.length)];
                this.rocks.push({
                    id: `rock_${rockCount}`,
                    x: x,
                    y: y,
                    ...rockType
                });
                rockCount++;
            }
            attempts++;
        }
        
        // Generate fishing spots only in water
        let fishingCount = 0;
        attempts = 0;
        while (fishingCount < 8 && attempts < 100) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const terrain = this.getTerrainAt(x, y);
            
            // Fishing spots only in water
            if (terrain === 'water') {
                this.trees.push({
                    id: `fishing_${fishingCount}`,
                    x: x,
                    y: y,
                    type: 'fishing',
                    health: 999,
                    maxHealth: 999,
                    category: 'fishing',
                    emoji: '🐟'
                });
                fishingCount++;
            }
            attempts++;
        }
        
        // Generate herb patches only on grass
        let herbCount = 0;
        attempts = 0;
        while (herbCount < 5 && attempts < 50) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const terrain = this.getTerrainAt(x, y);
            
            // Herbs only on grass
            if (terrain === 'grass') {
                this.trees.push({
                    id: `herb_${herbCount}`,
                    x: x,
                    y: y,
                    type: 'herbs',
                    health: 40,
                    maxHealth: 40,
                    category: 'farming',
                    emoji: '🌿'
                });
                herbCount++;
            }
            attempts++;
        }
        
        console.log(`Generated world: ${treeCount} trees, ${rockCount} rocks, ${fishingCount} fishing spots, ${herbCount} herb patches`);
    }

    updateCamera(playerX, playerY, canvasWidth, canvasHeight) {
        // Calculate desired camera position (center on player)
        const desiredCameraX = playerX - canvasWidth / 2;
        const desiredCameraY = playerY - canvasHeight / 2;
        
        // Calculate maximum camera positions
        const maxCameraX = Math.max(0, this.width - canvasWidth);
        const maxCameraY = Math.max(0, this.height - canvasHeight);
        
        // Store old camera position for debugging
        const oldCameraX = this.camera.x;
        const oldCameraY = this.camera.y;
        
        // Apply constraints
        this.camera.x = Math.max(0, Math.min(maxCameraX, desiredCameraX));
        this.camera.y = Math.max(0, Math.min(maxCameraY, desiredCameraY));
        
        // Minimal camera debug logging (only when camera actually moves)
        if (Math.abs(this.camera.x - oldCameraX) > 1 || Math.abs(this.camera.y - oldCameraY) > 1) {
            console.log(`📹 Camera moved to (${this.camera.x.toFixed(0)}, ${this.camera.y.toFixed(0)}) following player at (${playerX.toFixed(0)}, ${playerY.toFixed(0)})`);
        }
    }

    render(ctx) {
        this.renderGround(ctx);
        this.renderBuildings(ctx);
        this.renderPvPAreas(ctx);
        this.renderTrees(ctx);
        this.renderRocks(ctx);
        this.renderFires(ctx);
        this.renderNPCs(ctx);
    }

    renderGround(ctx) {
        const startX = Math.floor(this.camera.x / this.tileSize) * this.tileSize;
        const startY = Math.floor(this.camera.y / this.tileSize) * this.tileSize;
        const endX = startX + ctx.canvas.width + this.tileSize;
        const endY = startY + ctx.canvas.height + this.tileSize;

        for (let x = startX; x < endX; x += this.tileSize) {
            for (let y = startY; y < endY; y += this.tileSize) {
                const screenX = x - this.camera.x;
                const screenY = y - this.camera.y;
                
                let terrainType;
                const tileX = Math.floor(x / this.tileSize);
                const tileY = Math.floor(y / this.tileSize);
                
                // Check if we have custom world data
                let tileVariant = 1;
                if (this.customWorldData && this.customWorldData.tiles) {
                    let customTile = null;
                    
                    // Handle both 2D array format (from world builder) and object format
                    if (Array.isArray(this.customWorldData.tiles)) {
                        // 2D array format: tiles[y][x]
                        if (tileY >= 0 && tileY < this.customWorldData.tiles.length && 
                            tileX >= 0 && tileX < this.customWorldData.tiles[tileY].length) {
                            customTile = this.customWorldData.tiles[tileY][tileX];
                        }
                    } else {
                        // Object format: tiles["x,y"] (legacy)
                        const tileKey = `${tileX},${tileY}`;
                        customTile = this.customWorldData.tiles[tileKey];
                    }
                    
                    if (customTile && customTile.type) {
                        terrainType = customTile.type;
                        tileVariant = customTile.variant || 1;
                        
                        // Handle special tiles (monsters, resources, etc)
                        if (customTile.content || customTile.monsters || customTile.npcs) {
                            // These will be rendered separately
                        }
                    } else {
                        terrainType = 'grass'; // Default for empty tiles
                        tileVariant = 1;
                    }
                } else {
                    // Use default terrain generation
                    
                    // Use noise-like function for more natural terrain
                    const noise = Math.sin(tileX * 0.1) * Math.cos(tileY * 0.1) + Math.sin(tileX * 0.05) * 0.5;
                
                // Water areas (rivers, lakes)
                if (y < 150 || (y > 800 && y < 900 && x > 600 && x < 900)) {
                    terrainType = 'water';
                } 
                // Sandy beaches near water
                else if (y < 180 || (y > 770 && y < 810 && x > 570 && x < 930)) {
                    terrainType = 'sand';
                }
                // Mountain/rocky areas
                else if (y > this.height - 300 || (noise > 0.7 && y > 1200)) {
                    terrainType = 'stone';
                }
                // Muddy/swamp areas
                else if (x > 1400 && x < 1600 && y > 400 && y < 600) {
                    terrainType = 'mud';
                }
                // Paths between areas and town cobblestone
                else if (
                    // Main road
                    (x > 480 && x < 520 && y > 200 && y < 1800) ||
                    // Cross road
                    (y > 580 && y < 620 && x > 200 && x < 1800) ||
                    // Diagonal path
                    (Math.abs(x - y) < 40 && x > 300 && x < 800) ||
                    // Town area cobblestone (around spawn 1000, 1000)
                    (x > 850 && x < 1150 && y > 850 && y < 1150)
                ) {
                    terrainType = 'path';
                }
                // Dirt patches and areas
                else if (
                    // Random dirt patches
                    ((tileX * 7 + tileY * 13) % 31 === 0) ||
                    // Dirt areas near paths
                    ((x > 520 && x < 560 && y > 200 && y < 1800) ||
                     (y > 620 && y < 660 && x > 200 && x < 1800))
                ) {
                    terrainType = 'dirt';
                }
                // Grass with variation
                else {
                    // Use different grass variants for less repetition
                    const grassVariant = (tileX * 3 + tileY * 7) % 4;
                    if (grassVariant === 0 && imageManager.hasImage('grass1')) {
                        terrainType = 'grass1';
                    } else if (grassVariant === 1 && imageManager.hasImage('grass2')) {
                        terrainType = 'grass2';
                    } else if (grassVariant === 2 && imageManager.hasImage('grass3')) {
                        terrainType = 'grass3';
                    } else {
                        terrainType = 'grass';
                    }
                }
                }
                
                // Draw terrain image or fallback to color
                if (imageManager.isLoaded()) {
                    // Try to get image with variant, will handle loading dynamically
                    const image = imageManager.getImage(terrainType, tileVariant);
                    if (image && image.width) {
                        ctx.drawImage(image, screenX, screenY, this.tileSize, this.tileSize);
                    } else {
                        // Image is loading or failed, use fallback color
                        const fallbackColors = {
                            grass: '#228B22',
                            dirt: '#8B4513',
                            stone: '#696969',
                            water: '#4169E1',
                            sand: '#F4A460',
                            mud: '#654321',
                            cobblestone: '#778899'
                        };
                        ctx.fillStyle = fallbackColors[terrainType] || '#228B22';
                        ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                    }
                } else {
                    // Fallback colors
                    const fallbackColors = {
                        grass: '#228B22',
                        grass1: '#2E8B57',
                        grass2: '#3CB371',
                        grass3: '#228B22',
                        dirt: '#8B4513',
                        path: '#C4A484',
                        stone: '#696969',
                        water: '#4169E1',
                        sand: '#F4A460',
                        mud: '#654321'
                    };
                    ctx.fillStyle = fallbackColors[terrainType] || '#228B22';
                    ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                }
            }
        }
    }

    renderBuildings(ctx) {
        for (let building of this.buildings) {
            if (this.isOnScreen(building.x, building.y, ctx.canvas.width, ctx.canvas.height)) {
                const screenX = building.x - this.camera.x;
                const screenY = building.y - this.camera.y;
                
                // Try to render building image
                const imageKey = building.type;
                if (imageManager.isLoaded() && imageManager.hasImage(imageKey)) {
                    // Save current context state
                    ctx.save();
                    
                    // Ensure proper alpha blending for transparent images
                    ctx.globalCompositeOperation = 'source-over';
                    
                    // Draw the building image
                    imageManager.drawImage(ctx, imageKey, screenX, screenY, building.width, building.height);
                    
                    // Restore context state
                    ctx.restore();
                    
                    // Debug: Only log once per building type
                    if (!this._loggedBuildings) this._loggedBuildings = new Set();
                    if (!this._loggedBuildings.has(building.type)) {
                        console.log(`Successfully rendering building image: ${imageKey}`);
                        this._loggedBuildings.add(building.type);
                    }
                } else {
                    // Fallback to colored rectangles with labels
                    const buildingColors = {
                        'bank': '#FFD700',        // Gold
                        'general_store': '#8B4513', // Brown
                        'house': '#D2B48C',       // Tan
                        'magic_shop': '#9932CC',  // Purple
                        'well': '#708090'         // Gray
                    };
                    
                    ctx.fillStyle = buildingColors[building.type] || '#888888';
                    ctx.fillRect(screenX, screenY, building.width, building.height);
                    
                    // Building outline
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(screenX, screenY, building.width, building.height);
                    
                    // Building label
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 3;
                    
                    const centerX = screenX + building.width / 2;
                    const centerY = screenY + building.height / 2;
                    const label = building.type.replace('_', ' ').toUpperCase();
                    
                    ctx.strokeText(label, centerX, centerY);
                    ctx.fillText(label, centerX, centerY);
                }
                
                // Hover indicator for interactive buildings
                if (game && game.player && (building.type === 'bank' || building.type === 'general_store' || building.type === 'magic_shop' || building.type === 'house')) {
                    const buildingCenterX = building.x + building.width / 2;
                    const buildingCenterY = building.y + building.height / 2;
                    const distance = Math.sqrt((game.player.x - buildingCenterX) ** 2 + (game.player.y - buildingCenterY) ** 2);
                    
                    if (distance < 80) {
                        ctx.strokeStyle = '#FFFF00';
                        ctx.lineWidth = 3;
                        ctx.setLineDash([5, 5]);
                        ctx.strokeRect(screenX - 2, screenY - 2, building.width + 4, building.height + 4);
                        ctx.setLineDash([]);
                        
                        // Action text
                        ctx.fillStyle = '#FFFF00';
                        ctx.font = '14px Arial';
                        ctx.textAlign = 'center';
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 2;
                        
                        let actionText = 'Press ENTER';
                        let buildingText = '';
                        if (building.type === 'bank') buildingText = 'Bank';
                        else if (building.type === 'general_store') buildingText = 'General Store';
                        else if (building.type === 'magic_shop') buildingText = 'Magic Shop';
                        else if (building.type === 'house') buildingText = 'House';
                        
                        // Draw building name
                        ctx.font = '12px Arial';
                        ctx.strokeText(buildingText, screenX + building.width / 2, screenY - 25);
                        ctx.fillText(buildingText, screenX + building.width / 2, screenY - 25);
                        
                        // Draw action instruction
                        ctx.font = '10px Arial';
                        ctx.strokeText(actionText, screenX + building.width / 2, screenY - 10);
                        ctx.fillText(actionText, screenX + building.width / 2, screenY - 10);
                    }
                }
            }
        }
    }

    renderPvPAreas(ctx) {
        for (let area of this.pvpAreas) {
            // Check if the area is visible on screen
            const areaScreenX1 = area.x1 - this.camera.x;
            const areaScreenY1 = area.y1 - this.camera.y;
            const areaScreenX2 = area.x2 - this.camera.x;
            const areaScreenY2 = area.y2 - this.camera.y;
            
            // Only render if area intersects with screen
            if (areaScreenX2 >= 0 && areaScreenX1 <= ctx.canvas.width &&
                areaScreenY2 >= 0 && areaScreenY1 <= ctx.canvas.height) {
                
                // Draw PvP area background
                ctx.save();
                ctx.globalAlpha = 0.1;
                if (area.name === 'Wilderness') {
                    ctx.fillStyle = '#FF0000'; // Red tint for wilderness
                } else {
                    ctx.fillStyle = '#FF8800'; // Orange tint for arena
                }
                ctx.fillRect(areaScreenX1, areaScreenY1, 
                           area.x2 - area.x1, area.y2 - area.y1);
                ctx.restore();
                
                // Draw border
                ctx.strokeStyle = area.name === 'Wilderness' ? '#FF0000' : '#FF8800';
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 5]); // Dashed line
                ctx.strokeRect(areaScreenX1, areaScreenY1, 
                             area.x2 - area.x1, area.y2 - area.y1);
                ctx.setLineDash([]); // Reset to solid line
                
                // Draw area name
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                
                const centerX = areaScreenX1 + (area.x2 - area.x1) / 2;
                const centerY = areaScreenY1 + 25;
                
                ctx.strokeText(area.name.toUpperCase(), centerX, centerY);
                ctx.fillText(area.name.toUpperCase(), centerX, centerY);
                
                // Draw skull icon for danger
                ctx.font = '24px Arial';
                ctx.fillText('💀', centerX, centerY + 30);
            }
        }
    }

    renderTrees(ctx) {
        for (let resource of this.trees) {
            if (this.isOnScreen(resource.x, resource.y, ctx.canvas.width, ctx.canvas.height)) {
                const screenX = resource.x - this.camera.x;
                const screenY = resource.y - this.camera.y;
                
                // Render resource image or fallback to emoji
                if (resource.health > 0) {
                    const imageKey = `tree_${resource.type}`;
                    if (imageManager.isLoaded() && imageManager.hasImage(imageKey)) {
                        // Make trees bigger - 48x48 instead of 32x32
                        imageManager.drawImage(ctx, imageKey, screenX - 24, screenY - 24, 48, 48);
                    } else {
                        // Fallback to emoji
                        ctx.font = '64px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(resource.emoji, screenX, screenY + 20);
                    }
                    
                    // Add resource type label
                    ctx.fillStyle = '#FFFF00';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(resource.type, screenX, screenY + 25);
                } else {
                    // Show depleted resource
                    if (resource.category === 'tree') {
                        if (imageManager.isLoaded() && imageManager.hasImage('stump')) {
                            imageManager.drawImage(ctx, 'stump', screenX - 24, screenY - 24, 48, 48);
                        } else {
                            ctx.font = '48px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText('🟫', screenX, screenY + 15); // Brown stump
                        }
                    } else if (resource.category === 'fishing') {
                        ctx.font = '32px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('💭', screenX, screenY + 10); // Fish swam away
                    } else {
                        ctx.font = '32px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('💥', screenX, screenY + 10); // Generic depleted
                    }
                }
                
                // Health bar if damaged (skip for fishing spots)
                if (resource.health < resource.maxHealth && resource.health > 0 && resource.category !== 'fishing') {
                    const barWidth = 40;
                    const barHeight = 4;
                    const barX = screenX - barWidth/2;
                    const barY = screenY - 30;
                    
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(barX, barY, barWidth, barHeight);
                    ctx.fillStyle = '#00FF00';
                    ctx.fillRect(barX, barY, (resource.health / resource.maxHealth) * barWidth, barHeight);
                }
                
                // Hover indicator (when player is close)
                if (game && game.player) {
                    const distance = Math.sqrt((game.player.x - resource.x) ** 2 + (game.player.y - resource.y) ** 2);
                    if (distance < 60 && resource.health > 0) {
                        ctx.strokeStyle = '#FFFF00';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(screenX, screenY, 30, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        // Show action text based on resource type
                        const actionText = {
                            'tree': 'Chop',
                            'fishing': 'Fish',
                            'farming': 'Pick'
                        };
                        
                        ctx.fillStyle = '#FFFF00';
                        ctx.font = '12px Arial';
                        ctx.fillText(actionText[resource.category] || 'Gather', screenX, screenY - 35);
                    }
                }
            }
        }
    }

    renderRocks(ctx) {
        for (let rock of this.rocks) {
            if (this.isOnScreen(rock.x, rock.y, ctx.canvas.width, ctx.canvas.height)) {
                const screenX = rock.x - this.camera.x;
                const screenY = rock.y - this.camera.y;
                
                // Render rock image or fallback to emoji
                if (rock.health > 0) {
                    const imageKey = `rock_${rock.type}`;
                    if (imageManager.isLoaded() && imageManager.hasImage(imageKey)) {
                        imageManager.drawImage(ctx, imageKey, screenX - 16, screenY - 16, 32, 32);
                    } else {
                        // Fallback to emoji
                        ctx.font = '36px Arial';
                        ctx.textAlign = 'center';
                        
                        const rockEmojis = {
                            copper: '🟫', // Brown square for copper
                            tin: '⬜', // White square for tin
                            iron: '⬛', // Black square for iron
                            coal: '⚫', // Black circle for coal
                            gold: '🟨'  // Yellow square for gold
                        };
                        ctx.fillText(rockEmojis[rock.type] || '⚫', screenX, screenY + 12);
                    }
                    
                    // Add rock type label
                    ctx.fillStyle = '#FFFF00';
                    ctx.font = '8px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(rock.type, screenX, screenY + 25);
                } else {
                    // Depleted rock
                    if (imageManager.isLoaded() && imageManager.hasImage('rock_depleted')) {
                        imageManager.drawImage(ctx, 'rock_depleted', screenX - 16, screenY - 16, 32, 32);
                    } else {
                        ctx.font = '24px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('⚫', screenX, screenY + 8); // Empty black circle
                    }
                }
                
                // Health bar if damaged
                if (rock.health < rock.maxHealth && rock.health > 0) {
                    const barWidth = 30;
                    const barHeight = 4;
                    const barX = screenX - barWidth/2;
                    const barY = screenY - 25;
                    
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(barX, barY, barWidth, barHeight);
                    ctx.fillStyle = '#00FF00';
                    ctx.fillRect(barX, barY, (rock.health / rock.maxHealth) * barWidth, barHeight);
                }
                
                // Hover indicator for mining
                if (game && game.player) {
                    const distance = Math.sqrt((game.player.x - rock.x) ** 2 + (game.player.y - rock.y) ** 2);
                    if (distance < 60 && rock.health > 0) {
                        ctx.strokeStyle = '#FFFF00';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(screenX, screenY, 25, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        ctx.fillStyle = '#FFFF00';
                        ctx.font = '10px Arial';
                        ctx.fillText('Mine', screenX, screenY - 30);
                    }
                }
            }
        }
    }

    renderFires(ctx) {
        for (let fire of this.fires) {
            if (this.isOnScreen(fire.x, fire.y, ctx.canvas.width, ctx.canvas.height)) {
                const screenX = fire.x - this.camera.x;
                const screenY = fire.y - this.camera.y;
                
                if (fire.burnTime > 0) {
                    // Try to render fire image with animation
                    const flicker = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
                    ctx.globalAlpha = flicker;
                    
                    if (imageManager.isLoaded() && imageManager.hasImage('fire')) {
                        imageManager.drawImage(ctx, 'fire', screenX - 16, screenY - 16, 32, 32);
                    } else {
                        // Fallback to animated emoji
                        ctx.font = '32px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('🔥', screenX, screenY + 10);
                    }
                    
                    ctx.globalAlpha = 1;
                    
                    // Fire level indicator
                    ctx.fillStyle = '#FFFF00';
                    ctx.font = '8px Arial';
                    ctx.fillText(`Fire (${Math.ceil(fire.burnTime / 1000)}s)`, screenX, screenY + 30);
                } else {
                    // Cold ashes 
                    ctx.font = '24px Arial';
                    ctx.fillText('💨', screenX, screenY + 8);
                }
                
                // Hover indicator for cooking
                if (game && game.player && fire.burnTime > 0) {
                    const distance = Math.sqrt((game.player.x - fire.x) ** 2 + (game.player.y - fire.y) ** 2);
                    if (distance < 60) {
                        ctx.strokeStyle = '#FFFF00';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(screenX, screenY, 25, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        ctx.fillStyle = '#FFFF00';
                        ctx.font = '10px Arial';
                        ctx.fillText('Cook', screenX, screenY - 30);
                    }
                }
            }
        }
    }

    renderNPCs(ctx) {
        for (let npc of this.npcs.values()) {
            if (this.isOnScreen(npc.x, npc.y, ctx.canvas.width, ctx.canvas.height)) {
                const screenX = npc.x - this.camera.x;
                const screenY = npc.y - this.camera.y;
                
                // Skip dead NPCs
                if (npc.hp <= 0) continue;
                
                // Render goblin emoji instead of colored square
                ctx.font = '32px Arial';
                ctx.textAlign = 'center';
                
                // Try to render NPC image, fallback to emoji
                const imageKey = `npc_${npc.type}`;
                if (imageManager.isLoaded() && imageManager.hasImage(imageKey)) {
                    // Add glow effect for combat
                    if (npc.type === 'goblin' && npc.isInCombat) {
                        ctx.shadowColor = '#FF0000';
                        ctx.shadowBlur = 10;
                    }
                    
                    imageManager.drawImage(ctx, imageKey, screenX - 16, screenY - 16, 32, 32);
                    
                    // Reset shadow
                    ctx.shadowBlur = 0;
                } else {
                    // Fallback to emoji
                    if (npc.type === 'goblin') {
                        // Add red glow when in combat
                        if (npc.isInCombat) {
                            ctx.shadowColor = '#FF0000';
                            ctx.shadowBlur = 10;
                        }
                        
                        // Use goblin emoji
                        ctx.fillText('👹', screenX, screenY + 8);
                        
                        // Reset shadow
                        ctx.shadowBlur = 0;
                    } else if (npc.type === 'shopkeeper') {
                        // Shopkeeper appearance
                        ctx.fillText('🧙', screenX, screenY + 8);
                    } else if (npc.type === 'banker') {
                        // Banker appearance
                        ctx.fillText('🏦', screenX, screenY + 8);
                    } else if (npc.type === 'quest_giver') {
                        // Quest giver appearance
                        ctx.fillText('🧝', screenX, screenY + 8);
                    } else {
                        // Fallback for other NPC types
                        if (npc.isInCombat) {
                            ctx.fillStyle = '#FF4500'; // Orange-red when in combat
                        } else {
                            ctx.fillStyle = '#FF0000';
                        }
                        ctx.fillRect(screenX - 12, screenY - 12, 24, 24);
                    }
                }
                
                // Level text
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Lvl ${npc.level}`, screenX, screenY - 20);
                
                // Name
                ctx.fillStyle = npc.isInCombat ? '#FF0000' : '#FFFF00';
                ctx.font = '8px Arial';
                const displayName = npc.name || npc.type;
                ctx.fillText(displayName, screenX, screenY + 25);
                
                // Health bar (skip for shopkeepers)
                if (npc.hp < npc.maxHp && !npc.isShop) {
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(screenX - 12, screenY + 15, 24, 3);
                    ctx.fillStyle = '#00FF00';
                    ctx.fillRect(screenX - 12, screenY + 15, (npc.hp / npc.maxHp) * 24, 3);
                }
                
                // Combat indicator (skip for shopkeepers)
                if (npc.isInCombat && !npc.isShop) {
                    ctx.strokeStyle = '#FF0000';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 18, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                // Attack animation flash
                if (npc.attackAnimation && Date.now() - npc.attackAnimation < 300) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.fillRect(screenX - 15, screenY - 15, 30, 30);
                }
                
                // Hover indicator for clickable NPCs
                if (game && game.player) {
                    const distance = Math.sqrt((game.player.x - npc.x) ** 2 + (game.player.y - npc.y) ** 2);
                    if (distance < 80) {
                        ctx.strokeStyle = '#FFFF00';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        ctx.fillStyle = '#FFFF00';
                        ctx.font = '10px Arial';
                        
                        if (npc.type === 'shopkeeper') {
                            ctx.fillText('Shop', screenX, screenY - 30);
                        } else if (npc.type === 'banker') {
                            ctx.fillText('Bank', screenX, screenY - 30);
                        } else {
                            ctx.fillText('Attack', screenX, screenY - 30);
                        }
                    }
                }
            }
        }
    }

    isOnScreen(x, y, canvasWidth, canvasHeight) {
        return x >= this.camera.x - 50 && 
               x <= this.camera.x + canvasWidth + 50 && 
               y >= this.camera.y - 50 && 
               y <= this.camera.y + canvasHeight + 50;
    }

    getObjectAt(x, y, radius = 32) {
        for (let tree of this.trees) {
            const distance = Math.sqrt((tree.x - x) ** 2 + (tree.y - y) ** 2);
            if (distance <= radius) {
                return { type: 'tree', object: tree };
            }
        }
        
        for (let rock of this.rocks) {
            const distance = Math.sqrt((rock.x - x) ** 2 + (rock.y - y) ** 2);
            if (distance <= radius) {
                return { type: 'rock', object: rock };
            }
        }
        
        for (let fire of this.fires) {
            const distance = Math.sqrt((fire.x - x) ** 2 + (fire.y - y) ** 2);
            if (distance <= radius) {
                return { type: 'fire', object: fire };
            }
        }
        
        for (let npc of this.npcs.values()) {
            if (npc.hp > 0) {
                const distance = Math.sqrt((npc.x - x) ** 2 + (npc.y - y) ** 2);
                if (distance <= radius) {
                    return { type: 'npc', object: npc };
                }
            }
        }
        
        // Check for other players (for PvP)
        if (game && game.otherPlayers) {
            for (let player of game.otherPlayers.values()) {
                const distance = Math.sqrt((player.x - x) ** 2 + (player.y - y) ** 2);
                if (distance <= radius) {
                    return { type: 'player', object: player };
                }
            }
        }
        
        return null;
    }

    damageResource(data) {
        let resourceArray;
        
        if (data.type === 'tree') {
            resourceArray = this.trees;
        } else if (data.type === 'rock') {
            resourceArray = this.rocks;
        } else {
            return;
        }
        
        const resource = resourceArray.find(r => r.id === data.id);
        if (resource) {
            resource.health = Math.max(0, resource.health - data.damage);
            
            if (resource.health <= 0) {
                console.log(`${data.type} has been completely harvested!`);
                
                // Respawn after some time
                setTimeout(() => {
                    resource.health = resource.maxHealth;
                    console.log(`${data.type} has respawned!`);
                }, 30000); // 30 seconds respawn
            }
        }
    }

    updateNPCs(npcData) {
        // Update NPC positions from server
        this.npcs.clear();
        for (let npcInfo of npcData) {
            this.npcs.set(npcInfo.id, npcInfo);
        }
    }

    updateSingleNPC(npcData) {
        // Update a single NPC's data
        if (this.npcs.has(npcData.id)) {
            const npc = this.npcs.get(npcData.id);
            Object.assign(npc, npcData);
        }
    }

    showAttackAnimation(npcId, targetId) {
        // Add visual attack effect
        const npc = this.npcs.get(npcId);
        if (npc) {
            npc.attackAnimation = Date.now();
            setTimeout(() => {
                if (npc.attackAnimation) {
                    delete npc.attackAnimation;
                }
            }, 300);
        }
    }

    addFire(fireData) {
        this.fires.push({
            id: fireData.id,
            x: fireData.x,
            y: fireData.y,
            burnTime: fireData.burnTime || 60000, // 60 seconds default
            startTime: Date.now()
        });
    }

    updateFires() {
        const now = Date.now();
        this.fires = this.fires.filter(fire => {
            fire.burnTime = Math.max(0, fire.burnTime - 100); // Decrease burn time
            return fire.burnTime > 0 || (now - fire.startTime < 120000); // Keep ashes for 2 minutes
        });
    }
}