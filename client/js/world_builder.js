// World Builder for RuneScape Clone
class WorldBuilder {
    constructor() {
        this.canvas = document.getElementById('worldCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.tileSize = 16;
        this.worldWidth = 100;
        this.worldHeight = 75;
        
        this.currentTool = 'paint';
        this.selectedType = 'grass';
        this.brushSize = 1;
        this.showGrid = true;
        
        this.camera = { x: 0, y: 0 };
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        
        // World data - 2D array of tiles
        this.worldData = [];
        this.initializeWorld();
        
        this.setupEventListeners();
        this.render();
        
        // Generate basic placeholder images and prompts
        this.generatePlaceholderAssets();
    }
    
    initializeWorld() {
        this.worldData = [];
        for (let y = 0; y < this.worldHeight; y++) {
            this.worldData[y] = [];
            for (let x = 0; x < this.worldWidth; x++) {
                this.worldData[y][x] = {
                    type: 'grass',
                    name: '',
                    properties: {}
                };
            }
        }
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
        
        if (this.currentTool === 'paint') {
            for (let dx = -Math.floor(this.brushSize/2); dx <= Math.floor(this.brushSize/2); dx++) {
                for (let dy = -Math.floor(this.brushSize/2); dy <= Math.floor(this.brushSize/2); dy++) {
                    const x = worldX + dx;
                    const y = worldY + dy;
                    if (x >= 0 && x < this.worldWidth && y >= 0 && y < this.worldHeight) {
                        this.worldData[y][x].type = this.selectedType;
                    }
                }
            }
        } else if (this.currentTool === 'erase') {
            for (let dx = -Math.floor(this.brushSize/2); dx <= Math.floor(this.brushSize/2); dx++) {
                for (let dy = -Math.floor(this.brushSize/2); dy <= Math.floor(this.brushSize/2); dy++) {
                    const x = worldX + dx;
                    const y = worldY + dy;
                    if (x >= 0 && x < this.worldWidth && y >= 0 && y < this.worldHeight) {
                        this.worldData[y][x].type = 'grass';
                    }
                }
            }
        } else if (this.currentTool === 'fill') {
            this.floodFill(worldX, worldY, this.worldData[worldY][worldX].type, this.selectedType);
        }
        
        this.render();
    }
    
    floodFill(x, y, oldType, newType) {
        if (x < 0 || x >= this.worldWidth || y < 0 || y >= this.worldHeight) return;
        if (this.worldData[y][x].type !== oldType || oldType === newType) return;
        
        this.worldData[y][x].type = newType;
        
        this.floodFill(x + 1, y, oldType, newType);
        this.floodFill(x - 1, y, oldType, newType);
        this.floodFill(x, y + 1, oldType, newType);
        this.floodFill(x, y - 1, oldType, newType);
    }
    
    render() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const startX = Math.floor(this.camera.x / this.tileSize);
        const startY = Math.floor(this.camera.y / this.tileSize);
        const endX = Math.min(this.worldWidth, startX + Math.ceil(this.canvas.width / this.tileSize) + 1);
        const endY = Math.min(this.worldHeight, startY + Math.ceil(this.canvas.height / this.tileSize) + 1);
        
        // Draw tiles
        for (let y = Math.max(0, startY); y < endY; y++) {
            for (let x = Math.max(0, startX); x < endX; x++) {
                const tile = this.worldData[y][x];
                const screenX = x * this.tileSize - this.camera.x;
                const screenY = y * this.tileSize - this.camera.y;
                
                // Get tile color
                const color = this.getTileColor(tile.type);
                this.ctx.fillStyle = color;
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                
                // Draw emoji/symbol for larger tiles
                if (this.tileSize >= 16) {
                    const symbol = this.getTileSymbol(tile.type);
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = `${Math.min(this.tileSize * 0.7, 16)}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(symbol, screenX + this.tileSize/2, screenY + this.tileSize * 0.7);
                }
            }
        }
        
        // Draw grid
        if (this.showGrid && this.tileSize >= 8) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
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
            grass: '#228B22',
            dirt: '#8B4513',
            stone: '#696969',
            water: '#4169E1',
            sand: '#F4A460',
            mud: '#654321',
            path: '#A0A0A0',
            lava: '#FF4500',
            bank: '#FFD700',
            shop: '#8B4513',
            house: '#D2B48C',
            castle: '#696969',
            tower: '#9932CC',
            well: '#708090',
            fence: '#8B4513',
            gate: '#654321',
            tree_oak: '#228B22',
            tree_pine: '#2F4F4F',
            tree_willow: '#90EE90',
            bush: '#32CD32',
            flowers: '#FF69B4',
            mushroom: '#FF0000',
            crystal: '#E6E6FA',
            rock: '#696969',
            altar: '#9932CC',
            anvil: '#2F2F2F',
            furnace: '#FF4500',
            chest: '#8B4513',
            statue: '#D3D3D3',
            bridge: '#8B4513',
            portal: '#9932CC',
            spawn: '#FFD700'
        };
        return colors[type] || '#888888';
    }
    
    getTileSymbol(type) {
        const symbols = {
            grass: '🌱',
            dirt: '🟫',
            stone: '⬜',
            water: '🌊',
            sand: '🟨',
            mud: '🟤',
            path: '🛤️',
            lava: '🔥',
            bank: '🏦',
            shop: '🏪',
            house: '🏠',
            castle: '🏰',
            tower: '🗼',
            well: '⚫',
            fence: '🚧',
            gate: '🚪',
            tree_oak: '🌳',
            tree_pine: '🌲',
            tree_willow: '🌿',
            bush: '🌳',
            flowers: '🌸',
            mushroom: '🍄',
            crystal: '💎',
            rock: '🪨',
            altar: '⛩️',
            anvil: '⚒️',
            furnace: '🔥',
            chest: '📦',
            statue: '🗿',
            bridge: '🌉',
            portal: '🌀',
            spawn: '⭐'
        };
        return symbols[type] || '?';
    }
    
    generatePlaceholderAssets() {
        // This will create placeholder images and AI prompts
        setTimeout(() => {
            this.createPlaceholderImages();
            this.createAIPrompts();
        }, 1000);
    }
    
    createPlaceholderImages() {
        // Create base placeholder images that can be replaced
        const imageTypes = [
            'grass', 'dirt', 'stone', 'water', 'sand', 'mud', 'path', 'lava',
            'bank', 'shop', 'house', 'castle', 'tower', 'well', 'fence', 'gate',
            'tree_oak', 'tree_pine', 'tree_willow', 'bush', 'flowers', 'mushroom',
            'crystal', 'rock', 'altar', 'anvil', 'furnace', 'chest', 'statue',
            'bridge', 'portal', 'spawn'
        ];
        
        console.log('Creating placeholder images and AI prompt files...');
        
        // This would generate actual images using canvas, but for now just log
        imageTypes.forEach(type => {
            console.log(`Would create: assets/world_builder/${type}.png`);
        });
    }
    
    createAIPrompts() {
        // Create AI prompts for each image type
        console.log('AI prompts would be created for each image type');
    }
}

// Global functions
function clearWorld() {
    if (confirm('Clear the entire world? This cannot be undone.')) {
        worldBuilder.initializeWorld();
        worldBuilder.render();
    }
}

function generateTerrain() {
    // Generate basic terrain with noise
    for (let y = 0; y < worldBuilder.worldHeight; y++) {
        for (let x = 0; x < worldBuilder.worldWidth; x++) {
            const noise = Math.random();
            let type = 'grass';
            
            if (noise < 0.1) type = 'water';
            else if (noise < 0.2) type = 'sand';
            else if (noise < 0.3) type = 'dirt';
            else if (noise < 0.4) type = 'stone';
            else if (noise < 0.5) type = 'path';
            
            worldBuilder.worldData[y][x].type = type;
        }
    }
    worldBuilder.render();
}

function saveWorld() {
    const worldData = {
        width: worldBuilder.worldWidth,
        height: worldBuilder.worldHeight,
        tileSize: worldBuilder.tileSize,
        tiles: worldBuilder.worldData
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
                
                document.getElementById('worldWidth').value = worldData.width;
                document.getElementById('worldHeight').value = worldData.height;
                document.getElementById('tileSize').value = worldData.tileSize;
                
                worldBuilder.render();
            } catch (error) {
                alert('Error loading world file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
});

function exportWorld() {
    saveWorld();
}

function exportImages() {
    alert('Image export feature - would generate all tile images with the current world layout');
}

function generateCode() {
    // Generate the world.js code with current world data
    let code = `// Generated World Data\n`;
    code += `const worldWidth = ${worldBuilder.worldWidth};\n`;
    code += `const worldHeight = ${worldBuilder.worldHeight};\n`;
    code += `const tileSize = ${worldBuilder.tileSize};\n\n`;
    code += `const worldTiles = [\n`;
    
    for (let y = 0; y < worldBuilder.worldHeight; y++) {
        code += '  [';
        for (let x = 0; x < worldBuilder.worldWidth; x++) {
            code += `"${worldBuilder.worldData[y][x].type}"`;
            if (x < worldBuilder.worldWidth - 1) code += ', ';
        }
        code += ']';
        if (y < worldBuilder.worldHeight - 1) code += ',';
        code += '\n';
    }
    code += '];\n';
    
    // Create download
    const dataBlob = new Blob([code], {type: 'text/javascript'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'generated_world.js';
    link.click();
}

// Prevent right-click context menu on canvas
document.getElementById('worldCanvas').addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Initialize world builder
let worldBuilder;
window.addEventListener('load', () => {
    worldBuilder = new WorldBuilder();
});