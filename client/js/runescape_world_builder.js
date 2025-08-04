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
        this.showEntryPoints = true;
        this.tilesPlaced = 0;
        
        // Test mode properties
        this.testMode = false;
        this.player = {
            x: 75, // Start in center of world
            y: 50,
            size: 12,
            speed: 2,
            color: '#FFD700'
        };
        this.keys = {};
        this.nearbyDoor = null;
        
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
        this.buildingEntryPoints = this.getBuildingEntryPoints();
        this.buildingInteriors = this.getBuildingInteriors();
        
        // Interior display state
        this.showingInterior = false;
        this.currentInterior = null;
        this.interiorImages = {};
        
        // Initialize game intelligence systems
        this.gameIntelligence = new GameIntelligence(this);
        this.npcAI = new NPCAISystem(this);
        this.questSystem = new QuestSystem(this);
        this.tradingSystem = new TradingSystem(this);
        this.openAI_NPCs = new OpenAI_NPCSystem(this);
        
        // Initialize auto-save system
        this.autoSave = new AutoSaveSystem(this);
        this.autoSave.startAutoSave();
        
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
            'house', 'house_small', 'house_large', 'castle', 'tower_wizard', 'church', 'inn', 'windmill', 'lighthouse',
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
        
        // Keyboard events for test mode
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
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
        
        // Handle interior interactions
        if (this.showingInterior && e.button === 0) {
            this.handleInteriorClick(mouseX, mouseY);
            return;
        }
        
        if (this.testMode) return; // Disable mouse controls in test mode
        
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
    
    handleInteriorClick(mouseX, mouseY) {
        if (this.currentInterior.type === 'bank') {
            this.handleBankClick(mouseX, mouseY);
        }
        // Add other interior types here later
    }
    
    handleBankClick(mouseX, mouseY) {
        if (!this.interiorScale) return;
        
        // Bank teller locations - positioned at actual teller windows based on the hexagonal bank image
        const tellerPoints = [
            { x: 0.35, y: 0.20, name: "North Left Teller" },
            { x: 0.65, y: 0.20, name: "North Right Teller" },
            { x: 0.85, y: 0.50, name: "East Teller" }, 
            { x: 0.65, y: 0.85, name: "South Right Teller" },
            { x: 0.35, y: 0.85, name: "South Left Teller" },
            { x: 0.15, y: 0.50, name: "West Teller" }
        ];
        
        // Check if click is near any teller
        for (const teller of tellerPoints) {
            const screenX = this.interiorScale.x + (teller.x * this.interiorScale.width);
            const screenY = this.interiorScale.y + (teller.y * this.interiorScale.height);
            
            const distance = Math.sqrt(
                Math.pow(mouseX - screenX, 2) + Math.pow(mouseY - screenY, 2)
            );
            
            if (distance <= 18) { // 18 pixel click radius (bigger for larger icons)
                this.interactWithBankTeller(teller);
                return;
            }
        }
    }
    
    interactWithBankTeller(teller) {
        alert(`💰 Interacting with ${teller.name}!\n\n` +
              `"Welcome to the Bank of RuneScape!"\n\n` +
              `Services available:\n` +
              `• Deposit items\n` +
              `• Withdraw items  \n` +
              `• View account balance\n` +
              `• Access bank chest\n\n` +
              `In the actual game, this would open the banking interface.`);
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Handle interior hover
        if (this.showingInterior) {
            this.handleInteriorHover(mouseX, mouseY);
            return;
        }
        
        if (this.testMode) return; // Disable mouse controls in test mode
        
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
        } else {
            // Store hover position for preview
            this.hoverTile = { x: worldX, y: worldY };
            this.render();
        }
    }
    
    handleInteriorHover(mouseX, mouseY) {
        if (this.currentInterior.type === 'bank') {
            this.handleBankHover(mouseX, mouseY);
        }
    }
    
    handleBankHover(mouseX, mouseY) {
        if (!this.interiorScale) return;
        
        const tellerPoints = [
            { x: 0.35, y: 0.20, name: "North Left Teller" },
            { x: 0.65, y: 0.20, name: "North Right Teller" },
            { x: 0.85, y: 0.50, name: "East Teller" }, 
            { x: 0.65, y: 0.85, name: "South Right Teller" },
            { x: 0.35, y: 0.85, name: "South Left Teller" },
            { x: 0.15, y: 0.50, name: "West Teller" }
        ];
        
        // Check if hovering over any teller
        let overTeller = false;
        for (const teller of tellerPoints) {
            const screenX = this.interiorScale.x + (teller.x * this.interiorScale.width);
            const screenY = this.interiorScale.y + (teller.y * this.interiorScale.height);
            
            const distance = Math.sqrt(
                Math.pow(mouseX - screenX, 2) + Math.pow(mouseY - screenY, 2)
            );
            
            if (distance <= 18) {
                overTeller = true;
                break;
            }
        }
        
        // Change cursor based on hover
        this.canvas.style.cursor = overTeller ? 'pointer' : 'default';
    }
    
    onMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'crosshair';
    }
    
    onKeyDown(e) {
        // Handle interior exit first
        if (this.showingInterior && (e.key === 'Escape' || e.key.toLowerCase() === 'e')) {
            e.preventDefault();
            this.exitInterior();
            return;
        }
        
        if (!this.testMode) return;
        
        this.keys[e.key.toLowerCase()] = true;
        
        // Space bar to interact with doors
        if (e.key === ' ') {
            e.preventDefault();
            this.tryInteractWithDoor();
        }
        
        // Escape to exit test mode (only if not showing interior)
        if (e.key === 'Escape' && !this.showingInterior) {
            this.toggleTestMode();
        }
    }
    
    onKeyUp(e) {
        if (!this.testMode) return;
        this.keys[e.key.toLowerCase()] = false;
    }
    
    updatePlayer() {
        if (!this.testMode) return;
        
        let dx = 0;
        let dy = 0;
        
        // WASD movement
        if (this.keys['w'] || this.keys['arrowup']) dy -= this.player.speed;
        if (this.keys['s'] || this.keys['arrowdown']) dy += this.player.speed;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= this.player.speed;
        if (this.keys['d'] || this.keys['arrowright']) dx += this.player.speed;
        
        // Diagonal movement normalization
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707; // sqrt(2)/2
            dy *= 0.707;
        }
        
        // Update player position with bounds checking
        if (this.showingInterior) {
            // Interior movement bounds - keep player within interior area
            const minX = this.interiorScale ? this.interiorScale.x + 20 : 50;
            const maxX = this.interiorScale ? this.interiorScale.x + this.interiorScale.width - 20 : 400;
            const minY = this.interiorScale ? this.interiorScale.y + 20 : 50;
            const maxY = this.interiorScale ? this.interiorScale.y + this.interiorScale.height - 20 : 400;
            
            this.player.x = Math.max(minX, Math.min(maxX - this.player.size, this.player.x + dx));
            this.player.y = Math.max(minY, Math.min(maxY - this.player.size, this.player.y + dy));
        } else {
            // Exterior world bounds
            this.player.x = Math.max(0, Math.min(this.worldWidth * this.tileSize - this.player.size, 
                                               this.player.x + dx));
            this.player.y = Math.max(0, Math.min(this.worldHeight * this.tileSize - this.player.size, 
                                               this.player.y + dy));
        }
        
        // Only update camera if player actually moved and not in interior
        if ((dx !== 0 || dy !== 0) && !this.showingInterior) {
            // Update camera to follow player (only in exterior)
            this.camera.x = this.player.x - this.canvas.width / 2;
            this.camera.y = this.player.y - this.canvas.height / 2;
            
            // Keep camera in bounds
            this.camera.x = Math.max(0, Math.min(this.worldWidth * this.tileSize - this.canvas.width, this.camera.x));
            this.camera.y = Math.max(0, Math.min(this.worldHeight * this.tileSize - this.canvas.height, this.camera.y));
        }
        
        // Check for nearby doors
        this.checkNearbyDoors();
    }
    
    checkNearbyDoors() {
        this.nearbyDoor = null;
        
        const playerTileX = Math.floor(this.player.x / this.tileSize);
        const playerTileY = Math.floor(this.player.y / this.tileSize);
        
        // Check all buildings for interaction tiles
        for (let y = 0; y < this.worldHeight; y++) {
            for (let x = 0; x < this.worldWidth; x++) {
                const tile = this.worldData[y][x];
                if (tile && tile.entryPoint) {
                    // Check if player is on any interaction tile for this building
                    for (const interactionTile of tile.entryPoint.interactionTiles) {
                        const interactionX = x + interactionTile.x;
                        const interactionY = y + interactionTile.y;
                        
                        if (playerTileX === interactionX && playerTileY === interactionY) {
                            this.nearbyDoor = {
                                building: tile,
                                buildingX: x,
                                buildingY: y,
                                doorX: x + tile.entryPoint.door.x,
                                doorY: y + tile.entryPoint.door.y
                            };
                            return;
                        }
                    }
                }
            }
        }
    }
    
    tryInteractWithDoor() {
        if (this.nearbyDoor) {
            const buildingType = this.nearbyDoor.building.type;
            const interior = this.buildingInteriors[buildingType];
            
            if (interior) {
                // Show the interior
                this.showInterior(buildingType, interior);
            } else {
                // Fallback for buildings without interiors
                alert(`🚪 Entering ${buildingType.replace('_', ' ').toUpperCase()}!\n\nNo interior available for this building type.`);
            }
        }
    }
    
    showInterior(buildingType, interior) {
        this.showingInterior = true;
        this.currentInterior = {
            type: buildingType,
            data: interior
        };
        
        // Store exterior player position and camera
        this.exteriorPlayerPos = { x: this.player.x, y: this.player.y };
        this.exteriorCamera = { x: this.camera.x, y: this.camera.y };
        this.exteriorTileSize = this.tileSize;
        
        // Render interior first to get scale
        this.renderInterior();
        
        // Set up interior coordinate system after we have the scale
        if (this.interiorScale) {
            // Position player at the entrance (bottom center of interior)
            this.player.x = this.interiorScale.x + (this.interiorScale.width / 2);
            this.player.y = this.interiorScale.y + this.interiorScale.height - 50; // Near bottom
        } else {
            // Fallback positioning
            this.player.x = 200;
            this.player.y = 350;
        }
        
        // Set camera to show full interior (zoomed out)
        this.camera.x = 0;
        this.camera.y = 0;
        
        // Keep game loop running so interior can handle movement and interactions
        this.renderInterior();
    }
    
    exitInterior() {
        this.showingInterior = false;
        this.currentInterior = null;
        
        // Restore exterior player position and camera
        if (this.exteriorPlayerPos) {
            this.player.x = this.exteriorPlayerPos.x;
            this.player.y = this.exteriorPlayerPos.y;
        }
        if (this.exteriorCamera) {
            this.camera.x = this.exteriorCamera.x;
            this.camera.y = this.exteriorCamera.y;
        }
        if (this.exteriorTileSize) {
            this.tileSize = this.exteriorTileSize;
        }
        
        // Clear stored exterior data
        this.exteriorPlayerPos = null;
        this.exteriorCamera = null;
        this.exteriorTileSize = null;
        
        if (this.testMode) {
            // Ensure camera follows player properly
            this.camera.x = this.player.x - this.canvas.width / 2;
            this.camera.y = this.player.y - this.canvas.height / 2;
            
            // Keep camera in bounds
            this.camera.x = Math.max(0, Math.min(this.worldWidth * this.tileSize - this.canvas.width, this.camera.x));
            this.camera.y = Math.max(0, Math.min(this.worldHeight * this.tileSize - this.canvas.height, this.camera.y));
        }
        
        this.render();
    }
    
    renderInterior() {
        // Save canvas state and reset any transformations
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to identity matrix
        
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.currentInterior) {
            this.ctx.restore();
            return;
        }
        
        const interior = this.currentInterior.data;
        const image = this.interiorImages[interior.image];
        
        if (image && image.complete) {
            // Calculate scaling to show full image with maximum size
            const padding = 5; // Absolute minimal padding
            const availableWidth = this.canvas.width - (padding * 2);
            const availableHeight = this.canvas.height - 80; // Minimal space for compact UI bars
            
            const scale = Math.min(
                availableWidth / image.width,
                availableHeight / image.height
            );
            
            const scaledWidth = image.width * scale;
            const scaledHeight = image.height * scale;
            const x = (this.canvas.width - scaledWidth) / 2;
            const y = 30 + ((this.canvas.height - 80 - scaledHeight) / 2); // Center between minimal UI bars
            
            // Store scaled dimensions for interaction points
            this.interiorScale = {
                scale: scale,
                x: x,
                y: y,
                width: scaledWidth,
                height: scaledHeight
            };
            
            // Draw interior image
            this.ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
            
            // Draw border around interior
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x - 2, y - 2, scaledWidth + 4, scaledHeight + 4);
            
            // Draw player inside interior
            if (this.testMode) {
                this.drawInteriorPlayer();
            }
            
            // Draw interaction points if this is a bank
            if (this.currentInterior.type === 'bank') {
                this.drawBankTellerPoints();
            }
        } else {
            // Loading or error state
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(100, 100, this.canvas.width - 200, this.canvas.height - 200);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Loading Interior...', this.canvas.width / 2, this.canvas.height / 2);
        }
        
        // Draw UI overlay
        this.drawInteriorUI();
        
        // Restore canvas state
        this.ctx.restore();
    }
    
    drawInteriorUI() {
        const interior = this.currentInterior.data;
        
        // Draw minimal title bar
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, 30);
        
        // Draw title
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`🏠 ${interior.name}`, this.canvas.width / 2, 20);
        
        // Draw minimal description
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(interior.description, this.canvas.width / 2, this.canvas.height - 30);
        
        // Draw exit instruction
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.fillText('Press ESC or E to Exit', this.canvas.width / 2, this.canvas.height - 10);
        
        // Draw interior type indicator (minimal)
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        this.ctx.fillRect(10, 35, 160, 15);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '9px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Interior: ${this.currentInterior.type}`, 15, 45);
    }
    
    drawInteriorPlayer() {
        if (!this.interiorScale) return;
        
        // Draw player as a blue circle inside the interior
        this.ctx.fillStyle = '#0066CC';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.size / 2, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw player border
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw player direction indicator
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 8px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('P', this.player.x, this.player.y + 2);
        
        // Show player movement controls (compact)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, this.canvas.height - 110, 280, 35);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('WASD/Arrow Keys: Move around interior', 15, this.canvas.height - 95);
        this.ctx.fillText('SPACE: Interact with objects', 15, this.canvas.height - 82);
    }
    
    drawBankTellerPoints() {
        if (!this.interiorScale) return;
        
        // Bank teller locations based on the bank interior image
        // The image shows teller windows around the perimeter of the hexagonal bank
        // Coordinates are relative to the original image size (0-1 scale)
        const tellerPoints = [
            // Top-left teller window
            { x: 0.35, y: 0.20, name: "North Left Teller" },
            // Top-right teller window  
            { x: 0.65, y: 0.20, name: "North Right Teller" },
            // Right teller window
            { x: 0.85, y: 0.50, name: "East Teller" },
            // Bottom-right teller window
            { x: 0.65, y: 0.85, name: "South Right Teller" },
            // Bottom-left teller window
            { x: 0.35, y: 0.85, name: "South Left Teller" },
            // Left teller window
            { x: 0.15, y: 0.50, name: "West Teller" }
        ];
        
        tellerPoints.forEach((teller, index) => {
            // Convert relative coordinates to screen coordinates
            const screenX = this.interiorScale.x + (teller.x * this.interiorScale.width);
            const screenY = this.interiorScale.y + (teller.y * this.interiorScale.height);
            
            // Draw teller interaction point (bigger and more visible)
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, 12, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw border
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw teller icon (bigger)
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💰', screenX, screenY + 3);
            
            // Draw teller name on hover (simplified - always show for now)
            if (this.tileSize >= 16) { // Only show names when zoomed in enough
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(screenX - 30, screenY - 25, 60, 15);
                
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(teller.name, screenX, screenY - 15);
            }
        });
        
        // Draw bank info at the top of the screen (not overlapping the image)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 220, 40);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🏦 Bank of RuneScape', 20, 28);
        this.ctx.font = '11px Arial';
        this.ctx.fillText('Click the 💰 tellers to bank', 20, 42);
    }
    
    toggleTestMode() {
        this.testMode = !this.testMode;
        
        if (this.testMode) {
            // Spawn player at current camera center (where you're currently viewing)
            this.player.x = this.camera.x + this.canvas.width / 2;
            this.player.y = this.camera.y + this.canvas.height / 2;
            
            // Ensure player is within world bounds
            this.player.x = Math.max(this.player.size/2, 
                                   Math.min(this.worldWidth * this.tileSize - this.player.size/2, this.player.x));
            this.player.y = Math.max(this.player.size/2, 
                                   Math.min(this.worldHeight * this.tileSize - this.player.size/2, this.player.y));
            
            // Update camera to follow player immediately
            this.camera.x = this.player.x - this.canvas.width / 2;
            this.camera.y = this.player.y - this.canvas.height / 2;
            
            // Keep camera in bounds
            this.camera.x = Math.max(0, Math.min(this.worldWidth * this.tileSize - this.canvas.width, this.camera.x));
            this.camera.y = Math.max(0, Math.min(this.worldHeight * this.tileSize - this.canvas.height, this.camera.y));
            
            // Start game loop
            this.startGameLoop();
        } else {
            // Stop game loop
            this.stopGameLoop();
        }
        
        document.getElementById('testModeIndicator').textContent = this.testMode ? 'TEST MODE ACTIVE' : 'BUILD MODE';
        document.getElementById('testModeIndicator').style.color = this.testMode ? '#00FF00' : '#FFD700';
    }
    
    startGameLoop() {
        if (this.gameLoop) return;
        
        this.gameLoop = setInterval(() => {
            this.updatePlayer();
            this.render();
        }, 16); // ~60 FPS
    }
    
    stopGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }
    
    onWheel(e) {
        e.preventDefault();
        
        if (this.testMode) {
            // In test mode, zoom while keeping player centered
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newTileSize = Math.max(4, Math.min(64, this.tileSize * zoomFactor));
            
            if (newTileSize !== this.tileSize) {
                this.tileSize = newTileSize;
                
                // Keep camera centered on player after zoom
                this.camera.x = this.player.x - this.canvas.width / 2;
                this.camera.y = this.player.y - this.canvas.height / 2;
                
                // Keep camera in bounds
                this.camera.x = Math.max(0, Math.min(this.worldWidth * this.tileSize - this.canvas.width, this.camera.x));
                this.camera.y = Math.max(0, Math.min(this.worldHeight * this.tileSize - this.canvas.height, this.camera.y));
                
                document.getElementById('tileSize').value = Math.round(this.tileSize);
                this.render();
            }
        } else {
            // Build mode - normal zoom behavior
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.tileSize = Math.max(4, Math.min(64, this.tileSize * zoomFactor));
            document.getElementById('tileSize').value = Math.round(this.tileSize);
            this.render();
        }
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
                    // Clear the area first (set to grass) for all tiles the building will occupy
                    for (let dx = 0; dx < buildingWidth; dx++) {
                        for (let dy = 0; dy < buildingHeight; dy++) {
                            const x = worldX + dx;
                            const y = worldY + dy;
                            if (x < this.worldWidth && y < this.worldHeight) {
                                this.worldData[y][x].type = 'grass';
                                this.worldData[y][x].properties = {};
                            }
                        }
                    }
                    
                    // Place the building (only set the main tile as the building type)
                    this.worldData[worldY][worldX].type = this.selectedType;
                    
                    // Add entry point data if this building has entry points
                    const entryPointData = this.buildingEntryPoints[this.selectedType];
                    if (entryPointData) {
                        this.worldData[worldY][worldX].entryPoint = {
                            door: entryPointData.door,
                            interactionTiles: entryPointData.interactionTiles,
                            buildingType: this.selectedType
                        };
                    }
                    
                    tilesChanged++;
                    
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
        // If showing interior, render that instead of the world
        if (this.showingInterior) {
            this.renderInterior();
            return;
        }
        
        // Clear canvas with RuneScape-style background
        this.ctx.fillStyle = '#228B22'; // Default grass green background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const startX = Math.floor(this.camera.x / this.tileSize);
        const startY = Math.floor(this.camera.y / this.tileSize);
        const endX = Math.min(this.worldWidth, startX + Math.ceil(this.canvas.width / this.tileSize) + 1);
        const endY = Math.min(this.worldHeight, startY + Math.ceil(this.canvas.height / this.tileSize) + 1);
        
        // Track which buildings have been drawn to avoid duplicates
        const drawnBuildings = new Set();
        
        // Draw tiles
        for (let y = Math.max(0, startY); y < endY; y++) {
            for (let x = Math.max(0, startX); x < endX; x++) {
                const tile = this.worldData[y][x];
                if (!tile) continue; // Skip if tile doesn't exist
                
                const screenX = x * this.tileSize - this.camera.x;
                const screenY = y * this.tileSize - this.camera.y;
                
                // Check if this is an occupied tile (part of a larger building)
                if (tile.properties && tile.properties.occupiedBy) {
                    // This tile is part of a building, skip drawing anything here
                    // The main building tile will handle the entire building render
                    continue;
                }
                
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
                    if (buildingSize && (buildingSize.width > 1 || buildingSize.height > 1)) {
                        // For multi-tile buildings, check if we've already drawn this building
                        const buildingKey = `${x}_${y}_${tile.type}`;
                        if (!drawnBuildings.has(buildingKey)) {
                            drawnBuildings.add(buildingKey);
                            
                            // Save context for clipping
                            this.ctx.save();
                            
                            // Draw the full building image
                            this.ctx.drawImage(image, screenX, screenY, renderWidth, renderHeight);
                            
                            // Restore context
                            this.ctx.restore();
                        }
                    } else {
                        // Single tile - draw normally
                        this.ctx.drawImage(image, screenX, screenY, renderWidth, renderHeight);
                        
                        // Add AI indicator for AI-controlled NPCs
                        if (tile.type && tile.type.startsWith('npc_') && this.openAI_NPCs && this.openAI_NPCs.isAIControlled(worldX, worldY)) {
                            this.ctx.fillStyle = '#00FF00';
                            this.ctx.beginPath();
                            this.ctx.arc(screenX + renderWidth - 6, screenY + 6, 4, 0, 2 * Math.PI);
                            this.ctx.fill();
                            this.ctx.strokeStyle = '#000000';
                            this.ctx.lineWidth = 1;
                            this.ctx.stroke();
                            
                            // Add "AI" text
                            this.ctx.fillStyle = '#000000';
                            this.ctx.font = 'bold 8px Arial';
                            this.ctx.textAlign = 'center';
                            this.ctx.fillText('AI', screenX + renderWidth - 6, screenY + 8);
                        }
                    }
                } else if (!shouldDrawBackground) {
                    // For non-terrain tiles without image, draw colored background
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                }
                
                // Add subtle border for definition (use appropriate size)
                if (!tile.properties || !tile.properties.occupiedBy) {
                    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.lineWidth = 1;
                    if (buildingSize && (image && image.complete) && (buildingSize.width > 1 || buildingSize.height > 1)) {
                        // For multi-tile buildings with images, draw border around full building
                        this.ctx.strokeRect(screenX, screenY, renderWidth, renderHeight);
                    } else {
                        // For single tiles or buildings without images, draw single tile border
                        this.ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
                    }
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
        
        // Draw building entry points and interaction zones
        if (this.showEntryPoints) {
            this.drawBuildingEntryPoints();
        }
        
        // Draw player in test mode
        if (this.testMode) {
            this.drawPlayer();
        }
        
        // Draw hover preview for buildings
        if (this.hoverTile && this.currentTool === 'paint' && !this.testMode) {
            const buildingSize = this.buildingSizes && this.buildingSizes[this.selectedType];
            const previewWidth = buildingSize ? Math.ceil(buildingSize.width) : 1;
            const previewHeight = buildingSize ? Math.ceil(buildingSize.height) : 1;
            
            // Draw preview outline
            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                this.hoverTile.x * this.tileSize - this.camera.x,
                this.hoverTile.y * this.tileSize - this.camera.y,
                previewWidth * this.tileSize,
                previewHeight * this.tileSize
            );
        }
    }
    
    drawBuildingEntryPoints() {
        const startX = Math.floor(this.camera.x / this.tileSize);
        const startY = Math.floor(this.camera.y / this.tileSize);
        const endX = Math.min(this.worldWidth, startX + Math.ceil(this.canvas.width / this.tileSize) + 1);
        const endY = Math.min(this.worldHeight, startY + Math.ceil(this.canvas.height / this.tileSize) + 1);
        
        // Find all buildings in view and draw their entry points
        for (let y = Math.max(0, startY); y < endY; y++) {
            for (let x = Math.max(0, startX); x < endX; x++) {
                const tile = this.worldData[y][x];
                if (!tile) continue;
                
                // Check if this tile has a building with entry points
                const entryPoint = this.buildingEntryPoints && this.buildingEntryPoints[tile.type];
                if (entryPoint) {
                    // This is the main tile of a building with entry points
                    const buildingX = x;
                    const buildingY = y;
                    
                    // Draw door marker
                    const doorScreenX = (buildingX + entryPoint.door.x) * this.tileSize - this.camera.x;
                    const doorScreenY = (buildingY + entryPoint.door.y) * this.tileSize - this.camera.y;
                    
                    // Draw door icon (small circle with "D")
                    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
                    this.ctx.beginPath();
                    this.ctx.arc(doorScreenX, doorScreenY, 6, 0, 2 * Math.PI);
                    this.ctx.fill();
                    
                    this.ctx.fillStyle = 'black';
                    this.ctx.font = '10px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('D', doorScreenX, doorScreenY + 3);
                    
                    // Draw interaction tiles (where player can stand to enter)
                    this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
                    this.ctx.lineWidth = 2;
                    
                    entryPoint.interactionTiles.forEach(interactionTile => {
                        const interactionX = buildingX + interactionTile.x;
                        const interactionY = buildingY + interactionTile.y;
                        
                        // Only draw if the interaction tile is in bounds
                        if (interactionX >= 0 && interactionX < this.worldWidth && 
                            interactionY >= 0 && interactionY < this.worldHeight) {
                            
                            const screenX = interactionX * this.tileSize - this.camera.x;
                            const screenY = interactionY * this.tileSize - this.camera.y;
                            
                            // Draw green outline on interaction tiles
                            this.ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
                        }
                    });
                }
            }
        }
    }
    
    drawPlayer() {
        const screenX = this.player.x - this.camera.x;
        const screenY = this.player.y - this.camera.y;
        
        // Draw player shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(screenX + this.player.size/2, screenY + this.player.size + 2, 
                        this.player.size/2, 3, 0, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw player character
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.arc(screenX + this.player.size/2, screenY + this.player.size/2, 
                    this.player.size/2, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw player outline
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw interaction indicator if near door
        if (this.nearbyDoor) {
            // Draw glowing effect around player
            this.ctx.strokeStyle = '#00FF00';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(screenX + this.player.size/2, screenY + this.player.size/2, 
                        this.player.size/2 + 3, 0, 2 * Math.PI);
            this.ctx.stroke();
            
            // Draw interaction prompt
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(screenX - 20, screenY - 25, 80, 20);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SPACE to Enter', screenX + this.player.size/2, screenY - 10);
            
            // Draw arrow pointing to door
            const doorScreenX = (this.nearbyDoor.doorX * this.tileSize) - this.camera.x;
            const doorScreenY = (this.nearbyDoor.doorY * this.tileSize) - this.camera.y;
            
            this.ctx.strokeStyle = '#00FF00';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX + this.player.size/2, screenY + this.player.size/2);
            this.ctx.lineTo(doorScreenX, doorScreenY);
            this.ctx.stroke();
        }
        
        // Draw player coordinates
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 50);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Player: (${Math.floor(this.player.x)}, ${Math.floor(this.player.y)})`, 15, 25);
        this.ctx.fillText(`Tile: (${Math.floor(this.player.x / this.tileSize)}, ${Math.floor(this.player.y / this.tileSize)})`, 15, 40);
        this.ctx.fillText(`Controls: WASD/Arrows to move, SPACE to interact, ESC to exit`, 15, 55);
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
            // Large Buildings
            'castle': { width: 5, height: 4 },
            
            // Medium-Large Buildings  
            'bank': { width: 4, height: 3 },
            'church': { width: 3, height: 3 },
            
            // Shop Buildings (all shops are similar size)
            'general_store': { width: 3, height: 2 },
            'magic_shop': { width: 3, height: 2 },
            'weapon_shop': { width: 3, height: 2 },
            'armor_shop': { width: 3, height: 2 },
            'food_shop': { width: 3, height: 2 },
            'rune_shop': { width: 3, height: 2 },
            'archery_shop': { width: 3, height: 2 },
            
            // Houses
            'house': { width: 2, height: 2 },
            'house_small': { width: 2, height: 2 },
            'house_large': { width: 3, height: 2 },
            'inn': { width: 3, height: 2 },
            
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
    
    getBuildingEntryPoints() {
        // Define door/entry point locations for each building
        // Coordinates are relative to building's top-left tile (0,0)
        // Entry points mark where players can interact to enter
        return {
            // Bank: Door is on the front-center bottom
            'bank': { 
                door: { x: 2, y: 2.5 }, // Bottom center of 4x3 building
                interactionTiles: [
                    { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 } // Tiles in front of door
                ]
            },
            
            // House: Door is on the front-right side
            'house': { 
                door: { x: 1.5, y: 1.8 }, // Front-right of 2x2 building
                interactionTiles: [
                    { x: 1, y: 2 }, { x: 2, y: 2 } // Tiles in front of door
                ]
            },
            
            'house_small': { 
                door: { x: 1.5, y: 1.8 }, // Front-right of 2x2 building
                interactionTiles: [
                    { x: 1, y: 2 }, { x: 2, y: 2 } // Tiles in front of door
                ]
            },
            
            'house_large': { 
                door: { x: 2, y: 1.8 }, // Front-center of 3x2 building
                interactionTiles: [
                    { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 } // Tiles in front of door
                ]
            },
            
            // General Store: Door is on the front-right corner
            'general_store': { 
                door: { x: 2.5, y: 1.8 }, // Front-right of 3x2 building
                interactionTiles: [
                    { x: 2, y: 2 }, { x: 3, y: 2 } // Tiles in front of door
                ]
            },
            
            // Magic Shop: Door is at the front-center with steps
            'magic_shop': { 
                door: { x: 1.5, y: 1.8 }, // Front-center of 3x2 building
                interactionTiles: [
                    { x: 1, y: 2 }, { x: 2, y: 2 } // Tiles in front of magical entrance
                ]
            },
            
            // All other shops follow similar pattern
            'weapon_shop': { 
                door: { x: 2, y: 1.8 }, // Front-center of 3x2 building
                interactionTiles: [
                    { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }
                ]
            },
            
            'armor_shop': { 
                door: { x: 2, y: 1.8 },
                interactionTiles: [
                    { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }
                ]
            },
            
            'food_shop': { 
                door: { x: 2, y: 1.8 },
                interactionTiles: [
                    { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }
                ]
            },
            
            'rune_shop': { 
                door: { x: 2, y: 1.8 },
                interactionTiles: [
                    { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }
                ]
            },
            
            'archery_shop': { 
                door: { x: 2, y: 1.8 },
                interactionTiles: [
                    { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }
                ]
            },
            
            // Inn: Large building with front door
            'inn': { 
                door: { x: 1.5, y: 1.8 }, // Front-left of 3x2 building
                interactionTiles: [
                    { x: 1, y: 2 }, { x: 2, y: 2 }
                ]
            },
            
            // Church: Large front entrance
            'church': { 
                door: { x: 1.5, y: 2.8 }, // Front-center of 3x3 building
                interactionTiles: [
                    { x: 1, y: 3 }, { x: 2, y: 3 } // Wide entrance
                ]
            },
            
            // Castle: Main gate entrance
            'castle': { 
                door: { x: 2.5, y: 3.8 }, // Front gate of 5x4 building
                interactionTiles: [
                    { x: 2, y: 4 }, { x: 3, y: 4 } // Tiles in front of gate
                ]
            },
            
            // Tall Buildings
            'tower_wizard': { 
                door: { x: 0.75, y: 2.3 }, // Front of 1.5x2.5 building
                interactionTiles: [
                    { x: 1, y: 3 }
                ]
            },
            
            'lighthouse': { 
                door: { x: 0.6, y: 2.8 }, // Front of 1.25x3 building
                interactionTiles: [
                    { x: 1, y: 3 }
                ]
            },
            
            'windmill': { 
                door: { x: 1, y: 2.3 }, // Front of 2x2.5 building
                interactionTiles: [
                    { x: 1, y: 3 }, { x: 2, y: 3 }
                ]
            }
        };
    }
    
    exportWorldWithEntryPoints() {
        const worldExport = {
            worldData: this.worldData,
            metadata: {
                width: this.worldWidth,
                height: this.worldHeight,
                tileSize: this.tileSize,
                buildingsWithEntryPoints: []
            }
        };
        
        // Find all buildings with entry points
        for (let y = 0; y < this.worldHeight; y++) {
            for (let x = 0; x < this.worldWidth; x++) {
                const tile = this.worldData[y][x];
                if (tile && tile.entryPoint) {
                    worldExport.metadata.buildingsWithEntryPoints.push({
                        x: x,
                        y: y,
                        type: tile.type,
                        door: tile.entryPoint.door,
                        interactionTiles: tile.entryPoint.interactionTiles
                    });
                }
            }
        }
        
        // Export as JSON
        const exportString = JSON.stringify(worldExport, null, 2);
        
        // Create download link
        const blob = new Blob([exportString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'runescape_world_with_doors.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`Exported world with ${worldExport.metadata.buildingsWithEntryPoints.length} buildings with entry points`);
    }
    
    getBuildingInteriors() {
        // Map building types to their interior images
        return {
            'bank': {
                image: 'bank_interior.png',
                name: 'Bank',
                description: 'Store your items safely and access your wealth'
            },
            'general_store': {
                image: 'general_store_interior.png', 
                name: 'General Store',
                description: 'Buy and sell general goods and supplies'
            },
            'house': {
                image: 'house_interior.png',
                name: 'House',
                description: 'A cozy home with fireplace and furniture'
            },
            'house_small': {
                image: 'house_interior.png',
                name: 'Small House', 
                description: 'A modest dwelling with basic amenities'
            },
            'house_large': {
                image: 'house_interior.png',
                name: 'Large House',
                description: 'A spacious home with multiple rooms'
            },
            'magic_shop': {
                image: 'magic_shop_interior.png',
                name: 'Magic Shop',
                description: 'Mystical emporium of spells and magical items'
            },
            // Map other shops to general store for now
            'weapon_shop': {
                image: 'general_store_interior.png',
                name: 'Weapon Shop', 
                description: 'Swords, axes, and combat equipment'
            },
            'armor_shop': {
                image: 'general_store_interior.png',
                name: 'Armor Shop',
                description: 'Protective gear and defensive equipment'
            },
            'food_shop': {
                image: 'general_store_interior.png',
                name: 'Food Shop',
                description: 'Fresh food and cooking supplies'
            },
            'rune_shop': {
                image: 'magic_shop_interior.png', // Use magic shop for rune shop
                name: 'Rune Shop',
                description: 'Magical runes and enchanted stones'
            },
            'archery_shop': {
                image: 'general_store_interior.png',
                name: 'Archery Shop',
                description: 'Bows, arrows, and ranged equipment'
            },
            'inn': {
                image: 'house_interior.png', // Use house interior for inn
                name: 'Inn',
                description: 'Rest and recover at this cozy inn'
            }
        };
    }
    
    loadInteriorImages() {
        // Load all interior images
        const interiors = Object.values(this.buildingInteriors);
        const uniqueImages = [...new Set(interiors.map(interior => interior.image))];
        
        uniqueImages.forEach(imageName => {
            const img = new Image();
            img.onload = () => {
                console.log(`Loaded interior: ${imageName}`);
            };
            img.onerror = () => {
                console.warn(`Failed to load interior: ${imageName}`);
            };
            img.src = `assets/interiors/${imageName}`;
            this.interiorImages[imageName] = img;
        });
    }
    
    generateRuneScapeAssets() {
        // Generate enhanced RuneScape assets with proper prompts
        console.log('Generating RuneScape-specific assets...');
        // Load interior images
        this.loadInteriorImages();
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

// =============================================================================
// GAME INTELLIGENCE SYSTEMS
// =============================================================================

class GameIntelligence {
    constructor(worldBuilder) {
        this.worldBuilder = worldBuilder;
        this.gameTime = 0;
        this.gameHour = 8; // Start at 8 AM
        this.dayNightCycle = true;
        this.weather = 'clear';
        this.seasonalEffects = true;
    }

    update() {
        this.updateTime();
        this.updateWeather();
        this.analyzeWorldState();
    }

    updateTime() {
        if (this.dayNightCycle) {
            this.gameTime += 0.1; // Game time progression
            this.gameHour = ((this.gameTime / 60) + 8) % 24; // 1 real minute = 1 game hour
        }
    }

    updateWeather() {
        const rand = Math.random();
        if (rand < 0.001) { // 0.1% chance per frame to change weather
            const weathers = ['clear', 'cloudy', 'rainy', 'stormy'];
            this.weather = weathers[Math.floor(Math.random() * weathers.length)];
        }
    }

    analyzeWorldState() {
        const analysis = {
            buildingDensity: this.calculateBuildingDensity(),
            npcDistribution: this.analyzeNPCDistribution(),
            resourceAvailability: this.checkResourceAvailability(),
            suggestions: []
        };

        // Generate intelligent suggestions
        if (analysis.buildingDensity < 0.1) {
            analysis.suggestions.push("Consider adding more buildings to create a populated area");
        }
        if (analysis.npcDistribution.isolated.length > 0) {
            analysis.suggestions.push("Some NPCs appear isolated - consider adding roads or gathering points");
        }

        return analysis;
    }

    calculateBuildingDensity() {
        let buildingCount = 0;
        let totalTiles = this.worldBuilder.worldWidth * this.worldBuilder.worldHeight;
        
        for (let y = 0; y < this.worldBuilder.worldHeight; y++) {
            for (let x = 0; x < this.worldBuilder.worldWidth; x++) {
                const tile = this.worldBuilder.worldData[y][x];
                if (tile.type && (tile.type.includes('house') || tile.type.includes('shop') || tile.type.includes('bank'))) {
                    buildingCount++;
                }
            }
        }
        
        return buildingCount / totalTiles;
    }

    analyzeNPCDistribution() {
        const npcs = this.findAllNPCs();
        const clusters = this.findNPCClusters(npcs);
        const isolated = npcs.filter(npc => !this.isNPCInCluster(npc, clusters));
        
        return { total: npcs.length, clusters, isolated };
    }

    findAllNPCs() {
        const npcs = [];
        for (let y = 0; y < this.worldBuilder.worldHeight; y++) {
            for (let x = 0; x < this.worldBuilder.worldWidth; x++) {
                const tile = this.worldBuilder.worldData[y][x];
                if (tile.type && tile.type.startsWith('npc_')) {
                    npcs.push({ x, y, type: tile.type, data: tile });
                }
            }
        }
        return npcs;
    }

    findNPCClusters(npcs, maxDistance = 5) {
        const clusters = [];
        const visited = new Set();
        
        npcs.forEach(npc => {
            if (!visited.has(`${npc.x},${npc.y}`)) {
                const cluster = this.expandCluster(npc, npcs, maxDistance, visited);
                if (cluster.length > 1) {
                    clusters.push(cluster);
                }
            }
        });
        
        return clusters;
    }

    expandCluster(startNPC, allNPCs, maxDistance, visited) {
        const cluster = [startNPC];
        visited.add(`${startNPC.x},${startNPC.y}`);
        
        const toCheck = [startNPC];
        
        while (toCheck.length > 0) {
            const current = toCheck.pop();
            
            allNPCs.forEach(npc => {
                const key = `${npc.x},${npc.y}`;
                if (!visited.has(key)) {
                    const distance = Math.sqrt(
                        Math.pow(npc.x - current.x, 2) + Math.pow(npc.y - current.y, 2)
                    );
                    
                    if (distance <= maxDistance) {
                        cluster.push(npc);
                        visited.add(key);
                        toCheck.push(npc);
                    }
                }
            });
        }
        
        return cluster;
    }

    isNPCInCluster(npc, clusters) {
        return clusters.some(cluster => 
            cluster.some(clusterNPC => 
                clusterNPC.x === npc.x && clusterNPC.y === npc.y
            )
        );
    }

    checkResourceAvailability() {
        const resources = {
            trees: 0,
            rocks: 0,
            water: 0,
            shops: 0
        };
        
        for (let y = 0; y < this.worldBuilder.worldHeight; y++) {
            for (let x = 0; x < this.worldBuilder.worldWidth; x++) {
                const tile = this.worldBuilder.worldData[y][x];
                if (tile.type) {
                    if (tile.type.includes('tree')) resources.trees++;
                    if (tile.type.includes('rock')) resources.rocks++;
                    if (tile.type === 'water') resources.water++;
                    if (tile.type.includes('shop')) resources.shops++;
                }
            }
        }
        
        return resources;
    }
}

class NPCAISystem {
    constructor(worldBuilder) {
        this.worldBuilder = worldBuilder;
        this.npcStates = new Map();
        this.conversationTrees = this.initializeConversationTrees();
        this.npcSchedules = this.initializeNPCSchedules();
    }

    initializeConversationTrees() {
        return {
            shopkeeper: {
                greeting: [
                    "Welcome to my shop! What can I help you with today?",
                    "Good day! Looking for anything in particular?",
                    "Hello there! Feel free to browse my wares."
                ],
                responses: {
                    "What do you sell?": {
                        reply: "I sell a variety of goods - weapons, armor, supplies. What interests you?",
                        options: ["Show me weapons", "Show me armor", "Show me supplies", "Nothing right now"]
                    },
                    "Tell me about this area": {
                        reply: "This is a peaceful trading town. We get visitors from all over the realm.",
                        options: ["Any interesting places nearby?", "Who runs this town?", "Thank you"]
                    },
                    "Goodbye": {
                        reply: "Safe travels, friend! Come back anytime.",
                        options: []
                    }
                }
            },
            guard: {
                greeting: [
                    "Halt! State your business in this area.",
                    "Stay vigilant, citizen. There have been reports of trouble.",
                    "Keep the peace, traveler. We're watching."
                ],
                responses: {
                    "I'm just passing through": {
                        reply: "Very well. Keep your wits about you - these lands can be dangerous.",
                        options: ["What kind of dangers?", "Thanks for the warning", "I can handle myself"]
                    },
                    "What kind of dangers?": {
                        reply: "Bandits on the roads, monsters in the wilderness. Stick to well-traveled paths.",
                        options: ["Any safe routes you recommend?", "I'll be careful", "Goodbye"]
                    }
                }
            },
            civilian: {
                greeting: [
                    "Good day to you, traveler!",
                    "Beautiful weather we're having, isn't it?",
                    "Haven't seen you around these parts before."
                ],
                responses: {
                    "Tell me about yourself": {
                        reply: "I'm just a simple citizen trying to make an honest living. Life's been good to me here.",
                        options: ["What do you do for work?", "How long have you lived here?", "That's nice to hear"]
                    },
                    "Any local gossip?": {
                        reply: "Well, I shouldn't spread rumors, but they say strange lights have been seen in the forest at night...",
                        options: ["Strange lights?", "Who's been seeing them?", "Probably nothing"]
                    }
                }
            }
        };
    }

    initializeNPCSchedules() {
        return {
            shopkeeper: {
                6: 'opening_shop',
                8: 'serving_customers',
                12: 'lunch_break',
                13: 'serving_customers',
                18: 'closing_shop',
                20: 'going_home'
            },
            guard: {
                6: 'morning_patrol',
                12: 'guard_post',
                18: 'evening_patrol',
                22: 'night_watch'
            },
            civilian: {
                7: 'morning_routine',
                9: 'work',
                12: 'lunch',
                13: 'work',
                17: 'social_time',
                19: 'dinner',
                21: 'evening_rest'
            }
        };
    }

    updateNPCAI() {
        const gameHour = this.worldBuilder.gameIntelligence.gameHour;
        
        this.worldBuilder.gameIntelligence.findAllNPCs().forEach(npc => {
            this.updateNPCBehavior(npc, gameHour);
            this.updateNPCDialogue(npc);
        });
    }

    updateNPCBehavior(npc, gameHour) {
        const npcType = this.getNPCType(npc.type);
        const schedule = this.npcSchedules[npcType];
        
        if (schedule) {
            const currentActivity = this.getCurrentActivity(schedule, gameHour);
            this.setNPCActivity(npc, currentActivity);
        }
    }

    getNPCType(npcTypeString) {
        if (npcTypeString.includes('shop') || npcTypeString.includes('merchant')) return 'shopkeeper';
        if (npcTypeString.includes('guard') || npcTypeString.includes('knight')) return 'guard';
        return 'civilian';
    }

    getCurrentActivity(schedule, hour) {
        const scheduleHours = Object.keys(schedule).map(Number).sort((a, b) => a - b);
        
        for (let i = scheduleHours.length - 1; i >= 0; i--) {
            if (hour >= scheduleHours[i]) {
                return schedule[scheduleHours[i]];
            }
        }
        
        return schedule[scheduleHours[scheduleHours.length - 1]];
    }

    setNPCActivity(npc, activity) {
        const state = this.npcStates.get(`${npc.x},${npc.y}`) || {};
        state.currentActivity = activity;
        state.mood = this.calculateNPCMood(npc, activity);
        this.npcStates.set(`${npc.x},${npc.y}`, state);
    }

    calculateNPCMood(npc, activity) {
        const weather = this.worldBuilder.gameIntelligence.weather;
        const time = this.worldBuilder.gameIntelligence.gameHour;
        
        let moodScore = 50; // Base neutral mood
        
        // Weather effects
        if (weather === 'clear') moodScore += 10;
        if (weather === 'rainy') moodScore -= 5;
        if (weather === 'stormy') moodScore -= 15;
        
        // Time effects
        if (time >= 6 && time <= 18) moodScore += 5; // Daytime bonus
        if (time >= 22 || time <= 5) moodScore -= 10; // Late night penalty
        
        // Activity effects
        const activityMoodMap = {
            'serving_customers': 5,
            'lunch_break': 15,
            'social_time': 10,
            'guard_post': -5,
            'night_watch': -10,
            'morning_routine': 5
        };
        
        moodScore += activityMoodMap[activity] || 0;
        
        return Math.max(0, Math.min(100, moodScore)); // Clamp between 0-100
    }

    generateContextualDialogue(npc, playerAction = null) {
        const npcType = this.getNPCType(npc.type);
        const state = this.npcStates.get(`${npc.x},${npc.y}`) || {};
        const conversationTree = this.conversationTrees[npcType];
        
        if (!conversationTree) {
            return "Hello there!";
        }
        
        let greeting = conversationTree.greeting[Math.floor(Math.random() * conversationTree.greeting.length)];
        
        // Modify greeting based on mood and activity
        if (state.mood < 30) {
            greeting = "Oh... hello. Not having the best day, I'm afraid.";
        } else if (state.mood > 80) {
            greeting = "What a wonderful day! Hello there, friend!";
        }
        
        // Modify based on current activity
        if (state.currentActivity === 'lunch_break') {
            greeting = "Excuse me, I'm on my lunch break, but I can spare a moment.";
        } else if (state.currentActivity === 'closing_shop') {
            greeting = "I'm just closing up shop, but what can I do for you?";
        }
        
        return greeting;
    }

    getDialogueOptions(npc) {
        const npcType = this.getNPCType(npc.type);
        const conversationTree = this.conversationTrees[npcType];
        
        if (!conversationTree) {
            return ["Goodbye"];
        }
        
        return Object.keys(conversationTree.responses);
    }

    processDialogueChoice(npc, choice) {
        const npcType = this.getNPCType(npc.type);
        const conversationTree = this.conversationTrees[npcType];
        
        if (!conversationTree || !conversationTree.responses[choice]) {
            return { reply: "I don't understand.", options: ["Goodbye"] };
        }
        
        return conversationTree.responses[choice];
    }
}

class QuestSystem {
    constructor(worldBuilder) {
        this.worldBuilder = worldBuilder;
        this.activeQuests = [];
        this.completedQuests = [];
        this.questTemplates = this.initializeQuestTemplates();
        this.dynamicQuests = [];
    }

    initializeQuestTemplates() {
        return {
            delivery: {
                name: "Delivery Service",
                description: "Deliver {item} to {target} in {location}",
                type: "delivery",
                difficulty: "easy",
                rewards: { experience: 100, gold: 50 },
                requirements: { level: 1 }
            },
            collection: {
                name: "Resource Gathering",
                description: "Collect {amount} {resource} for {requester}",
                type: "collection",
                difficulty: "medium",
                rewards: { experience: 200, gold: 100 },
                requirements: { level: 5 }
            },
            exploration: {
                name: "Exploration Mission",
                description: "Explore the {area} and report back to {requester}",
                type: "exploration",
                difficulty: "medium",
                rewards: { experience: 300, gold: 75 },
                requirements: { level: 3 }
            },
            combat: {
                name: "Monster Elimination",
                description: "Defeat {amount} {monster} threatening {location}",
                type: "combat",
                difficulty: "hard",
                rewards: { experience: 500, gold: 200 },
                requirements: { level: 10, combat: 15 }
            }
        };
    }

    generateDynamicQuest() {
        const templates = Object.values(this.questTemplates);
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        const quest = this.populateQuestTemplate(template);
        quest.id = `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        quest.isGenerated = true;
        quest.timeCreated = Date.now();
        
        return quest;
    }

    populateQuestTemplate(template) {
        const quest = { ...template };
        const npcs = this.worldBuilder.gameIntelligence.findAllNPCs();
        const locations = this.findNamedLocations();
        
        // Populate template variables based on quest type
        switch (template.type) {
            case 'delivery':
                const items = ['Ancient Scroll', 'Healing Potion', 'Magic Crystal', 'Royal Letter', 'Sacred Artifact'];
                const item = items[Math.floor(Math.random() * items.length)];
                const target = npcs[Math.floor(Math.random() * npcs.length)];
                const location = locations[Math.floor(Math.random() * locations.length)] || 'the town square';
                
                quest.description = quest.description
                    .replace('{item}', item)
                    .replace('{target}', this.getNPCName(target))
                    .replace('{location}', location);
                break;
                
            case 'collection':
                const resources = ['Iron Ore', 'Oak Logs', 'Magic Herbs', 'Rare Gems', 'Ancient Coins'];
                const resource = resources[Math.floor(Math.random() * resources.length)];
                const amount = Math.floor(Math.random() * 10) + 5;
                const requester = npcs[Math.floor(Math.random() * npcs.length)];
                
                quest.description = quest.description
                    .replace('{amount}', amount)
                    .replace('{resource}', resource)
                    .replace('{requester}', this.getNPCName(requester));
                break;
                
            case 'exploration':
                const areas = ['Mysterious Cave', 'Ancient Ruins', 'Dark Forest', 'Abandoned Tower', 'Hidden Valley'];
                const area = areas[Math.floor(Math.random() * areas.length)];
                const explorationRequester = npcs[Math.floor(Math.random() * npcs.length)];
                
                quest.description = quest.description
                    .replace('{area}', area)
                    .replace('{requester}', this.getNPCName(explorationRequester));
                break;
                
            case 'combat':
                const monsters = ['Goblins', 'Skeletons', 'Wolves', 'Bandits', 'Dark Spirits'];
                const monster = monsters[Math.floor(Math.random() * monsters.length)];
                const monsterAmount = Math.floor(Math.random() * 5) + 3;
                const threatLocation = locations[Math.floor(Math.random() * locations.length)] || 'the village';
                
                quest.description = quest.description
                    .replace('{amount}', monsterAmount)
                    .replace('{monster}', monster)
                    .replace('{location}', threatLocation);
                break;
        }
        
        return quest;
    }

    getNPCName(npc) {
        if (!npc) return 'Unknown Person';
        
        const nameMap = {
            npc_shopkeeper: 'Merchant Marcus',
            npc_guard: 'Guard Captain William',
            npc_blacksmith: 'Blacksmith Elena',
            npc_priest: 'Father Benedict',
            npc_mage: 'Wizard Aldric',
            npc_civilian: 'Local Citizen'
        };
        
        return nameMap[npc.type] || 'Unknown Person';
    }

    findNamedLocations() {
        const locations = [];
        const buildings = ['bank', 'church', 'castle', 'inn', 'general_store', 'magic_shop'];
        
        for (let y = 0; y < this.worldBuilder.worldHeight; y++) {
            for (let x = 0; x < this.worldBuilder.worldWidth; x++) {
                const tile = this.worldBuilder.worldData[y][x];
                if (tile.type && buildings.includes(tile.type)) {
                    const locationName = this.getLocationName(tile.type);
                    if (!locations.includes(locationName)) {
                        locations.push(locationName);
                    }
                }
            }
        }
        
        return locations.length > 0 ? locations : ['the town center', 'the marketplace', 'the village square'];
    }

    getLocationName(buildingType) {
        const nameMap = {
            bank: 'the Bank',
            church: 'the Church',
            castle: 'the Castle',
            inn: 'the Inn',
            general_store: 'the General Store',
            magic_shop: 'the Magic Shop'
        };
        
        return nameMap[buildingType] || buildingType.replace('_', ' ');
    }

    startQuest(quest) {
        quest.status = 'active';
        quest.startTime = Date.now();
        this.activeQuests.push(quest);
        
        console.log(`Quest started: ${quest.name}`);
        return quest;
    }

    completeQuest(questId) {
        const questIndex = this.activeQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) return false;
        
        const quest = this.activeQuests[questIndex];
        quest.status = 'completed';
        quest.completionTime = Date.now();
        
        this.activeQuests.splice(questIndex, 1);
        this.completedQuests.push(quest);
        
        console.log(`Quest completed: ${quest.name}! Rewards: ${quest.rewards.experience} XP, ${quest.rewards.gold} gold`);
        return quest;
    }

    getAvailableQuests() {
        // Generate new dynamic quests if needed
        if (this.dynamicQuests.length < 3) {
            this.dynamicQuests.push(this.generateDynamicQuest());
        }
        
        return this.dynamicQuests.filter(q => q.status !== 'active' && q.status !== 'completed');
    }
}

class TradingSystem {
    constructor(worldBuilder) {
        this.worldBuilder = worldBuilder;
        this.marketPrices = this.initializeMarketPrices();
        this.tradeHistory = [];
        this.economicFactors = {
            supply: {},
            demand: {},
            seasonalMultipliers: {}
        };
    }

    initializeMarketPrices() {
        return {
            // Resources
            'Oak Logs': { basePrice: 25, category: 'resource', volatility: 0.2 },
            'Iron Ore': { basePrice: 40, category: 'resource', volatility: 0.3 },
            'Coal': { basePrice: 30, category: 'resource', volatility: 0.25 },
            'Magic Herbs': { basePrice: 100, category: 'resource', volatility: 0.4 },
            
            // Weapons
            'Iron Sword': { basePrice: 200, category: 'weapon', volatility: 0.1 },
            'Steel Dagger': { basePrice: 150, category: 'weapon', volatility: 0.15 },
            'Magic Staff': { basePrice: 500, category: 'weapon', volatility: 0.3 },
            
            // Armor
            'Leather Armor': { basePrice: 100, category: 'armor', volatility: 0.1 },
            'Chain Mail': { basePrice: 300, category: 'armor', volatility: 0.2 },
            'Plate Armor': { basePrice: 800, category: 'armor', volatility: 0.15 },
            
            // Consumables
            'Health Potion': { basePrice: 50, category: 'consumable', volatility: 0.1 },
            'Mana Potion': { basePrice: 60, category: 'consumable', volatility: 0.1 },
            'Food': { basePrice: 10, category: 'consumable', volatility: 0.05 }
        };
    }

    calculateCurrentPrice(itemName) {
        const item = this.marketPrices[itemName];
        if (!item) return 0;
        
        let price = item.basePrice;
        
        // Apply supply and demand
        const supply = this.economicFactors.supply[itemName] || 50;
        const demand = this.economicFactors.demand[itemName] || 50;
        
        const supplyDemandRatio = demand / supply;
        price *= (0.5 + supplyDemandRatio);
        
        // Apply volatility (random market fluctuation)
        const fluctuation = (Math.random() - 0.5) * 2 * item.volatility;
        price *= (1 + fluctuation);
        
        // Apply seasonal effects
        const seasonal = this.economicFactors.seasonalMultipliers[itemName] || 1;
        price *= seasonal;
        
        return Math.max(1, Math.floor(price));
    }

    updateMarketConditions() {
        // Simulate supply and demand changes
        Object.keys(this.marketPrices).forEach(itemName => {
            // Random supply/demand fluctuation
            if (Math.random() < 0.1) { // 10% chance per update
                this.economicFactors.supply[itemName] = Math.max(10, Math.min(100, 
                    (this.economicFactors.supply[itemName] || 50) + (Math.random() - 0.5) * 20
                ));
                
                this.economicFactors.demand[itemName] = Math.max(10, Math.min(100,
                    (this.economicFactors.demand[itemName] || 50) + (Math.random() - 0.5) * 20
                ));
            }
        });
        
        // Simulate seasonal effects (simplified)
        const gameHour = this.worldBuilder.gameIntelligence.gameHour;
        if (gameHour >= 6 && gameHour <= 10) {
            // Morning - high demand for food and potions
            this.economicFactors.seasonalMultipliers['Food'] = 1.2;
            this.economicFactors.seasonalMultipliers['Health Potion'] = 1.1;
        } else if (gameHour >= 18 && gameHour <= 22) {
            // Evening - high demand for equipment
            this.economicFactors.seasonalMultipliers['Iron Sword'] = 1.1;
            this.economicFactors.seasonalMultipliers['Leather Armor'] = 1.1;
        }
    }

    executeTrade(seller, buyer, itemName, quantity, agreedPrice) {
        const trade = {
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            seller,
            buyer,
            item: itemName,
            quantity,
            price: agreedPrice,
            totalValue: agreedPrice * quantity,
            timestamp: Date.now()
        };
        
        this.tradeHistory.push(trade);
        
        // Update supply based on trade
        this.economicFactors.supply[itemName] = Math.max(10,
            (this.economicFactors.supply[itemName] || 50) - (quantity * 2)
        );
        
        console.log(`Trade executed: ${seller} sold ${quantity}x ${itemName} to ${buyer} for ${trade.totalValue} gold`);
        return trade;
    }

    getMarketSummary() {
        const summary = {};
        
        Object.keys(this.marketPrices).forEach(itemName => {
            summary[itemName] = {
                currentPrice: this.calculateCurrentPrice(itemName),
                basePrice: this.marketPrices[itemName].basePrice,
                category: this.marketPrices[itemName].category,
                supply: this.economicFactors.supply[itemName] || 50,
                demand: this.economicFactors.demand[itemName] || 50,
                trend: this.calculatePriceTrend(itemName)
            };
        });
        
        return summary;
    }

    calculatePriceTrend(itemName) {
        const recentTrades = this.tradeHistory
            .filter(trade => trade.item === itemName)
            .slice(-5); // Last 5 trades
        
        if (recentTrades.length < 2) return 'stable';
        
        const priceChange = recentTrades[recentTrades.length - 1].price - recentTrades[0].price;
        const percentChange = (priceChange / recentTrades[0].price) * 100;
        
        if (percentChange > 5) return 'rising';
        if (percentChange < -5) return 'falling';
        return 'stable';
    }
}

class OpenAI_NPCSystem {
    constructor(worldBuilder) {
        this.worldBuilder = worldBuilder;
        this.aiNPCs = new Map(); // Track which NPCs are AI-controlled
        this.conversationHistory = new Map(); // Store conversation history for each AI NPC
        this.npcPersonalities = new Map(); // Store personality data for AI NPCs
        this.apiKey = null;
        this.loadApiKey();
    }

    async loadApiKey() {
        try {
            // Try to load API key from environment or local storage
            this.apiKey = localStorage.getItem('openai_api_key') || process.env.OPENAI_API_KEY;
            if (!this.apiKey) {
                console.warn('⚠️ OpenAI API key not found. AI NPCs will not function until key is provided.');
                console.log('💡 Set API key with: openAI_NPCs.setApiKey("your-api-key-here")');
            } else {
                console.log('✅ OpenAI API key loaded successfully');
            }
        } catch (error) {
            console.warn('⚠️ Could not load OpenAI API key:', error.message);
        }
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('openai_api_key', apiKey);
        console.log('✅ OpenAI API key set and saved');
    }

    // Convert an NPC to be AI-controlled
    makeNPCAIControlled(x, y, personality = {}) {
        const npcKey = `${x},${y}`;
        const tile = this.worldBuilder.worldData[y] && this.worldBuilder.worldData[y][x];
        
        if (!tile || !tile.type || !tile.type.startsWith('npc_')) {
            console.error('❌ No NPC found at coordinates:', x, y);
            return false;
        }

        // Default personality based on NPC type
        const defaultPersonality = this.generateDefaultPersonality(tile.type);
        const finalPersonality = { ...defaultPersonality, ...personality };

        this.aiNPCs.set(npcKey, {
            x, y,
            type: tile.type,
            personality: finalPersonality,
            isActive: true,
            createdAt: Date.now()
        });

        this.conversationHistory.set(npcKey, []);
        this.npcPersonalities.set(npcKey, finalPersonality);

        console.log(`🤖 NPC at (${x}, ${y}) is now AI-controlled with personality:`, finalPersonality.role);
        return true;
    }

    generateDefaultPersonality(npcType) {
        const personalityMap = {
            npc_shopkeeper: {
                role: "Friendly Merchant",
                description: "You are a helpful shopkeeper in a medieval fantasy world. You sell various goods and are always eager to help customers. You're knowledgeable about local trade, prices, and gossip. You speak in a warm, business-minded way.",
                traits: ["helpful", "business-minded", "knowledgeable", "friendly"],
                knowledge: ["local prices", "trade routes", "customer needs", "inventory management"],
                greeting: "Welcome to my shop! How can I help you today?"
            },
            npc_guard: {
                role: "Dutiful Town Guard",
                description: "You are a town guard responsible for keeping the peace. You're alert, professional, and take your duties seriously. You know about local security, laws, and potential threats. You speak with authority but fairly.",
                traits: ["dutiful", "alert", "professional", "fair"],
                knowledge: ["local laws", "security threats", "patrol routes", "town regulations"],
                greeting: "State your business, citizen. How can I assist you?"
            },
            npc_blacksmith: {
                role: "Master Craftsman",
                description: "You are a skilled blacksmith who creates and repairs weapons and armor. You're passionate about your craft and take pride in quality work. You know about metals, forging techniques, and weapon maintenance.",
                traits: ["skilled", "passionate", "proud", "hardworking"],
                knowledge: ["metalworking", "weapon crafting", "armor repair", "material quality"],
                greeting: "Ah, another customer! Need some fine metalwork done?"
            },
            npc_mage: {
                role: "Wise Wizard",
                description: "You are a learned mage with deep knowledge of magic and arcane arts. You speak with wisdom and sometimes in riddles. You're interested in magical theory, ancient knowledge, and helping others understand magic.",
                traits: ["wise", "mysterious", "knowledgeable", "patient"],
                knowledge: ["magical theory", "spell casting", "ancient lore", "magical items"],
                greeting: "Greetings, seeker of knowledge. What brings you to study the arcane arts?"
            },
            npc_priest: {
                role: "Holy Cleric",
                description: "You are a devoted priest who serves the divine and helps the community. You're compassionate, wise, and always ready to offer guidance or healing. You speak with kindness and faith.",
                traits: ["compassionate", "wise", "faithful", "helpful"],
                knowledge: ["divine magic", "healing", "moral guidance", "religious ceremonies"],
                greeting: "Blessings upon you, child. How may I serve you today?"
            },
            npc_civilian: {
                role: "Local Townsperson",
                description: "You are an ordinary citizen living in this fantasy town. You're friendly and know local gossip, daily life, and community happenings. You speak casually and are curious about visitors.",
                traits: ["friendly", "curious", "social", "helpful"],
                knowledge: ["local gossip", "daily life", "community events", "town history"],
                greeting: "Hello there! Don't think I've seen you around before. Welcome to our town!"
            }
        };

        return personalityMap[npcType] || personalityMap.npc_civilian;
    }

    // Remove AI control from an NPC
    removeAIControl(x, y) {
        const npcKey = `${x},${y}`;
        if (this.aiNPCs.has(npcKey)) {
            this.aiNPCs.delete(npcKey);
            this.conversationHistory.delete(npcKey);
            this.npcPersonalities.delete(npcKey);
            console.log(`🔄 NPC at (${x}, ${y}) is no longer AI-controlled`);
            return true;
        }
        return false;
    }

    // Check if an NPC is AI-controlled
    isAIControlled(x, y) {
        return this.aiNPCs.has(`${x},${y}`);
    }

    // Get conversation context for AI
    buildConversationContext(npcKey) {
        const aiNPC = this.aiNPCs.get(npcKey);
        const history = this.conversationHistory.get(npcKey) || [];
        const personality = this.npcPersonalities.get(npcKey);
        
        if (!aiNPC || !personality) return null;

        // Get current game state context
        const gameTime = this.worldBuilder.gameIntelligence.gameHour;
        const weather = this.worldBuilder.gameIntelligence.weather;
        const hour = Math.floor(gameTime);
        const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

        // Build context
        const context = {
            personality: personality,
            currentTime: `${timeOfDay} (${hour}:00)`,
            weather: weather,
            location: "in a medieval fantasy town",
            conversationHistory: history.slice(-6), // Last 6 exchanges
            instructions: [
                `You are ${personality.role}. ${personality.description}`,
                `Current time: ${timeOfDay}, Weather: ${weather}`,
                `Keep responses concise (2-3 sentences max)`,
                `Stay in character and use your knowledge: ${personality.knowledge.join(', ')}`,
                `Your traits: ${personality.traits.join(', ')}`,
                `This is a fantasy medieval setting with magic, monsters, and adventure`
            ]
        };

        return context;
    }

    // Talk to an AI-controlled NPC
    async talkToAI_NPC(x, y, playerMessage) {
        const npcKey = `${x},${y}`;
        
        if (!this.isAIControlled(x, y)) {
            console.error('❌ NPC is not AI-controlled');
            return null;
        }

        if (!this.apiKey) {
            console.error('❌ OpenAI API key not set');
            return { 
                response: "I seem to have lost my voice... (OpenAI API key not configured)",
                error: "No API key"
            };
        }

        try {
            console.log(`🤖 Sending message to AI NPC: "${playerMessage}"`);
            
            const context = this.buildConversationContext(npcKey);
            const history = this.conversationHistory.get(npcKey) || [];
            
            // Build messages for OpenAI API
            const messages = [
                {
                    role: "system",
                    content: context.instructions.join('\n')
                }
            ];

            // Add conversation history
            history.forEach(exchange => {
                messages.push({ role: "user", content: exchange.player });
                messages.push({ role: "assistant", content: exchange.npc });
            });

            // Add current message
            messages.push({ role: "user", content: playerMessage });

            // Call OpenAI API
            const response = await this.callOpenAI(messages);
            
            if (response.success) {
                // Store conversation
                history.push({
                    player: playerMessage,
                    npc: response.message,
                    timestamp: Date.now()
                });
                
                // Keep only last 10 exchanges
                if (history.length > 10) {
                    history.splice(0, history.length - 10);
                }
                
                this.conversationHistory.set(npcKey, history);
                
                console.log(`💬 AI NPC responded: "${response.message}"`);
                return {
                    response: response.message,
                    personality: context.personality.role,
                    success: true
                };
            } else {
                console.error('❌ OpenAI API error:', response.error);
                return {
                    response: `*seems distracted and mumbles something unclear* (AI Error: ${response.error})`,
                    error: response.error
                };
            }
            
        } catch (error) {
            console.error('❌ Error talking to AI NPC:', error);
            return {
                response: "*looks confused and doesn't respond* (Connection error)",
                error: error.message
            };
        }
    }

    // Call OpenAI API
    async callOpenAI(messages) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                    max_tokens: 150,
                    temperature: 0.8,
                    presence_penalty: 0.6,
                    frequency_penalty: 0.5
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                message: data.choices[0]?.message?.content?.trim() || "I'm not sure what to say...",
                usage: data.usage
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all AI-controlled NPCs
    getAINPCs() {
        return Array.from(this.aiNPCs.entries()).map(([key, npc]) => ({
            key,
            ...npc,
            conversationCount: (this.conversationHistory.get(key) || []).length
        }));
    }

    // Get conversation history for an AI NPC
    getConversationHistory(x, y) {
        const npcKey = `${x},${y}`;
        return this.conversationHistory.get(npcKey) || [];
    }

    // Clear conversation history for an AI NPC
    clearConversationHistory(x, y) {
        const npcKey = `${x},${y}`;
        this.conversationHistory.set(npcKey, []);
        console.log(`🗑️ Cleared conversation history for NPC at (${x}, ${y})`);
    }

    // Update personality for an AI NPC
    updatePersonality(x, y, newPersonality) {
        const npcKey = `${x},${y}`;
        if (this.aiNPCs.has(npcKey)) {
            const currentPersonality = this.npcPersonalities.get(npcKey);
            const updatedPersonality = { ...currentPersonality, ...newPersonality };
            this.npcPersonalities.set(npcKey, updatedPersonality);
            
            // Update the AI NPC record
            const aiNPC = this.aiNPCs.get(npcKey);
            aiNPC.personality = updatedPersonality;
            this.aiNPCs.set(npcKey, aiNPC);
            
            console.log(`✏️ Updated personality for AI NPC at (${x}, ${y})`);
            return true;
        }
        return false;
    }
}

class AutoSaveSystem {
    constructor(worldBuilder) {
        this.worldBuilder = worldBuilder;
        this.autoSaveInterval = null;
        this.autoSaveEnabled = true;
        this.saveInterval = 30000; // 30 seconds default
        this.maxBackups = 10; // Keep last 10 auto-saves
        this.lastSaveTime = null;
        this.changeCounter = 0;
        this.saveInProgress = false;
        
        // Load settings from localStorage
        this.loadSettings();
        
        // Track changes for smart saving
        this.setupChangeTracking();
        
        // Create save status indicator
        this.createSaveIndicator();
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('autoSaveSettings') || '{}');
            this.autoSaveEnabled = settings.enabled !== false; // Default to true
            this.saveInterval = settings.interval || 30000;
            this.maxBackups = settings.maxBackups || 10;
            
            console.log(`💾 Auto-save loaded: ${this.autoSaveEnabled ? 'Enabled' : 'Disabled'}, Interval: ${this.saveInterval/1000}s`);
        } catch (error) {
            console.warn('⚠️ Could not load auto-save settings:', error);
        }
    }

    saveSettings() {
        try {
            const settings = {
                enabled: this.autoSaveEnabled,
                interval: this.saveInterval,
                maxBackups: this.maxBackups
            };
            localStorage.setItem('autoSaveSettings', JSON.stringify(settings));
        } catch (error) {
            console.warn('⚠️ Could not save auto-save settings:', error);
        }
    }

    setupChangeTracking() {
        // Override the paint method to track changes
        const originalPaint = this.worldBuilder.paint.bind(this.worldBuilder);
        this.worldBuilder.paint = (...args) => {
            const result = originalPaint(...args);
            this.onWorldChange('tile_painted');
            return result;
        };

        // Track NPC additions/changes
        const originalMakeNPCAI = this.worldBuilder.openAI_NPCs.makeNPCAIControlled.bind(this.worldBuilder.openAI_NPCs);
        this.worldBuilder.openAI_NPCs.makeNPCAIControlled = (...args) => {
            const result = originalMakeNPCAI(...args);
            if (result) this.onWorldChange('npc_ai_changed');
            return result;
        };
    }

    onWorldChange(changeType) {
        this.changeCounter++;
        this.updateSaveIndicator('unsaved');
        
        // If many changes, trigger immediate save
        if (this.changeCounter >= 50) {
            console.log('💾 Many changes detected, triggering immediate save...');
            this.performSave('immediate_change_threshold');
        }
    }

    createSaveIndicator() {
        // Create save status indicator in the UI
        const indicator = document.createElement('div');
        indicator.id = 'autoSaveIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 1000;
            transition: all 0.3s ease;
            pointer-events: none;
        `;
        document.body.appendChild(indicator);
        
        this.updateSaveIndicator('loaded');
    }

    updateSaveIndicator(status) {
        const indicator = document.getElementById('autoSaveIndicator');
        if (!indicator) return;

        const now = new Date();
        const timeStr = now.toLocaleTimeString();

        switch (status) {
            case 'saving':
                indicator.innerHTML = '💾 Saving...';
                indicator.style.background = 'rgba(255, 165, 0, 0.9)';
                break;
            case 'saved':
                indicator.innerHTML = `✅ Saved ${timeStr}`;
                indicator.style.background = 'rgba(0, 128, 0, 0.9)';
                this.lastSaveTime = now;
                this.changeCounter = 0;
                break;
            case 'unsaved':
                const changes = this.changeCounter > 0 ? ` (${this.changeCounter} changes)` : '';
                indicator.innerHTML = `⚠️ Unsaved${changes}`;
                indicator.style.background = 'rgba(255, 69, 0, 0.9)';
                break;
            case 'error':
                indicator.innerHTML = '❌ Save Error';
                indicator.style.background = 'rgba(220, 20, 60, 0.9)';
                break;
            case 'loaded':
                indicator.innerHTML = '📁 Loaded';
                indicator.style.background = 'rgba(70, 130, 180, 0.9)';
                break;
            case 'disabled':
                indicator.innerHTML = '⏸️ Auto-save Disabled';
                indicator.style.background = 'rgba(128, 128, 128, 0.9)';
                break;
        }

        // Auto-hide success message after 3 seconds
        if (status === 'saved' || status === 'loaded') {
            setTimeout(() => {
                if (this.changeCounter === 0) {
                    indicator.style.opacity = '0.6';
                }
            }, 3000);
        } else {
            indicator.style.opacity = '1';
        }
    }

    startAutoSave() {
        if (!this.autoSaveEnabled) {
            console.log('⏸️ Auto-save is disabled');
            this.updateSaveIndicator('disabled');
            return;
        }

        this.stopAutoSave(); // Clear any existing interval

        this.autoSaveInterval = setInterval(() => {
            if (this.changeCounter > 0 && !this.saveInProgress) {
                console.log(`💾 Auto-save triggered (${this.changeCounter} changes)`);
                this.performSave('auto_save_interval');
            }
        }, this.saveInterval);

        console.log(`🔄 Auto-save started: Every ${this.saveInterval/1000} seconds`);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    async performSave(trigger = 'manual') {
        if (this.saveInProgress) {
            console.log('💾 Save already in progress, skipping...');
            return false;
        }

        this.saveInProgress = true;
        this.updateSaveIndicator('saving');

        try {
            // Generate save data
            const saveData = this.generateSaveData(trigger);
            
            // Save to localStorage as auto-save
            await this.saveToStorage(saveData);
            
            // Manage backups
            this.manageBackups();
            
            console.log(`✅ Auto-save completed (${trigger}): ${saveData.metadata.tiles} tiles, ${saveData.metadata.aiNPCs} AI NPCs`);
            this.updateSaveIndicator('saved');
            
            return true;
            
        } catch (error) {
            console.error('❌ Auto-save failed:', error);
            this.updateSaveIndicator('error');
            return false;
        } finally {
            this.saveInProgress = false;
        }
    }

    generateSaveData(trigger) {
        const timestamp = new Date().toISOString();
        
        // Count various elements for metadata
        let tileCount = 0;
        let buildingCount = 0;
        let npcCount = 0;
        
        for (let y = 0; y < this.worldBuilder.worldHeight; y++) {
            for (let x = 0; x < this.worldBuilder.worldWidth; x++) {
                const tile = this.worldBuilder.worldData[y][x];
                if (tile.type !== 'grass') {
                    tileCount++;
                    if (tile.type.includes('house') || tile.type.includes('shop') || tile.type.includes('bank')) {
                        buildingCount++;
                    }
                    if (tile.type.startsWith('npc_')) {
                        npcCount++;
                    }
                }
            }
        }

        return {
            version: '3.0_autosave',
            name: 'RuneScape World (Auto-save)',
            timestamp: timestamp,
            trigger: trigger,
            width: this.worldBuilder.worldWidth,
            height: this.worldBuilder.worldHeight,
            tileSize: this.worldBuilder.tileSize,
            worldData: this.worldBuilder.worldData,
            
            // Game intelligence data
            gameState: {
                gameTime: this.worldBuilder.gameIntelligence.gameTime,
                gameHour: this.worldBuilder.gameIntelligence.gameHour,
                weather: this.worldBuilder.gameIntelligence.weather
            },
            
            // AI NPC data
            aiNPCs: {
                npcs: Array.from(this.worldBuilder.openAI_NPCs.aiNPCs.entries()),
                conversations: Array.from(this.worldBuilder.openAI_NPCs.conversationHistory.entries()),
                personalities: Array.from(this.worldBuilder.openAI_NPCs.npcPersonalities.entries())
            },
            
            // Quest data
            quests: {
                active: this.worldBuilder.questSystem.activeQuests,
                completed: this.worldBuilder.questSystem.completedQuests,
                dynamic: this.worldBuilder.questSystem.dynamicQuests
            },
            
            // Trading data
            trading: {
                history: this.worldBuilder.tradingSystem.tradeHistory.slice(-100), // Last 100 trades
                economicFactors: this.worldBuilder.tradingSystem.economicFactors
            },
            
            metadata: {
                tiles: tileCount,
                buildings: buildingCount,
                npcs: npcCount,
                aiNPCs: this.worldBuilder.openAI_NPCs.aiNPCs.size,
                activeQuests: this.worldBuilder.questSystem.activeQuests.length,
                completedQuests: this.worldBuilder.questSystem.completedQuests.length,
                trades: this.worldBuilder.tradingSystem.tradeHistory.length
            }
        };
    }

    async saveToStorage(saveData) {
        const saveKey = `runescape_autosave_${Date.now()}`;
        const compressed = JSON.stringify(saveData);
        
        try {
            localStorage.setItem(saveKey, compressed);
            localStorage.setItem('runescape_latest_autosave', saveKey);
            
            // Also update the regular save for compatibility
            localStorage.setItem('runescape_world_autosave', compressed);
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('💾 Storage quota exceeded, cleaning old saves...');
                this.cleanOldSaves();
                localStorage.setItem(saveKey, compressed);
                localStorage.setItem('runescape_latest_autosave', saveKey);
            } else {
                throw error;
            }
        }
    }

    manageBackups() {
        try {
            // Get all auto-save keys
            const autoSaveKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('runescape_autosave_')) {
                    autoSaveKeys.push(key);
                }
            }
            
            // Sort by timestamp (newest first)
            autoSaveKeys.sort((a, b) => {
                const timeA = parseInt(a.split('_').pop());
                const timeB = parseInt(b.split('_').pop());
                return timeB - timeA;
            });
            
            // Remove excess backups
            if (autoSaveKeys.length > this.maxBackups) {
                const toDelete = autoSaveKeys.slice(this.maxBackups);
                toDelete.forEach(key => {
                    localStorage.removeItem(key);
                });
                console.log(`🗑️ Cleaned ${toDelete.length} old auto-saves`);
            }
            
        } catch (error) {
            console.warn('⚠️ Could not manage backups:', error);
        }
    }

    cleanOldSaves() {
        // Remove old auto-saves to free space
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('runescape_autosave_')) {
                keysToRemove.push(key);
            }
        }
        
        // Keep only the 3 most recent
        keysToRemove.sort((a, b) => {
            const timeA = parseInt(a.split('_').pop());
            const timeB = parseInt(b.split('_').pop());
            return timeB - timeA;
        });
        
        const toDelete = keysToRemove.slice(3);
        toDelete.forEach(key => localStorage.removeItem(key));
        
        console.log(`🧹 Cleaned ${toDelete.length} old saves to free space`);
    }

    loadLatestAutoSave() {
        try {
            const latestKey = localStorage.getItem('runescape_latest_autosave');
            if (!latestKey) {
                // Try the regular auto-save key
                const data = localStorage.getItem('runescape_world_autosave');
                if (data) {
                    return this.loadSaveData(JSON.parse(data));
                }
                return false;
            }
            
            const saveData = localStorage.getItem(latestKey);
            if (!saveData) return false;
            
            return this.loadSaveData(JSON.parse(saveData));
            
        } catch (error) {
            console.error('❌ Could not load auto-save:', error);
            return false;
        }
    }

    loadSaveData(saveData) {
        try {
            // Load world data
            this.worldBuilder.worldWidth = saveData.width;
            this.worldBuilder.worldHeight = saveData.height;
            this.worldBuilder.tileSize = saveData.tileSize;
            this.worldBuilder.worldData = saveData.worldData;
            
            // Update UI
            document.getElementById('worldWidth').value = saveData.width;
            document.getElementById('worldHeight').value = saveData.height;
            document.getElementById('tileSize').value = saveData.tileSize;
            
            // Load game state
            if (saveData.gameState) {
                this.worldBuilder.gameIntelligence.gameTime = saveData.gameState.gameTime || 0;
                this.worldBuilder.gameIntelligence.gameHour = saveData.gameState.gameHour || 8;
                this.worldBuilder.gameIntelligence.weather = saveData.gameState.weather || 'clear';
            }
            
            // Load AI NPCs
            if (saveData.aiNPCs) {
                this.worldBuilder.openAI_NPCs.aiNPCs = new Map(saveData.aiNPCs.npcs || []);
                this.worldBuilder.openAI_NPCs.conversationHistory = new Map(saveData.aiNPCs.conversations || []);
                this.worldBuilder.openAI_NPCs.npcPersonalities = new Map(saveData.aiNPCs.personalities || []);
            }
            
            // Load quests
            if (saveData.quests) {
                this.worldBuilder.questSystem.activeQuests = saveData.quests.active || [];
                this.worldBuilder.questSystem.completedQuests = saveData.quests.completed || [];
                this.worldBuilder.questSystem.dynamicQuests = saveData.quests.dynamic || [];
            }
            
            // Load trading data
            if (saveData.trading) {
                this.worldBuilder.tradingSystem.tradeHistory = saveData.trading.history || [];
                this.worldBuilder.tradingSystem.economicFactors = saveData.trading.economicFactors || { supply: {}, demand: {}, seasonalMultipliers: {} };
            }
            
            // Update status and render
            this.worldBuilder.updateStatus();
            this.worldBuilder.render();
            
            const metadata = saveData.metadata || {};
            console.log(`📁 Auto-save loaded: ${metadata.tiles || 0} tiles, ${metadata.aiNPCs || 0} AI NPCs, ${metadata.activeQuests || 0} active quests`);
            this.updateSaveIndicator('loaded');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error loading save data:', error);
            this.updateSaveIndicator('error');
            return false;
        }
    }

    // Configuration methods
    setAutoSaveEnabled(enabled) {
        this.autoSaveEnabled = enabled;
        this.saveSettings();
        
        if (enabled) {
            this.startAutoSave();
        } else {
            this.stopAutoSave();
            this.updateSaveIndicator('disabled');
        }
        
        console.log(`💾 Auto-save ${enabled ? 'enabled' : 'disabled'}`);
    }

    setAutoSaveInterval(seconds) {
        this.saveInterval = seconds * 1000;
        this.saveSettings();
        
        if (this.autoSaveEnabled) {
            this.startAutoSave(); // Restart with new interval
        }
        
        console.log(`⏰ Auto-save interval set to ${seconds} seconds`);
    }

    setMaxBackups(max) {
        this.maxBackups = max;
        this.saveSettings();
        this.manageBackups(); // Clean up if needed
        
        console.log(`📁 Max backups set to ${max}`);
    }

    getAutoSaveInfo() {
        const backupCount = Object.keys(localStorage).filter(key => key.startsWith('runescape_autosave_')).length;
        
        return {
            enabled: this.autoSaveEnabled,
            interval: this.saveInterval / 1000,
            maxBackups: this.maxBackups,
            currentBackups: backupCount,
            changesPending: this.changeCounter,
            lastSaveTime: this.lastSaveTime,
            saveInProgress: this.saveInProgress
        };
    }

    listAutoSaves() {
        const saves = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('runescape_autosave_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    saves.push({
                        key,
                        timestamp: data.timestamp,
                        trigger: data.trigger,
                        metadata: data.metadata
                    });
                } catch (error) {
                    console.warn(`⚠️ Could not parse save: ${key}`);
                }
            }
        }
        
        return saves.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
}

// Initialize game intelligence when world builder is ready
window.addEventListener('load', function() {
    if (typeof worldBuilder !== 'undefined') {
        // Set up periodic updates for game intelligence
        setInterval(() => {
            if (worldBuilder.gameIntelligence) {
                worldBuilder.gameIntelligence.update();
                worldBuilder.npcAI.updateNPCAI();
                worldBuilder.tradingSystem.updateMarketConditions();
            }
        }, 5000); // Update every 5 seconds
        
        // Add intelligent console commands for debugging and testing
        window.gameCommands = {
            // Game Intelligence Commands
            analyzeWorld: () => {
                const analysis = worldBuilder.gameIntelligence.analyzeWorldState();
                console.log('🌍 World Analysis:', analysis);
                if (analysis.suggestions.length > 0) {
                    console.log('💡 Suggestions:');
                    analysis.suggestions.forEach((suggestion, i) => console.log(`  ${i + 1}. ${suggestion}`));
                }
                return analysis;
            },
            
            getGameTime: () => {
                const hour = Math.floor(worldBuilder.gameIntelligence.gameHour);
                const minute = Math.floor((worldBuilder.gameIntelligence.gameHour % 1) * 60);
                const weather = worldBuilder.gameIntelligence.weather;
                console.log(`⏰ Game Time: ${hour}:${minute.toString().padStart(2, '0')} - Weather: ${weather}`);
                return { hour, minute, weather };
            },
            
            setWeather: (newWeather) => {
                worldBuilder.gameIntelligence.weather = newWeather;
                console.log(`🌤️ Weather changed to: ${newWeather}`);
            },
            
            // NPC AI Commands
            talkToNPC: (x, y) => {
                const tile = worldBuilder.worldData[y] && worldBuilder.worldData[y][x];
                if (tile && tile.type && tile.type.startsWith('npc_')) {
                    const npc = { x, y, type: tile.type };
                    const dialogue = worldBuilder.npcAI.generateContextualDialogue(npc);
                    const options = worldBuilder.npcAI.getDialogueOptions(npc);
                    console.log(`💬 NPC says: "${dialogue}"`);
                    console.log(`🗨️ Response options:`, options);
                    return { dialogue, options };
                } else {
                    console.log('❌ No NPC found at that location');
                    return null;
                }
            },
            
            getNPCMood: (x, y) => {
                const npcKey = `${x},${y}`;
                const state = worldBuilder.npcAI.npcStates.get(npcKey);
                if (state) {
                    console.log(`😊 NPC Mood: ${state.mood}/100 (Activity: ${state.currentActivity})`);
                    return state;
                } else {
                    console.log('❌ No NPC state found at that location');
                    return null;
                }
            },
            
            // Quest System Commands
            generateQuest: () => {
                const quest = worldBuilder.questSystem.generateDynamicQuest();
                console.log('📜 New Quest Generated:');
                console.log(`  Name: ${quest.name}`);
                console.log(`  Description: ${quest.description}`);
                console.log(`  Difficulty: ${quest.difficulty}`);
                console.log(`  Rewards: ${quest.rewards.experience} XP, ${quest.rewards.gold} gold`);
                return quest;
            },
            
            getAvailableQuests: () => {
                const quests = worldBuilder.questSystem.getAvailableQuests();
                console.log(`📋 Available Quests (${quests.length}):`);
                quests.forEach((quest, i) => {
                    console.log(`  ${i + 1}. ${quest.name} - ${quest.description}`);
                });
                return quests;
            },
            
            startQuest: (questIndex) => {
                const availableQuests = worldBuilder.questSystem.getAvailableQuests();
                if (questIndex >= 0 && questIndex < availableQuests.length) {
                    const quest = worldBuilder.questSystem.startQuest(availableQuests[questIndex]);
                    console.log(`✅ Started quest: ${quest.name}`);
                    return quest;
                } else {
                    console.log('❌ Invalid quest index');
                    return null;
                }
            },
            
            // Trading System Commands
            getMarketPrices: () => {
                const summary = worldBuilder.tradingSystem.getMarketSummary();
                console.log('💰 Market Summary:');
                Object.entries(summary).forEach(([item, data]) => {
                    const trend = data.trend === 'rising' ? '📈' : data.trend === 'falling' ? '📉' : '➡️';
                    console.log(`  ${item}: ${data.currentPrice}g ${trend} (Supply: ${data.supply}, Demand: ${data.demand})`);
                });
                return summary;
            },
            
            simulateTrade: (item, quantity = 1) => {
                const price = worldBuilder.tradingSystem.calculateCurrentPrice(item);
                if (price > 0) {
                    const trade = worldBuilder.tradingSystem.executeTrade('Player', 'Merchant', item, quantity, price);
                    console.log(`💰 Trade simulated: Sold ${quantity}x ${item} for ${trade.totalValue} gold`);
                    return trade;
                } else {
                    console.log('❌ Item not found in market');
                    return null;
                }
            },
            
            // Smart Building Placement
            suggestBuildingPlacement: (buildingType) => {
                const suggestions = worldBuilder.gameIntelligence.suggestOptimalPlacement(buildingType);
                console.log(`🏗️ Suggested locations for ${buildingType}:`);
                suggestions.forEach((suggestion, i) => {
                    console.log(`  ${i + 1}. (${suggestion.x}, ${suggestion.y}) - Score: ${suggestion.score} - ${suggestion.reason}`);
                });
                return suggestions;
            },
            
            // OpenAI NPC Commands
            setOpenAIKey: (apiKey) => {
                worldBuilder.openAI_NPCs.setApiKey(apiKey);
            },
            
            makeNPCAI: (x, y, customPersonality = {}) => {
                const result = worldBuilder.openAI_NPCs.makeNPCAIControlled(x, y, customPersonality);
                if (result) {
                    console.log(`🤖 NPC at (${x}, ${y}) is now controlled by OpenAI`);
                }
                return result;
            },
            
            removeNPCAI: (x, y) => {
                const result = worldBuilder.openAI_NPCs.removeAIControl(x, y);
                if (result) {
                    console.log(`🔄 NPC at (${x}, ${y}) is no longer AI-controlled`);
                }
                return result;
            },
            
            talkToAI: async (x, y, message) => {
                const response = await worldBuilder.openAI_NPCs.talkToAI_NPC(x, y, message);
                if (response && response.success) {
                    console.log(`💬 ${response.personality}: "${response.response}"`);
                } else if (response) {
                    console.log(`⚠️ Error: ${response.response}`);
                }
                return response;
            },
            
            getAINPCs: () => {
                const aiNPCs = worldBuilder.openAI_NPCs.getAINPCs();
                console.log(`🤖 AI-Controlled NPCs (${aiNPCs.length}):`);
                aiNPCs.forEach((npc, i) => {
                    console.log(`  ${i + 1}. (${npc.x}, ${npc.y}) - ${npc.personality.role} - ${npc.conversationCount} conversations`);
                });
                return aiNPCs;
            },
            
            getAIHistory: (x, y) => {
                const history = worldBuilder.openAI_NPCs.getConversationHistory(x, y);
                console.log(`📜 Conversation History for NPC at (${x}, ${y}):`);
                history.forEach((exchange, i) => {
                    console.log(`  ${i + 1}. Player: "${exchange.player}"`);
                    console.log(`     NPC: "${exchange.npc}"`);
                });
                return history;
            },
            
            clearAIHistory: (x, y) => {
                worldBuilder.openAI_NPCs.clearConversationHistory(x, y);
            },
            
            updateAIPersonality: (x, y, personality) => {
                const result = worldBuilder.openAI_NPCs.updatePersonality(x, y, personality);
                if (result) {
                    console.log(`✏️ Updated personality for AI NPC at (${x}, ${y})`);
                }
                return result;
            },
            
            // Auto-Save Commands
            saveNow: () => {
                return worldBuilder.autoSave.performSave('manual_command');
            },
            
            loadAutoSave: () => {
                const result = worldBuilder.autoSave.loadLatestAutoSave();
                if (result) {
                    console.log('📁 Latest auto-save loaded successfully');
                } else {
                    console.log('❌ No auto-save found or failed to load');
                }
                return result;
            },
            
            autoSaveInfo: () => {
                const info = worldBuilder.autoSave.getAutoSaveInfo();
                console.log('💾 Auto-Save Status:');
                console.log(`  Enabled: ${info.enabled}`);
                console.log(`  Interval: ${info.interval} seconds`);
                console.log(`  Max Backups: ${info.maxBackups}`);
                console.log(`  Current Backups: ${info.currentBackups}`);
                console.log(`  Changes Pending: ${info.changesPending}`);
                console.log(`  Last Save: ${info.lastSaveTime ? info.lastSaveTime.toLocaleString() : 'Never'}`);
                console.log(`  Save In Progress: ${info.saveInProgress}`);
                return info;
            },
            
            listAutoSaves: () => {
                const saves = worldBuilder.autoSave.listAutoSaves();
                console.log(`📂 Auto-Save History (${saves.length} saves):`);
                saves.forEach((save, i) => {
                    const date = new Date(save.timestamp).toLocaleString();
                    const meta = save.metadata || {};
                    console.log(`  ${i + 1}. ${date} (${save.trigger}) - ${meta.tiles || 0} tiles, ${meta.aiNPCs || 0} AI NPCs`);
                });
                return saves;
            },
            
            enableAutoSave: (enabled = true) => {
                worldBuilder.autoSave.setAutoSaveEnabled(enabled);
            },
            
            setAutoSaveInterval: (seconds) => {
                worldBuilder.autoSave.setAutoSaveInterval(seconds);
            },
            
            setMaxBackups: (max) => {
                worldBuilder.autoSave.setMaxBackups(max);
            },
            
            // Help command
            help: () => {
                console.log('🎮 Available Game Commands:');
                console.log('');
                console.log('🌍 World Analysis:');
                console.log('  📊 analyzeWorld() - Analyze current world state');
                console.log('  ⏰ getGameTime() - Get current game time and weather');
                console.log('  🌤️ setWeather(weather) - Change weather (clear/cloudy/rainy/stormy)');
                console.log('  🏗️ suggestBuildingPlacement(type) - Get optimal building locations');
                console.log('');
                console.log('🤖 Regular NPC Interactions:');
                console.log('  💬 talkToNPC(x, y) - Talk to NPC at coordinates');
                console.log('  😊 getNPCMood(x, y) - Check NPC mood and activity');
                console.log('');
                console.log('🧠 OpenAI NPCs:');
                console.log('  🔑 setOpenAIKey("api-key") - Set your OpenAI API key');
                console.log('  🤖 makeNPCAI(x, y) - Make NPC AI-controlled');
                console.log('  🔄 removeNPCAI(x, y) - Remove AI control from NPC');
                console.log('  💭 talkToAI(x, y, "message") - Talk to AI NPC');
                console.log('  📋 getAINPCs() - List all AI-controlled NPCs');
                console.log('  📜 getAIHistory(x, y) - View conversation history');
                console.log('  🗑️ clearAIHistory(x, y) - Clear conversation history');
                console.log('  ✏️ updateAIPersonality(x, y, {personality}) - Update AI personality');
                console.log('');
                console.log('📜 Quest System:');
                console.log('  📜 generateQuest() - Generate a new random quest');
                console.log('  📋 getAvailableQuests() - List all available quests');
                console.log('  ✅ startQuest(index) - Start quest by index');
                console.log('');
                console.log('💰 Trading System:');
                console.log('  💰 getMarketPrices() - View current market prices');
                console.log('  🔄 simulateTrade(item, quantity) - Simulate a trade');
                console.log('');
                console.log('💾 Auto-Save System:');
                console.log('  💾 saveNow() - Force save immediately');
                console.log('  📁 loadAutoSave() - Load latest auto-save');
                console.log('  📊 autoSaveInfo() - View auto-save status');
                console.log('  📂 listAutoSaves() - List all auto-saves');
                console.log('  ⚙️ enableAutoSave(true/false) - Enable/disable auto-save');
                console.log('  ⏰ setAutoSaveInterval(seconds) - Set save interval');
                console.log('  📁 setMaxBackups(number) - Set max backup count');
                console.log('');
                console.log('💡 Examples:');
                console.log('  gameCommands.setOpenAIKey("sk-your-api-key-here")');
                console.log('  gameCommands.makeNPCAI(10, 15)');
                console.log('  gameCommands.talkToAI(10, 15, "Hello! What do you sell?")');
                console.log('  gameCommands.setAutoSaveInterval(60) // Save every minute');
            }
        };
        
        // Add smart building placement intelligence
        worldBuilder.gameIntelligence.suggestOptimalPlacement = function(buildingType) {
            const suggestions = [];
            const analysis = this.analyzeWorldState();
            
            // Score potential locations
            for (let y = 1; y < this.worldBuilder.worldHeight - 1; y++) {
                for (let x = 1; x < this.worldBuilder.worldWidth - 1; x++) {
                    const score = this.scoreLocation(x, y, buildingType, analysis);
                    if (score > 50) { // Only suggest good locations
                        suggestions.push({
                            x, y, score: Math.round(score),
                            reason: this.getPlacementReason(x, y, buildingType, score)
                        });
                    }
                }
            }
            
            return suggestions.sort((a, b) => b.score - a.score).slice(0, 5); // Top 5 suggestions
        };
        
        worldBuilder.gameIntelligence.scoreLocation = function(x, y, buildingType, analysis) {
            const tile = this.worldBuilder.worldData[y][x];
            
            // Can't build on occupied tiles
            if (tile.type !== 'grass') return 0;
            
            let score = 50; // Base score
            
            // Check surrounding area
            const nearbyBuildings = this.countNearbyBuildings(x, y, 3);
            const nearbyNPCs = this.countNearbyNPCs(x, y, 5);
            const nearbyResources = this.countNearbyResources(x, y, 4);
            
            // Building-specific scoring
            switch (buildingType) {
                case 'bank':
                    score += nearbyBuildings * 10; // Banks want to be near other buildings
                    score += nearbyNPCs * 5; // And near NPCs
                    break;
                case 'general_store':
                    score += nearbyBuildings * 8;
                    score += nearbyNPCs * 8;
                    break;
                case 'house':
                    score += nearbyBuildings * 3; // Houses want some neighbors but not too many
                    score -= nearbyBuildings > 5 ? (nearbyBuildings - 5) * 5 : 0;
                    break;
                case 'magic_shop':
                    score += nearbyResources * 5; // Magic shops near resources
                    score += nearbyBuildings * 4;
                    break;
            }
            
            // Avoid overcrowding
            if (nearbyBuildings > 8) score -= 20;
            
            // Prefer areas with some existing development
            if (nearbyBuildings === 0) score -= 15;
            
            return Math.max(0, score);
        };
        
        worldBuilder.gameIntelligence.countNearbyBuildings = function(centerX, centerY, radius) {
            let count = 0;
            for (let y = Math.max(0, centerY - radius); y <= Math.min(this.worldBuilder.worldHeight - 1, centerY + radius); y++) {
                for (let x = Math.max(0, centerX - radius); x <= Math.min(this.worldBuilder.worldWidth - 1, centerX + radius); x++) {
                    const tile = this.worldBuilder.worldData[y][x];
                    if (tile.type && (tile.type.includes('house') || tile.type.includes('shop') || tile.type.includes('bank'))) {
                        count++;
                    }
                }
            }
            return count;
        };
        
        worldBuilder.gameIntelligence.countNearbyNPCs = function(centerX, centerY, radius) {
            let count = 0;
            for (let y = Math.max(0, centerY - radius); y <= Math.min(this.worldBuilder.worldHeight - 1, centerY + radius); y++) {
                for (let x = Math.max(0, centerX - radius); x <= Math.min(this.worldBuilder.worldWidth - 1, centerX + radius); x++) {
                    const tile = this.worldBuilder.worldData[y][x];
                    if (tile.type && tile.type.startsWith('npc_')) {
                        count++;
                    }
                }
            }
            return count;
        };
        
        worldBuilder.gameIntelligence.countNearbyResources = function(centerX, centerY, radius) {
            let count = 0;
            for (let y = Math.max(0, centerY - radius); y <= Math.min(this.worldBuilder.worldHeight - 1, centerY + radius); y++) {
                for (let x = Math.max(0, centerX - radius); x <= Math.min(this.worldBuilder.worldWidth - 1, centerX + radius); x++) {
                    const tile = this.worldBuilder.worldData[y][x];
                    if (tile.type && (tile.type.includes('tree') || tile.type.includes('rock') || tile.type === 'water')) {
                        count++;
                    }
                }
            }
            return count;
        };
        
        worldBuilder.gameIntelligence.getPlacementReason = function(x, y, buildingType, score) {
            const reasons = [];
            const nearbyBuildings = this.countNearbyBuildings(x, y, 3);
            const nearbyNPCs = this.countNearbyNPCs(x, y, 5);
            
            if (nearbyBuildings > 0) reasons.push('Good building density');
            if (nearbyNPCs > 0) reasons.push('Near NPCs');
            if (score > 80) reasons.push('Excellent location');
            else if (score > 65) reasons.push('Good location');
            else reasons.push('Decent location');
            
            return reasons.join(', ');
        };
        
        console.log('🎮 Game Intelligence Systems Loaded!');
        console.log('💡 Type gameCommands.help() for available commands');
        
        // Try to load latest auto-save on startup
        setTimeout(() => {
            if (worldBuilder.autoSave && worldBuilder.autoSave.loadLatestAutoSave()) {
                console.log('📁 Automatically loaded latest auto-save');
            }
        }, 1000); // Wait 1 second for everything to initialize
    }
});