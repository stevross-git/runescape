// Enhanced RuneScape World Builder
class RuneScapeWorldBuilder {
    constructor() {
        this.canvas = document.getElementById('worldCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.tileSize = 16;
        this.worldWidth = 150;
        this.worldHeight = 100;
        
        this.currentTool = 'paint';
        this.selectedType = 'grass';
        this.brushSize = 1;
        this.showGrid = true;
        this.tilesPlaced = 0;
        
        this.camera = { x: 0, y: 0 };
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        
        // Image cache for tile sprites
        this.imageCache = {};
        this.imagesLoaded = 0;
        this.totalImages = 0;
        
        // World data - 2D array of tiles
        this.worldData = [];
        this.initializeWorld();
        
        // Define multi-tile building sizes (in tiles) - must be before setupEventListeners
        this.buildingSizes = this.getBuildingSizes();
        
        this.setupEventListeners();
        this.loadTileImages();
        this.render(); // Initial render with emojis while images load
        
        // Generate RuneScape-specific assets
        this.generateRuneScapeAssets();
    }
    
    initializeWorld() {
        this.worldData = [];
        for (let y = 0; y < this.worldHeight; y++) {
            this.worldData[y] = [];
            for (let x = 0; x < this.worldWidth; x++) {
                this.worldData[y][x] = {
                    type: 'grass',
                    name: '',
                    properties: {},
                    monsters: [],
                    spawns: [],
                    npcs: [],
                    items: []
                };
            }
        }
        this.tilesPlaced = 0;
        this.updateStatus();
        console.log(`World initialized: ${this.worldWidth}x${this.worldHeight} tiles`);
    }
    
    loadTileImages() {
        // List of all tile types that have images
        const tileTypes = [
            'grass', 'dirt', 'stone', 'cobblestone', 'water', 'sand', 'mud', 'snow',
            'bank', 'general_store', 'magic_shop', 'weapon_shop', 'armor_shop', 'food_shop', 'rune_shop', 'archery_shop',
            'house_small', 'house_large', 'castle', 'tower_wizard', 'church', 'inn', 'windmill', 'lighthouse',
            'tree_normal', 'tree_oak', 'tree_willow', 'tree_maple', 'tree_yew', 'tree_magic', 'tree_palm', 'tree_dead',
            'rock_copper', 'rock_tin', 'rock_iron', 'rock_coal', 'rock_gold', 'rock_mithril', 'rock_adamant', 'rock_rune',
            'fishing_spot', 'furnace', 'anvil', 'altar', 'spinning_wheel', 'pottery_wheel', 'loom', 'cooking_range',
            'well', 'fence_wood', 'fence_stone', 'gate_wood', 'gate_metal', 'chest', 'statue', 'bridge'
        ];
        
        this.totalImages = tileTypes.length;
        
        tileTypes.forEach(type => {
            const img = new Image();
            img.onload = () => {
                this.imagesLoaded++;
                console.log(`Loaded image: ${type} (${this.imagesLoaded}/${this.totalImages})`);
                this.updateLoadingStatus();
                if (this.imagesLoaded === this.totalImages) {
                    console.log('All tile images loaded successfully! Re-rendering...');
                    this.render(); // Re-render once all images are loaded
                }
            };
            img.onerror = () => {
                this.imagesLoaded++;
                console.warn(`Failed to load image for tile type: ${type} at path: assets/world_builder/${type}.png`);
                this.updateLoadingStatus();
            };
            img.src = `assets/world_builder/${type}.png`;
            this.imageCache[type] = img;
            console.log(`Loading image: ${type} from ${img.src}`);
        });
    }
    
    setupEventListeners() {
        // Tool buttons
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.tool-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
            });
        });
        
        // Tile selection
        document.querySelectorAll('.tile-btn[data-type]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.tile-btn.selected').classList.remove('selected');
                btn.classList.add('selected');
                this.selectedType = btn.dataset.type;
                document.getElementById('selectedType').textContent = this.selectedType;
                
                // Show/hide configuration panels based on tile type
                this.updateConfigPanels();
            });
        });
        
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        
        // Brush size
        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            document.getElementById('brushSizeDisplay').textContent = this.brushSize;
        });
        
        // Grid toggle
        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.showGrid = e.target.checked;
            this.render();
        });
        
        // World settings
        document.getElementById('worldWidth').addEventListener('change', (e) => {
            this.worldWidth = parseInt(e.target.value);
            this.initializeWorld();
            this.render();
        });
        
        document.getElementById('worldHeight').addEventListener('change', (e) => {
            this.worldHeight = parseInt(e.target.value);
            this.initializeWorld();
            this.render();
        });
        
        document.getElementById('tileSize').addEventListener('change', (e) => {
            this.tileSize = parseInt(e.target.value);
            this.render();
        });
    }
    
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
            // Right click or Ctrl+click for panning
            this.isDragging = true;
            this.lastMousePos = { x: mouseX, y: mouseY };
            this.canvas.style.cursor = 'move';
        } else if (e.button === 0) {
            // Left click for painting
            this.paint(mouseX, mouseY);
        }
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Update mouse position display
        const worldX = Math.floor((mouseX + this.camera.x) / this.tileSize);
        const worldY = Math.floor((mouseY + this.camera.y) / this.tileSize);
        
        document.getElementById('mouseX').textContent = mouseX + this.camera.x;
        document.getElementById('mouseY').textContent = mouseY + this.camera.y;
        document.getElementById('gridX').textContent = worldX;
        document.getElementById('gridY').textContent = worldY;
        document.getElementById('coordsDisplay').textContent = `${worldX}, ${worldY}`;
        
        if (this.isDragging) {
            const deltaX = mouseX - this.lastMousePos.x;
            const deltaY = mouseY - this.lastMousePos.y;
            this.camera.x -= deltaX;
            this.camera.y -= deltaY;
            this.lastMousePos = { x: mouseX, y: mouseY };
            this.render();
        } else if (e.buttons === 1) {
            // Left mouse button held down
            this.paint(mouseX, mouseY);
        }
    }
    
    onMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'crosshair';
    }
    
    onWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.tileSize = Math.max(4, Math.min(64, this.tileSize * zoomFactor));
        document.getElementById('tileSize').value = Math.round(this.tileSize);
        this.render();
    }
    
    paint(mouseX, mouseY) {
        const worldX = Math.floor((mouseX + this.camera.x) / this.tileSize);
        const worldY = Math.floor((mouseY + this.camera.y) / this.tileSize);
        
        if (worldX < 0 || worldX >= this.worldWidth || worldY < 0 || worldY >= this.worldHeight) {
            return;
        }
        
        let tilesChanged = 0;
        
        if (this.currentTool === 'paint') {
            // Check if this is a multi-tile building
            const buildingSize = this.buildingSizes && this.buildingSizes[this.selectedType];
            
            if (buildingSize && (buildingSize.width > 1.1 || buildingSize.height > 1.1)) {
                // Place multi-tile building
                const buildingWidth = Math.ceil(buildingSize.width);
                const buildingHeight = Math.ceil(buildingSize.height);
                
                // Check if we have enough space and no existing buildings
                let canPlace = true;
                for (let dx = 0; dx < buildingWidth; dx++) {
                    for (let dy = 0; dy < buildingHeight; dy++) {
                        const x = worldX + dx;
                        const y = worldY + dy;
                        if (x >= this.worldWidth || y >= this.worldHeight) {
                            canPlace = false;
                            break;
                        }
                        // Check if there's already a building here
                        if (this.worldData[y] && this.worldData[y][x] && 
                            this.worldData[y][x].type !== 'grass' && 
                            !['dirt', 'water', 'sand', 'mud', 'stone', 'cobblestone', 'snow', 'path', 'lava'].includes(this.worldData[y][x].type)) {
                            canPlace = false;
                            break;
                        }
                    }
                    if (!canPlace) break;
                }
                
                if (canPlace) {
                    // Place the building (only set the main tile as the building type)
                    if (this.worldData[worldY][worldX].type !== this.selectedType) {
                        this.worldData[worldY][worldX].type = this.selectedType;
                        tilesChanged++;
                    }
                    
                    // Mark surrounding tiles as occupied to prevent overlapping buildings
                    for (let dx = 0; dx < buildingWidth; dx++) {
                        for (let dy = 0; dy < buildingHeight; dy++) {
                            const x = worldX + dx;
                            const y = worldY + dy;
                            if (x < this.worldWidth && y < this.worldHeight) {
                                if (dx === 0 && dy === 0) {
                                    // Main tile gets the building type
                                    continue;
                                } else {
                                    // Surrounding tiles get marked as occupied
                                    this.worldData[y][x].properties = this.worldData[y][x].properties || {};
                                    this.worldData[y][x].properties.occupiedBy = `${this.selectedType}_${worldX}_${worldY}`;
                                    this.worldData[y][x].properties.buildingTile = true;
                                }
                            }
                        }
                    }
                }
            } else {
                // Regular single-tile or brush painting
                for (let dx = -Math.floor(this.brushSize/2); dx <= Math.floor(this.brushSize/2); dx++) {
                    for (let dy = -Math.floor(this.brushSize/2); dy <= Math.floor(this.brushSize/2); dy++) {
                        const x = worldX + dx;
                        const y = worldY + dy;
                        if (x >= 0 && x < this.worldWidth && y >= 0 && y < this.worldHeight) {
                            if (this.worldData[y][x].type !== this.selectedType) {
                                this.worldData[y][x].type = this.selectedType;
                                tilesChanged++;
                            }
                        }
                    }
                }
            }
        } else if (this.currentTool === 'erase') {
            for (let dx = -Math.floor(this.brushSize/2); dx <= Math.floor(this.brushSize/2); dx++) {
                for (let dy = -Math.floor(this.brushSize/2); dy <= Math.floor(this.brushSize/2); dy++) {
                    const x = worldX + dx;
                    const y = worldY + dy;
                    if (x >= 0 && x < this.worldWidth && y >= 0 && y < this.worldHeight) {
                        if (this.worldData[y][x].type !== 'grass') {
                            this.worldData[y][x].type = 'grass';
                            tilesChanged++;
                        }
                    }
                }
            }
        } else if (this.currentTool === 'fill') {
            const oldType = this.worldData[worldY][worldX].type;
            tilesChanged = this.floodFill(worldX, worldY, oldType, this.selectedType);
        }
        
        if (tilesChanged > 0) {
            this.tilesPlaced += tilesChanged;
            this.updateStatus();
            this.render();
        }
    }
    
    floodFill(x, y, oldType, newType) {
        if (x < 0 || x >= this.worldWidth || y < 0 || y >= this.worldHeight) return 0;
        if (this.worldData[y][x].type !== oldType || oldType === newType) return 0;
        
        this.worldData[y][x].type = newType;
        let count = 1;
        
        count += this.floodFill(x + 1, y, oldType, newType);
        count += this.floodFill(x - 1, y, oldType, newType);
        count += this.floodFill(x, y + 1, oldType, newType);
        count += this.floodFill(x, y - 1, oldType, newType);
        
        return count;
    }
    
    render() {
        // Clear canvas with RuneScape-style background
        this.ctx.fillStyle = '#228B22'; // Default grass green background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const startX = Math.floor(this.camera.x / this.tileSize);
        const startY = Math.floor(this.camera.y / this.tileSize);
        const endX = Math.min(this.worldWidth, startX + Math.ceil(this.canvas.width / this.tileSize) + 1);
        const endY = Math.min(this.worldHeight, startY + Math.ceil(this.canvas.height / this.tileSize) + 1);
        
        // Draw tiles
        for (let y = Math.max(0, startY); y < endY; y++) {
            for (let x = Math.max(0, startX); x < endX; x++) {
                const tile = this.worldData[y][x];
                if (!tile) continue; // Skip if tile doesn't exist
                
                const screenX = x * this.tileSize - this.camera.x;
                const screenY = y * this.tileSize - this.camera.y;
                
                // Get tile color and symbol
                const color = this.getTileColor(tile.type);
                const symbol = this.getTileSymbol(tile.type);
                
                // Determine if this tile type should have a background or be transparent
                const terrainTypes = ['grass', 'dirt', 'stone', 'cobblestone', 'water', 'sand', 'mud', 'snow', 'path', 'lava'];
                const shouldDrawBackground = terrainTypes.includes(tile.type);
                
                // Get building size for this tile type
                const buildingSize = this.buildingSizes && this.buildingSizes[tile.type];
                const renderWidth = buildingSize ? buildingSize.width * this.tileSize : this.tileSize;
                const renderHeight = buildingSize ? buildingSize.height * this.tileSize : this.tileSize;
                
                
                // For terrain tiles, always draw background
                if (shouldDrawBackground) {
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                }
                
                // Try to draw actual image on top if available
                const image = this.imageCache[tile.type];
                if (image && image.complete && this.tileSize >= 8) {
                    // Draw the actual PNG image at correct multi-tile size
                    this.ctx.drawImage(image, screenX, screenY, renderWidth, renderHeight);
                } else if (!shouldDrawBackground) {
                    // For non-terrain tiles without image, draw colored background
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                }
                
                // Add subtle border for definition (use appropriate size)
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.lineWidth = 1;
                if (buildingSize && (image && image.complete)) {
                    // For multi-tile buildings with images, draw border around full building
                    this.ctx.strokeRect(screenX, screenY, renderWidth, renderHeight);
                } else {
                    // For single tiles or buildings without images, draw single tile border
                    this.ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
                }
                
                // Draw symbol for larger tiles (if no image or as backup)
                if (this.tileSize >= 12 && (!image || !image.complete)) {
                    this.ctx.fillStyle = this.getSymbolColor(tile.type);
                    this.ctx.font = `${Math.min(this.tileSize * 0.6, 20)}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(symbol, screenX + this.tileSize/2, screenY + this.tileSize * 0.7);
                }
            }
        }
        
        // Draw grid
        if (this.showGrid && this.tileSize >= 8) {
            this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
            this.ctx.lineWidth = 1;
            
            for (let x = Math.max(0, startX); x <= endX; x++) {
                const screenX = x * this.tileSize - this.camera.x;
                this.ctx.beginPath();
                this.ctx.moveTo(screenX, 0);
                this.ctx.lineTo(screenX, this.canvas.height);
                this.ctx.stroke();
            }
            
            for (let y = Math.max(0, startY); y <= endY; y++) {
                const screenY = y * this.tileSize - this.camera.y;
                this.ctx.beginPath();
                this.ctx.moveTo(0, screenY);
                this.ctx.lineTo(this.canvas.width, screenY);
                this.ctx.stroke();
            }
        }
    }
    
    getTileColor(type) {
        const colors = {
            // Terrain
            grass: '#228B22',
            dirt: '#8B4513',
            stone: '#696969',
            cobblestone: '#A0A0A0',
            water: '#4169E1',
            sand: '#F4A460',
            mud: '#654321',
            snow: '#FFFAFA',
            
            // Banks & Shops
            bank: '#FFD700',
            general_store: '#8B4513',
            magic_shop: '#9932CC',
            weapon_shop: '#CD853F',
            armor_shop: '#A0A0A0',
            food_shop: '#FFB6C1',
            rune_shop: '#4169E1',
            archery_shop: '#228B22',
            
            // Buildings
            house_small: '#D2B48C',
            house_large: '#CD853F',
            castle: '#696969',
            tower_wizard: '#9932CC',
            church: '#F5DEB3',
            inn: '#8B4513',
            windmill: '#F4A460',
            lighthouse: '#FFFFFF',
            
            // Trees
            tree_normal: '#228B22',
            tree_oak: '#8FBC8F',
            tree_willow: '#90EE90',
            tree_maple: '#FF6347',
            tree_yew: '#2F4F4F',
            tree_magic: '#9932CC',
            tree_palm: '#32CD32',
            tree_dead: '#696969',
            
            // Mining
            rock_copper: '#CD853F',
            rock_tin: '#C0C0C0',
            rock_iron: '#A0A0A0',
            rock_coal: '#2F2F2F',
            rock_gold: '#FFD700',
            rock_mithril: '#4169E1',
            rock_adamant: '#90EE90',
            rock_rune: '#40E0D0',
            
            // Skills
            fishing_spot: '#4169E1',
            furnace: '#FF4500',
            anvil: '#2F2F2F',
            altar: '#9932CC',
            spinning_wheel: '#DEB887',
            pottery_wheel: '#CD853F',
            loom: '#8B4513',
            cooking_range: '#FF6347',
            
            // Objects
            well: '#708090',
            fence_wood: '#8B4513',
            fence_stone: '#696969',
            gate_wood: '#654321',
            gate_metal: '#A0A0A0',
            chest: '#8B4513',
            statue: '#D3D3D3',
            bridge: '#8B4513',
            
            // Low Level Monsters
            monster_rat: '#8B4513',
            monster_goblin: '#8B0000',
            monster_imp: '#8B008B',
            monster_spider: '#2F2F2F',
            monster_chicken: '#FFFF00',
            monster_cow: '#FFFFFF',
            monster_sheep: '#F5F5DC',
            monster_frog: '#228B22',
            
            // Medium Level Monsters
            monster_skeleton: '#F5F5DC',
            monster_zombie: '#556B2F',
            monster_guard: '#4169E1',
            monster_knight: '#C0C0C0',
            monster_bandit: '#8B4513',
            monster_barbarian: '#CD853F',
            monster_wizard: '#9932CC',
            monster_dwarf: '#B8860B',
            
            // High Level Monsters
            monster_dragon_green: '#228B22',
            monster_dragon_red: '#DC143C',
            monster_dragon_black: '#2F2F2F',
            monster_demon: '#8B0000',
            monster_giant: '#A0522D',
            monster_troll: '#696969',
            monster_ogre: '#8FBC8F',
            monster_lich: '#483D8B',
            
            // Boss Monsters
            monster_king_black_dragon: '#000000',
            monster_chaos_elemental: '#9932CC',
            monster_barrows_brother: '#2F4F4F',
            monster_jad: '#FF4500',
            monster_godwars_boss: '#FFD700',
            monster_kraken: '#4682B4',
            monster_corp_beast: '#2F2F2F',
            monster_wilderness_boss: '#8B0000',
            
            // Spawn Points
            spawn_single: '#FFD700',
            spawn_multi: '#FFA500',
            spawn_boss: '#FF4500',
            spawn_safe_zone: '#32CD32',
            spawn_player: '#00BFFF',
            spawn_respawn: '#9932CC',
            spawn_teleport: '#40E0D0',
            spawn_dungeon: '#2F4F4F',
            
            // Shop NPCs
            npc_banker: '#FFD700',
            npc_shopkeeper: '#8B4513',
            npc_weapon_trader: '#CD853F',
            npc_armor_trader: '#A0A0A0',
            npc_magic_trader: '#9932CC',
            npc_food_trader: '#FFB6C1',
            npc_rune_trader: '#4169E1',
            npc_archery_trader: '#228B22',
            
            // Quest NPCs
            npc_quest_giver: '#FFD700',
            npc_quest_helper: '#32CD32',
            npc_sage: '#9932CC',
            npc_oracle: '#FF69B4',
            npc_librarian: '#8B4513',
            npc_researcher: '#4682B4',
            npc_archaeologist: '#CD853F',
            npc_explorer: '#228B22',
            
            // Skill NPCs
            npc_combat_trainer: '#DC143C',
            npc_magic_trainer: '#9932CC',
            npc_smithing_trainer: '#2F2F2F',
            npc_crafting_trainer: '#DEB887',
            npc_mining_trainer: '#696969',
            npc_fishing_trainer: '#4169E1',
            npc_cooking_trainer: '#FF6347',
            npc_prayer_trainer: '#FFD700',
            
            // Authority NPCs
            npc_king: '#FFD700',
            npc_duke: '#4169E1',
            npc_guard_captain: '#C0C0C0',
            npc_judge: '#8B4513',
            npc_tax_collector: '#B8860B',
            npc_herald: '#9932CC',
            npc_diplomat: '#4682B4',
            npc_mayor: '#228B22',
            
            // Civilian NPCs
            npc_citizen: '#F5DEB3',
            npc_farmer: '#228B22',
            npc_fisherman: '#4169E1',
            npc_miner: '#696969',
            npc_blacksmith: '#2F2F2F',
            npc_merchant: '#B8860B',
            npc_bard: '#9932CC',
            npc_child: '#FFB6C1'
        };
        return colors[type] || '#888888';
    }
    
    getTileSymbol(type) {
        const symbols = {
            // Terrain
            grass: '🌱',
            dirt: '🟫',
            stone: '⬜',
            cobblestone: '🧱',
            water: '🌊',
            sand: '🟨',
            mud: '🟤',
            snow: '❄️',
            
            // Banks & Shops
            bank: '🏦',
            general_store: '🏪',
            magic_shop: '🔮',
            weapon_shop: '⚔️',
            armor_shop: '🛡️',
            food_shop: '🍞',
            rune_shop: '🔷',
            archery_shop: '🏹',
            
            // Buildings
            house_small: '🏠',
            house_large: '🏘️',
            castle: '🏰',
            tower_wizard: '🗼',
            church: '⛪',
            inn: '🍺',
            windmill: '🌾',
            lighthouse: '🗼',
            
            // Trees
            tree_normal: '🌳',
            tree_oak: '🌳',
            tree_willow: '🌿',
            tree_maple: '🍁',
            tree_yew: '🌲',
            tree_magic: '🌳',
            tree_palm: '🌴',
            tree_dead: '🌳',
            
            // Mining
            rock_copper: '🪨',
            rock_tin: '🪨',
            rock_iron: '🪨',
            rock_coal: '⚫',
            rock_gold: '🟡',
            rock_mithril: '🔵',
            rock_adamant: '🟢',
            rock_rune: '🔷',
            
            // Skills
            fishing_spot: '🎣',
            furnace: '🔥',
            anvil: '⚒️',
            altar: '⛩️',
            spinning_wheel: '🎡',
            pottery_wheel: '🏺',
            loom: '🧵',
            cooking_range: '🍳',
            
            // Objects
            well: '⚫',
            fence_wood: '🚧',
            fence_stone: '🧱',
            gate_wood: '🚪',
            gate_metal: '🚪',
            chest: '📦',
            statue: '🗿',
            bridge: '🌉',
            
            // Low Level Monsters
            monster_rat: '🐀',
            monster_goblin: '👹',
            monster_imp: '👺',
            monster_spider: '🕷️',
            monster_chicken: '🐔',
            monster_cow: '🐄',
            monster_sheep: '🐑',
            monster_frog: '🐸',
            
            // Medium Level Monsters
            monster_skeleton: '💀',
            monster_zombie: '🧟',
            monster_guard: '🛡️',
            monster_knight: '⚔️',
            monster_bandit: '🏴‍☠️',
            monster_barbarian: '🪓',
            monster_wizard: '🧙',
            monster_dwarf: '⛏️',
            
            // High Level Monsters
            monster_dragon_green: '🐉',
            monster_dragon_red: '🐲',
            monster_dragon_black: '🖤',
            monster_demon: '😈',
            monster_giant: '🦣',
            monster_troll: '👹',
            monster_ogre: '👹',
            monster_lich: '☠️',
            
            // Boss Monsters
            monster_king_black_dragon: '👑',
            monster_chaos_elemental: '🌀',
            monster_barrows_brother: '⚰️',
            monster_jad: '🔥',
            monster_godwars_boss: '⚡',
            monster_kraken: '🐙',
            monster_corp_beast: '👹',
            monster_wilderness_boss: '💀',
            
            // Spawn Points
            spawn_single: '⭐',
            spawn_multi: '🎯',
            spawn_boss: '👑',
            spawn_safe_zone: '🛡️',
            spawn_player: '🏠',
            spawn_respawn: '🔄',
            spawn_teleport: '🌀',
            spawn_dungeon: '🕳️',
            
            // Shop NPCs
            npc_banker: '🏦',
            npc_shopkeeper: '🛒',
            npc_weapon_trader: '⚔️',
            npc_armor_trader: '🛡️',
            npc_magic_trader: '🔮',
            npc_food_trader: '🍞',
            npc_rune_trader: '🔷',
            npc_archery_trader: '🏹',
            
            // Quest NPCs
            npc_quest_giver: '❗',
            npc_quest_helper: '❓',
            npc_sage: '🧙‍♂️',
            npc_oracle: '🔮',
            npc_librarian: '📚',
            npc_researcher: '🔬',
            npc_archaeologist: '🏺',
            npc_explorer: '🗺️',
            
            // Skill NPCs
            npc_combat_trainer: '⚔️',
            npc_magic_trainer: '🧙',
            npc_smithing_trainer: '⚒️',
            npc_crafting_trainer: '🧵',
            npc_mining_trainer: '⛏️',
            npc_fishing_trainer: '🎣',
            npc_cooking_trainer: '👨‍🍳',
            npc_prayer_trainer: '🙏',
            
            // Authority NPCs
            npc_king: '👑',
            npc_duke: '🎩',
            npc_guard_captain: '🛡️',
            npc_judge: '⚖️',
            npc_tax_collector: '💰',
            npc_herald: '📢',
            npc_diplomat: '📜',
            npc_mayor: '🏛️',
            
            // Civilian NPCs
            npc_citizen: '👤',
            npc_farmer: '👨‍🌾',
            npc_fisherman: '🎣',
            npc_miner: '⛏️',
            npc_blacksmith: '🔨',
            npc_merchant: '💼',
            npc_bard: '🎵',
            npc_child: '👶'
        };
        return symbols[type] || '?';
    }
    
    getSymbolColor(type) {
        // Return contrasting colors for symbols
        const darkTiles = ['water', 'rock_coal', 'anvil', 'mud', 'tree_yew'];
        return darkTiles.includes(type) ? '#FFFFFF' : '#000000';
    }
    
    updateStatus() {
        document.getElementById('tilesPlaced').textContent = this.tilesPlaced;
    }
    
    updateLoadingStatus() {
        const statusBar = document.querySelector('.status-bar');
        if (statusBar && this.totalImages > 0) {
            const percentage = Math.round((this.imagesLoaded / this.totalImages) * 100);
            if (this.imagesLoaded < this.totalImages) {
                statusBar.innerHTML = `🏰 RuneScape World Builder | Loading Images ${percentage}% (${this.imagesLoaded}/${this.totalImages}) | Tiles Placed: <span id="tilesPlaced">${this.tilesPlaced}</span>`;
            } else {
                statusBar.innerHTML = `🏰 RuneScape World Builder | Ready | Tiles Placed: <span id="tilesPlaced">${this.tilesPlaced}</span>`;
            }
        }
    }
    
    updateConfigPanels() {
        const monsterConfig = document.getElementById('monsterConfig');
        const spawnConfig = document.getElementById('spawnConfig');
        const npcConfig = document.getElementById('npcConfig');
        
        // Hide all config panels first
        monsterConfig.style.display = 'none';
        spawnConfig.style.display = 'none';
        npcConfig.style.display = 'none';
        
        // Show relevant config panel based on selected type
        if (this.selectedType.startsWith('monster_')) {
            monsterConfig.style.display = 'block';
            this.populateMonsterConfig();
        } else if (this.selectedType.startsWith('spawn_')) {
            spawnConfig.style.display = 'block';
            this.populateSpawnConfig();
        } else if (this.selectedType.startsWith('npc_')) {
            npcConfig.style.display = 'block';
            this.populateNPCConfig();
        }
    }
    
    populateMonsterConfig() {
        // Set default values based on monster type
        const monsterDefaults = {
            monster_rat: { level: 1, health: 5, respawn: 20, aggressive: false },
            monster_goblin: { level: 2, health: 15, respawn: 30, aggressive: true },
            monster_imp: { level: 7, health: 25, respawn: 45, aggressive: false },
            monster_spider: { level: 5, health: 20, respawn: 30, aggressive: true },
            monster_chicken: { level: 1, health: 3, respawn: 15, aggressive: false },
            monster_cow: { level: 2, health: 8, respawn: 25, aggressive: false },
            monster_sheep: { level: 1, health: 5, respawn: 20, aggressive: false },
            monster_frog: { level: 3, health: 12, respawn: 25, aggressive: false },
            
            monster_skeleton: { level: 15, health: 45, respawn: 60, aggressive: true },
            monster_zombie: { level: 18, health: 55, respawn: 75, aggressive: true },
            monster_guard: { level: 21, health: 65, respawn: 90, aggressive: false },
            monster_knight: { level: 25, health: 80, respawn: 120, aggressive: false },
            monster_bandit: { level: 20, health: 60, respawn: 90, aggressive: true },
            monster_barbarian: { level: 30, health: 90, respawn: 120, aggressive: true },
            monster_wizard: { level: 35, health: 70, respawn: 150, aggressive: true },
            monster_dwarf: { level: 28, health: 85, respawn: 110, aggressive: false },
            
            monster_dragon_green: { level: 79, health: 200, respawn: 300, aggressive: true },
            monster_dragon_red: { level: 152, health: 500, respawn: 600, aggressive: true },
            monster_dragon_black: { level: 227, health: 750, respawn: 900, aggressive: true },
            monster_demon: { level: 85, health: 220, respawn: 360, aggressive: true },
            monster_giant: { level: 67, health: 180, respawn: 240, aggressive: true },
            monster_troll: { level: 69, health: 190, respawn: 270, aggressive: true },
            monster_ogre: { level: 53, health: 150, respawn: 200, aggressive: true },
            monster_lich: { level: 95, health: 280, respawn: 450, aggressive: true },
            
            monster_king_black_dragon: { level: 276, health: 1500, respawn: 1800, aggressive: true },
            monster_chaos_elemental: { level: 305, health: 2000, respawn: 2400, aggressive: true },
            monster_barrows_brother: { level: 115, health: 450, respawn: 900, aggressive: true },
            monster_jad: { level: 702, health: 4000, respawn: 3600, aggressive: true },
            monster_godwars_boss: { level: 596, health: 5000, respawn: 7200, aggressive: true },
            monster_kraken: { level: 291, health: 2500, respawn: 1800, aggressive: true },
            monster_corp_beast: { level: 785, health: 8000, respawn: 10800, aggressive: true },
            monster_wilderness_boss: { level: 350, health: 3000, respawn: 3600, aggressive: true }
        };
        
        const defaults = monsterDefaults[this.selectedType] || { level: 1, health: 10, respawn: 30, aggressive: false };
        
        document.getElementById('monsterType').value = this.selectedType;
        document.getElementById('combatLevel').value = defaults.level;
        document.getElementById('maxHealth').value = defaults.health;
        document.getElementById('respawnTime').value = defaults.respawn;
        document.getElementById('aggressiveMonster').checked = defaults.aggressive;
    }
    
    populateSpawnConfig() {
        // Set default values based on spawn type
        const spawnDefaults = {
            spawn_single: { maxSpawned: 1, interval: 30 },
            spawn_multi: { maxSpawned: 5, interval: 45 },
            spawn_boss: { maxSpawned: 1, interval: 300 },
            spawn_safe_zone: { maxSpawned: 0, interval: 0 },
            spawn_player: { maxSpawned: 0, interval: 0 },
            spawn_respawn: { maxSpawned: 0, interval: 0 }
        };
        
        const defaults = spawnDefaults[this.selectedType] || { maxSpawned: 1, interval: 30 };
        
        document.getElementById('spawnType').value = this.selectedType.replace('spawn_', '');
        document.getElementById('maxSpawned').value = defaults.maxSpawned;
        document.getElementById('spawnInterval').value = defaults.interval;
    }
    
    populateNPCConfig() {
        // Set default values based on NPC type
        const npcDefaults = {
            // Shop NPCs
            npc_banker: { name: 'Bank Teller', type: 'shopkeeper', shop: 'bank', level: 0, dialogue: 'Welcome to the bank! How can I help you today?' },
            npc_shopkeeper: { name: 'Shop Owner', type: 'shopkeeper', shop: 'general', level: 0, dialogue: 'Welcome to my shop! Take a look around.' },
            npc_weapon_trader: { name: 'Weapon Trader', type: 'shopkeeper', shop: 'weapons', level: 5, dialogue: 'Fine weapons for sale! Perfect for any adventurer.' },
            npc_armor_trader: { name: 'Armor Trader', type: 'shopkeeper', shop: 'armor', level: 5, dialogue: 'Quality armor to keep you safe in battle!' },
            npc_magic_trader: { name: 'Magic Trader', type: 'shopkeeper', shop: 'magic', level: 10, dialogue: 'Magical items and mystical artifacts await!' },
            npc_food_trader: { name: 'Food Trader', type: 'shopkeeper', shop: 'food', level: 0, dialogue: 'Fresh food and supplies for your journey!' },
            npc_rune_trader: { name: 'Rune Trader', type: 'shopkeeper', shop: 'runes', level: 15, dialogue: 'Powerful runes for your magical needs.' },
            npc_archery_trader: { name: 'Archery Trader', type: 'shopkeeper', shop: 'archery', level: 3, dialogue: 'Bows, arrows, and archery supplies!' },
            
            // Quest NPCs
            npc_quest_giver: { name: 'Quest Giver', type: 'quest', shop: '', level: 20, dialogue: 'I have an important task for you, adventurer!' },
            npc_quest_helper: { name: 'Quest Helper', type: 'quest', shop: '', level: 5, dialogue: 'Need help with your quest? I might have some advice.' },
            npc_sage: { name: 'Wise Sage', type: 'quest', shop: '', level: 50, dialogue: 'Seek knowledge, young one, and you shall find wisdom.' },
            npc_oracle: { name: 'Oracle', type: 'quest', shop: '', level: 80, dialogue: 'The fates whisper of great things in your future...' },
            npc_librarian: { name: 'Librarian', type: 'quest', shop: '', level: 10, dialogue: 'Knowledge is power. What would you like to learn?' },
            npc_researcher: { name: 'Researcher', type: 'quest', shop: '', level: 25, dialogue: 'My research has uncovered some interesting findings...' },
            npc_archaeologist: { name: 'Archaeologist', type: 'quest', shop: '', level: 30, dialogue: 'Ancient artifacts hold many secrets!' },
            npc_explorer: { name: 'Explorer', type: 'quest', shop: '', level: 15, dialogue: 'I\'ve seen many lands in my travels. Want to hear some stories?' },
            
            // Skill NPCs
            npc_combat_trainer: { name: 'Combat Trainer', type: 'trainer', skill: 'attack', level: 40, dialogue: 'Train hard and become a mighty warrior!' },
            npc_magic_trainer: { name: 'Magic Trainer', type: 'trainer', skill: 'magic', level: 50, dialogue: 'Magic flows through all things. Let me teach you.' },
            npc_smithing_trainer: { name: 'Smithing Trainer', type: 'trainer', skill: 'smithing', level: 35, dialogue: 'The forge awaits! Learn to craft mighty weapons and armor.' },
            npc_crafting_trainer: { name: 'Crafting Trainer', type: 'trainer', skill: 'crafting', level: 30, dialogue: 'Crafting is an art. Let me show you the techniques.' },
            npc_mining_trainer: { name: 'Mining Trainer', type: 'trainer', skill: 'mining', level: 25, dialogue: 'The earth holds many treasures. Learn to find them!' },
            npc_fishing_trainer: { name: 'Fishing Trainer', type: 'trainer', skill: 'fishing', level: 20, dialogue: 'Patience and skill - that\'s what fishing is about.' },
            npc_cooking_trainer: { name: 'Cooking Trainer', type: 'trainer', skill: 'cooking', level: 15, dialogue: 'Good food restores the body and soul!' },
            npc_prayer_trainer: { name: 'Prayer Trainer', type: 'trainer', skill: 'prayer', level: 60, dialogue: 'Through prayer, find strength and protection.' },
            
            // Authority NPCs
            npc_king: { name: 'King', type: 'authority', shop: '', level: 200, dialogue: 'Welcome to my kingdom, noble adventurer.' },
            npc_duke: { name: 'Duke', type: 'authority', shop: '', level: 100, dialogue: 'I oversee this region in the name of the crown.' },
            npc_guard_captain: { name: 'Guard Captain', type: 'authority', shop: '', level: 75, dialogue: 'Keep the peace, citizen. The law is absolute here.' },
            npc_judge: { name: 'Judge', type: 'authority', shop: '', level: 50, dialogue: 'Justice must be served fairly and without bias.' },
            npc_tax_collector: { name: 'Tax Collector', type: 'authority', shop: '', level: 25, dialogue: 'Time to pay your taxes! The kingdom needs funding.' },
            npc_herald: { name: 'Herald', type: 'authority', shop: '', level: 15, dialogue: 'Hear ye! I bring news from across the realm!' },
            npc_diplomat: { name: 'Diplomat', type: 'authority', shop: '', level: 30, dialogue: 'Diplomacy solves more problems than warfare.' },
            npc_mayor: { name: 'Mayor', type: 'authority', shop: '', level: 40, dialogue: 'Welcome to our town! I hope you enjoy your stay.' },
            
            // Civilian NPCs
            npc_citizen: { name: 'Citizen', type: 'civilian', shop: '', level: 3, dialogue: 'Good day to you, traveler!' },
            npc_farmer: { name: 'Farmer', type: 'civilian', shop: '', level: 5, dialogue: 'The crops are growing well this season.' },
            npc_fisherman: { name: 'Fisherman', type: 'civilian', shop: '', level: 8, dialogue: 'The fish are biting well today!' },
            npc_miner: { name: 'Miner', type: 'civilian', shop: '', level: 12, dialogue: 'Found some good ore in the mines recently.' },
            npc_blacksmith: { name: 'Blacksmith', type: 'civilian', shop: '', level: 20, dialogue: 'Need something forged? I\'m your man!' },
            npc_merchant: { name: 'Merchant', type: 'civilian', shop: '', level: 10, dialogue: 'I travel far and wide selling my wares.' },
            npc_bard: { name: 'Bard', type: 'civilian', shop: '', level: 7, dialogue: 'Would you like to hear a tale or song?' },
            npc_child: { name: 'Child', type: 'civilian', shop: '', level: 1, dialogue: 'Hi there! Want to play?' }
        };
        
        const defaults = npcDefaults[this.selectedType] || { 
            name: 'NPC', 
            type: 'civilian', 
            shop: '', 
            skill: '', 
            level: 1, 
            dialogue: 'Hello there!' 
        };
        
        // Populate form fields
        document.getElementById('npcName').value = defaults.name;
        document.getElementById('npcType').value = defaults.type;
        document.getElementById('shopType').value = defaults.shop || '';
        document.getElementById('skillTaught').value = defaults.skill || '';
        document.getElementById('npcCombatLevel').value = defaults.level;
        document.getElementById('npcCanAttack').checked = defaults.level > 20;
        document.getElementById('npcRoaming').checked = ['civilian', 'authority'].includes(defaults.type);
        document.getElementById('npcHasQuest').checked = defaults.type === 'quest';
        document.getElementById('npcDialogue').value = defaults.dialogue;
    }
    
    getBuildingSizes() {
        // Define how many tiles each building should occupy (width, height)
        // Based on the original asset dimensions: 32px = 1 tile
        return {
            // Large Buildings (4x3 tiles)
            'castle': { width: 4, height: 3 },
            
            // Medium Buildings (3x2.5 tiles)
            'bank': { width: 3, height: 2.5 },
            'general_store': { width: 2.5, height: 2 },
            'magic_shop': { width: 2.25, height: 2 },
            'weapon_shop': { width: 2.4, height: 1.9 },
            'armor_shop': { width: 2.4, height: 1.9 },
            'food_shop': { width: 2, height: 1.5 },
            'rune_shop': { width: 2.1, height: 1.75 },
            'archery_shop': { width: 2.2, height: 1.6 },
            'church': { width: 3, height: 2.5 },
            'inn': { width: 2.75, height: 2 },
            
            // Small Buildings (2x1.5 tiles)
            'house_small': { width: 1.5, height: 1.1 },
            'house_large': { width: 2.5, height: 1.9 },
            
            // Tall Buildings (1.5x2.5 tiles)
            'tower_wizard': { width: 1.5, height: 2.5 },
            'lighthouse': { width: 1.25, height: 3 },
            'windmill': { width: 2, height: 2.5 },
            
            // Small Objects (1x0.75 tiles)
            'well': { width: 1, height: 0.75 },
            'chest': { width: 1, height: 0.75 },
            'statue': { width: 1, height: 1.5 },
            'anvil': { width: 1, height: 0.75 },
            'furnace': { width: 1.5, height: 1.25 },
            'altar': { width: 1.5, height: 1 },
            
            // Linear Objects
            'fence_wood': { width: 1, height: 0.5 },
            'fence_stone': { width: 1, height: 0.6 },
            'gate_wood': { width: 1.25, height: 0.75 },
            'gate_metal': { width: 1.25, height: 0.9 },
            'bridge': { width: 2, height: 0.5 },
            
            // Trees (varied sizes)
            'tree_normal': { width: 1.25, height: 1.25 },
            'tree_oak': { width: 1.5, height: 1.5 },
            'tree_willow': { width: 1.5, height: 1.5 },
            'tree_maple': { width: 1.5, height: 1.5 },
            'tree_yew': { width: 1.75, height: 1.75 },
            'tree_magic': { width: 2, height: 2 },
            'tree_palm': { width: 1.5, height: 2 },
            'tree_dead': { width: 1.25, height: 1.5 },
            
            // Mining Rocks
            'rock_copper': { width: 1, height: 0.75 },
            'rock_tin': { width: 1, height: 0.75 },
            'rock_iron': { width: 1, height: 0.75 },
            'rock_coal': { width: 1, height: 0.75 },
            'rock_gold': { width: 1, height: 0.75 },
            'rock_mithril': { width: 1.25, height: 1 },
            'rock_adamant': { width: 1.4, height: 1.1 },
            'rock_rune': { width: 1.5, height: 1.25 }
        };
    }
    
    generateRuneScapeAssets() {
        // Generate enhanced RuneScape assets with proper prompts
        console.log('Generating RuneScape-specific assets...');
        // This would be expanded to create actual images
    }
}

// RuneScape City Generation Functions
function generateLumbridge() {
    console.log('Generating Lumbridge...');
    const centerX = Math.floor(worldBuilder.worldWidth / 2);
    const centerY = Math.floor(worldBuilder.worldHeight / 2);
    
    // Create Lumbridge layout
    // Castle
    worldBuilder.worldData[centerY - 3][centerX] = { type: 'castle', name: 'Lumbridge Castle' };
    
    // General store
    worldBuilder.worldData[centerY + 2][centerX - 3] = { type: 'general_store', name: 'Lumbridge General Store' };
    
    // Bank
    worldBuilder.worldData[centerY + 1][centerX + 4] = { type: 'bank', name: 'Lumbridge Bank' };
    
    // Houses
    for (let i = -2; i <= 2; i++) {
        worldBuilder.worldData[centerY + 4][centerX + i] = { type: 'house_small', name: `House ${i + 3}` };
    }
    
    // Cobblestone paths
    for (let x = centerX - 5; x <= centerX + 5; x++) {
        worldBuilder.worldData[centerY][x] = { type: 'cobblestone', name: 'Main Road' };
        worldBuilder.worldData[centerY + 2][x] = { type: 'cobblestone', name: 'Main Road' };
    }
    
    // River
    for (let y = 0; y < worldBuilder.worldHeight; y++) {
        if (centerX + 8 < worldBuilder.worldWidth) {
            worldBuilder.worldData[y][centerX + 8] = { type: 'water', name: 'River Lum' };
        }
    }
    
    worldBuilder.render();
}

function generateVarrock() {
    console.log('Generating Varrock...');
    const centerX = Math.floor(worldBuilder.worldWidth / 2);
    const centerY = Math.floor(worldBuilder.worldHeight / 2);
    
    // Varrock Castle
    worldBuilder.worldData[centerY - 5][centerX] = { type: 'castle', name: 'Varrock Castle' };
    
    // East Bank
    worldBuilder.worldData[centerY][centerX + 6] = { type: 'bank', name: 'Varrock East Bank' };
    
    // West Bank
    worldBuilder.worldData[centerY][centerX - 6] = { type: 'bank', name: 'Varrock West Bank' };
    
    // Shops around Grand Exchange area
    worldBuilder.worldData[centerY + 3][centerX - 2] = { type: 'general_store', name: 'Varrock General Store' };
    worldBuilder.worldData[centerY + 3][centerX] = { type: 'weapon_shop', name: 'Varrock Sword Shop' };
    worldBuilder.worldData[centerY + 3][centerX + 2] = { type: 'armor_shop', name: 'Varrock Armour Shop' };
    
    // Create cobblestone city center
    for (let x = centerX - 3; x <= centerX + 3; x++) {
        for (let y = centerY + 1; y <= centerY + 4; y++) {
            if (!worldBuilder.worldData[y][x].type || worldBuilder.worldData[y][x].type === 'grass') {
                worldBuilder.worldData[y][x] = { type: 'cobblestone', name: 'Varrock Square' };
            }
        }
    }
    
    worldBuilder.render();
}

function generateFalador() {
    console.log('Generating Falador...');
    const centerX = Math.floor(worldBuilder.worldWidth / 2);
    const centerY = Math.floor(worldBuilder.worldHeight / 2);
    
    // White Knight Castle
    worldBuilder.worldData[centerY - 2][centerX] = { type: 'castle', name: 'White Knight Castle' };
    
    // Falador is known for being walled
    const wallRadius = 8;
    for (let angle = 0; angle < 360; angle += 10) {
        const x = centerX + Math.round(wallRadius * Math.cos(angle * Math.PI / 180));
        const y = centerY + Math.round(wallRadius * Math.sin(angle * Math.PI / 180));
        if (x >= 0 && x < worldBuilder.worldWidth && y >= 0 && y < worldBuilder.worldHeight) {
            worldBuilder.worldData[y][x] = { type: 'fence_stone', name: 'Falador Wall' };
        }
    }
    
    // Bank
    worldBuilder.worldData[centerY + 2][centerX - 2] = { type: 'bank', name: 'Falador Bank' };
    
    // Party Room
    worldBuilder.worldData[centerY][centerX + 3] = { type: 'house_large', name: 'Falador Party Room' };
    
    worldBuilder.render();
}

// Template Generation Functions
function generateWilderness() {
    console.log('Generating Wilderness...');
    // Fill with dangerous terrain and monsters
    for (let y = 0; y < Math.floor(worldBuilder.worldHeight / 3); y++) {
        for (let x = 0; x < worldBuilder.worldWidth; x++) {
            const rand = Math.random();
            let type = 'dirt';
            if (rand < 0.3) type = 'mud';
            else if (rand < 0.4) type = 'stone';
            else if (rand < 0.45) type = 'tree_dead';
            else if (rand < 0.48) type = 'monster_bandit';
            else if (rand < 0.49) type = 'monster_skeleton';
            else if (rand < 0.495) type = 'monster_wilderness_boss';
            
            worldBuilder.worldData[y][x] = { 
                type: type, 
                name: 'Wilderness',
                monsters: type.startsWith('monster_') ? [{
                    type: type,
                    quantity: type === 'monster_wilderness_boss' ? 1 : Math.floor(Math.random() * 3) + 1,
                    respawnTime: type === 'monster_wilderness_boss' ? 1800 : 60 + Math.random() * 120,
                    aggressive: true
                }] : [],
                spawns: [],
                items: []
            };
        }
    }
    worldBuilder.render();
}

function generateDesert() {
    console.log('Generating Desert...');
    for (let y = 0; y < worldBuilder.worldHeight; y++) {
        for (let x = 0; x < worldBuilder.worldWidth; x++) {
            const rand = Math.random();
            let type = 'sand';
            if (rand < 0.1) type = 'stone';
            else if (rand < 0.15) type = 'tree_palm';
            
            worldBuilder.worldData[y][x] = { type: type, name: 'Desert' };
        }
    }
    worldBuilder.render();
}

function generateIsland() {
    console.log('Generating Island...');
    const centerX = worldBuilder.worldWidth / 2;
    const centerY = worldBuilder.worldHeight / 2;
    const radius = Math.min(worldBuilder.worldWidth, worldBuilder.worldHeight) / 3;
    
    // Fill with water
    for (let y = 0; y < worldBuilder.worldHeight; y++) {
        for (let x = 0; x < worldBuilder.worldWidth; x++) {
            worldBuilder.worldData[y][x] = { type: 'water', name: 'Ocean' };
        }
    }
    
    // Create island
    for (let y = 0; y < worldBuilder.worldHeight; y++) {
        for (let x = 0; x < worldBuilder.worldWidth; x++) {
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            if (distance < radius) {
                let type = 'grass';
                if (distance > radius - 3) type = 'sand';
                else if (Math.random() < 0.1) type = 'tree_palm';
                
                worldBuilder.worldData[y][x] = { type: type, name: 'Island' };
            }
        }
    }
    worldBuilder.render();
}

function generateForest() {
    console.log('Generating Forest...');
    for (let y = 0; y < worldBuilder.worldHeight; y++) {
        for (let x = 0; x < worldBuilder.worldWidth; x++) {
            const rand = Math.random();
            let type = 'grass';
            if (rand < 0.3) type = 'tree_normal';
            else if (rand < 0.4) type = 'tree_oak';
            else if (rand < 0.45) type = 'tree_willow';
            else if (rand < 0.48) type = 'tree_yew';
            
            worldBuilder.worldData[y][x] = { type: type, name: 'Forest' };
        }
    }
    worldBuilder.render();
}

function populateMonsters() {
    console.log('Populating world with monsters...');
    let monstersAdded = 0;
    
    for (let y = 0; y < worldBuilder.worldHeight; y++) {
        for (let x = 0; x < worldBuilder.worldWidth; x++) {
            const tile = worldBuilder.worldData[y][x];
            const rand = Math.random();
            
            // Add monsters based on terrain type
            let monsterType = null;
            let spawnChance = 0;
            
            switch (tile.type) {
                case 'grass':
                    if (rand < 0.05) {
                        monsterType = Math.random() < 0.5 ? 'monster_cow' : 'monster_sheep';
                        spawnChance = 0.05;
                    }
                    break;
                case 'dirt':
                    if (rand < 0.08) {
                        monsterType = Math.random() < 0.7 ? 'monster_goblin' : 'monster_rat';
                        spawnChance = 0.08;
                    }
                    break;
                case 'mud':
                    if (rand < 0.1) {
                        monsterType = Math.random() < 0.6 ? 'monster_frog' : 'monster_spider';
                        spawnChance = 0.1;
                    }
                    break;
                case 'stone':
                    if (rand < 0.06) {
                        monsterType = Math.random() < 0.8 ? 'monster_dwarf' : 'monster_skeleton';
                        spawnChance = 0.06;
                    }
                    break;
            }
            
            // Add spawn points near trees for various monsters
            if (tile.type.startsWith('tree_') && rand < 0.03) {
                monsterType = 'spawn_multi';
                spawnChance = 0.03;
            }
            
            if (monsterType && Math.random() < spawnChance) {
                if (monsterType.startsWith('monster_')) {
                    worldBuilder.worldData[y][x] = {
                        type: monsterType,
                        name: `${monsterType.replace('monster_', '').replace('_', ' ')} spawn`,
                        monsters: [{
                            type: monsterType,
                            quantity: Math.floor(Math.random() * 3) + 1,
                            respawnTime: 30 + Math.random() * 60,
                            aggressive: ['monster_goblin', 'monster_spider', 'monster_skeleton'].includes(monsterType)
                        }],
                        spawns: [],
                        items: []
                    };
                } else if (monsterType.startsWith('spawn_')) {
                    worldBuilder.worldData[y][x] = {
                        type: monsterType,
                        name: 'Monster spawn point',
                        monsters: [],
                        spawns: [{
                            type: 'multi',
                            monster: 'monster_goblin',
                            maxSpawned: 3,
                            interval: 45,
                            areaSize: 3
                        }],
                        items: []
                    };
                }
                monstersAdded++;
            }
        }
    }
    
    worldBuilder.render();
    alert(`Added ${monstersAdded} monster spawns to the world!`);
}

// Global functions (same as before but with enhanced features)
function clearWorld() {
    if (confirm('Clear the entire world? This cannot be undone.')) {
        worldBuilder.initializeWorld();
        worldBuilder.render();
    }
}

function saveWorld() {
    const worldData = {
        version: '2.0',
        name: 'RuneScape World',
        width: worldBuilder.worldWidth,
        height: worldBuilder.worldHeight,
        tileSize: worldBuilder.tileSize,
        tiles: worldBuilder.worldData,
        metadata: {
            created: new Date().toISOString(),
            tilesPlaced: worldBuilder.tilesPlaced
        }
    };
    
    const dataStr = JSON.stringify(worldData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'runescape_world.json';
    link.click();
}

function loadWorld() {
    document.getElementById('fileInput').click();
}

function exportWorld() {
    saveWorld();
}

function exportImages() {
    alert('Image Export\n\nThis feature would:\n- Export each tile type as a separate image\n- Create a tilemap image\n- Generate a sprite atlas\n- Include all custom AI-generated assets');
}

function generateCode() {
    // Generate enhanced code with RuneScape features
    let code = `// Generated RuneScape World Data\n`;
    code += `const WORLD_CONFIG = {\n`;
    code += `  width: ${worldBuilder.worldWidth},\n`;
    code += `  height: ${worldBuilder.worldHeight},\n`;
    code += `  tileSize: ${worldBuilder.tileSize},\n`;
    code += `  version: '2.0',\n`;
    code += `  generated: '${new Date().toISOString()}'\n`;
    code += `};\n\n`;
    
    code += `const WORLD_TILES = [\n`;
    for (let y = 0; y < worldBuilder.worldHeight; y++) {
        code += '  [';
        for (let x = 0; x < worldBuilder.worldWidth; x++) {
            const tile = worldBuilder.worldData[y][x];
            code += `{type:"${tile.type}",name:"${tile.name || ''}"}`;
            if (x < worldBuilder.worldWidth - 1) code += ', ';
        }
        code += ']';
        if (y < worldBuilder.worldHeight - 1) code += ',';
        code += '\n';
    }
    code += '];\n\n';
    
    code += `// Export to global scope\nwindow.WORLD_CONFIG = WORLD_CONFIG;\nwindow.WORLD_TILES = WORLD_TILES;\n`;
    code += `console.log('RuneScape world loaded:', WORLD_CONFIG);`;
    
    const dataBlob = new Blob([code], {type: 'text/javascript'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'runescape_world_data.js';
    link.click();
}

// File input handler
document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const worldData = JSON.parse(e.target.result);
                worldBuilder.worldWidth = worldData.width;
                worldBuilder.worldHeight = worldData.height;
                worldBuilder.tileSize = worldData.tileSize;
                worldBuilder.worldData = worldData.tiles;
                worldBuilder.tilesPlaced = worldData.metadata?.tilesPlaced || 0;
                
                document.getElementById('worldWidth').value = worldData.width;
                document.getElementById('worldHeight').value = worldData.height;
                document.getElementById('tileSize').value = worldData.tileSize;
                
                worldBuilder.updateStatus();
                worldBuilder.render();
                
                console.log('Loaded world:', worldData.name || 'Unnamed World');
            } catch (error) {
                alert('Error loading world file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
});

// Prevent right-click context menu on canvas
document.getElementById('worldCanvas').addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Initialize enhanced world builder
let worldBuilder;
window.addEventListener('load', () => {
    console.log('🏰 Initializing RuneScape World Builder...');
    try {
        worldBuilder = new RuneScapeWorldBuilder();
        console.log('🏰 RuneScape World Builder initialized successfully!', worldBuilder);
    } catch (error) {
        console.error('Failed to initialize world builder:', error);
    }
});

// Monster and Spawn Configuration Functions
function applyMonsterConfig() {
    const config = {
        type: document.getElementById('monsterType').value,
        quantity: parseInt(document.getElementById('spawnQuantity').value),
        respawnTime: parseInt(document.getElementById('respawnTime').value),
        combatLevel: parseInt(document.getElementById('combatLevel').value),
        maxHealth: parseInt(document.getElementById('maxHealth').value),
        spawnRadius: parseInt(document.getElementById('spawnRadius').value),
        aggressive: document.getElementById('aggressiveMonster').checked,
        roaming: document.getElementById('roamingMonster').checked
    };
    
    console.log('Applied monster configuration:', config);
    alert(`Monster Configuration Applied!\n\nType: ${config.type.replace('monster_', '').replace('_', ' ')}\nLevel: ${config.combatLevel}\nHealth: ${config.maxHealth}\nRespawn: ${config.respawnTime}s\nQuantity: ${config.quantity}\nAggressive: ${config.aggressive ? 'Yes' : 'No'}`);
}

function applySpawnConfig() {
    const config = {
        type: document.getElementById('spawnType').value,
        monster: document.getElementById('spawnMonster').value,
        maxSpawned: parseInt(document.getElementById('maxSpawned').value),
        spawnInterval: parseInt(document.getElementById('spawnInterval').value),
        areaSize: parseInt(document.getElementById('spawnAreaSize').value)
    };
    
    console.log('Applied spawn configuration:', config);
    alert(`Spawn Point Configuration Applied!\n\nType: ${config.type}\nMonster: ${config.monster.replace('monster_', '').replace('_', ' ')}\nMax Spawned: ${config.maxSpawned}\nInterval: ${config.spawnInterval}s\nArea: ${config.areaSize}x${config.areaSize}`);
}

function applyNPCConfig() {
    const config = {
        name: document.getElementById('npcName').value || 'Unnamed NPC',
        type: document.getElementById('npcType').value,
        shopType: document.getElementById('shopType').value,
        skillTaught: document.getElementById('skillTaught').value,
        combatLevel: parseInt(document.getElementById('npcCombatLevel').value),
        canAttack: document.getElementById('npcCanAttack').checked,
        roaming: document.getElementById('npcRoaming').checked,
        hasQuest: document.getElementById('npcHasQuest').checked,
        dialogue: document.getElementById('npcDialogue').value || 'Hello there!'
    };
    
    console.log('Applied NPC configuration:', config);
    
    // Generate description based on NPC type and settings
    let description = `Name: ${config.name}\nType: ${config.type.charAt(0).toUpperCase() + config.type.slice(1)}`;
    
    if (config.shopType) {
        description += `\nShop: ${config.shopType.charAt(0).toUpperCase() + config.shopType.slice(1)}`;
    }
    
    if (config.skillTaught) {
        description += `\nTeaches: ${config.skillTaught.charAt(0).toUpperCase() + config.skillTaught.slice(1)}`;
    }
    
    if (config.combatLevel > 0) {
        description += `\nCombat Level: ${config.combatLevel}`;
    }
    
    description += `\nCan Attack: ${config.canAttack ? 'Yes' : 'No'}`;
    description += `\nCan Roam: ${config.roaming ? 'Yes' : 'No'}`;
    
    if (config.hasQuest) {
        description += `\nHas Quest: Yes`;
    }
    
    description += `\n\nDialogue: "${config.dialogue}"`;
    
    alert(`NPC Configuration Applied!\n\n${description}`);
}

// Add event listeners for range sliders
document.addEventListener('DOMContentLoaded', function() {
    const spawnRadiusSlider = document.getElementById('spawnRadius');
    const spawnRadiusDisplay = document.getElementById('spawnRadiusDisplay');
    
    if (spawnRadiusSlider && spawnRadiusDisplay) {
        spawnRadiusSlider.addEventListener('input', function() {
            spawnRadiusDisplay.textContent = this.value + ' tiles';
        });
    }
    
    const spawnAreaSlider = document.getElementById('spawnAreaSize');
    const spawnAreaDisplay = document.getElementById('spawnAreaDisplay');
    
    if (spawnAreaSlider && spawnAreaDisplay) {
        spawnAreaSlider.addEventListener('input', function() {
            spawnAreaDisplay.textContent = this.value + 'x' + this.value + ' tiles';
        });
    }
});