class InteriorManager {
    constructor() {
        this.currentInterior = null;
        this.interiorCanvas = null;
        this.interiorCtx = null;
        this.isInBuilding = false;
        
        // Interior definitions
        this.interiors = {
            'bank': {
                image: 'bank_interior',
                width: 320,
                height: 240,
                exitX: 160, // Center bottom entrance
                exitY: 220,
                npcs: [
                    { type: 'banker', x: 160, y: 80, name: 'Bank Teller' } // Behind the counter in center
                ]
            },
            'general_store': {
                image: 'general_store_interior',
                width: 280,
                height: 200,
                exitX: 140, // Bottom center entrance
                exitY: 185,
                npcs: [
                    { type: 'shopkeeper', x: 70, y: 90, name: 'Shop Owner' } // Behind the left counter
                ]
            },
            'house': {
                image: 'house_interior',
                width: 240,
                height: 180,
                exitX: 120, // Bottom center entrance
                exitY: 165,
                npcs: [] // No NPCs in houses
            },
            'magic_shop': {
                image: 'magic_shop_interior',
                width: 300,
                height: 220,
                exitX: 150, // Bottom center entrance
                exitY: 205,
                npcs: [
                    { type: 'shopkeeper', x: 150, y: 100, name: 'Magic Shop Owner' } // Behind the central magical counter
                ]
            }
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for building entry attempts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isInBuilding) {
                this.attemptBuildingEntry();
            } else if (e.key === 'Escape' && this.isInBuilding) {
                this.exitBuilding();
            }
        });
    }
    
    attemptBuildingEntry() {
        if (!game || !game.player || !game.world) return;
        
        // Check if player is near any building
        for (let building of game.world.buildings) {
            const distance = Math.sqrt(
                (game.player.x - (building.x + building.width/2)) ** 2 + 
                (game.player.y - (building.y + building.height/2)) ** 2
            );
            
            if (distance < 80 && this.interiors[building.type]) {
                this.enterBuilding(building.type);
                return;
            }
        }
    }
    
    enterBuilding(buildingType) {
        if (!this.interiors[buildingType]) return;
        
        console.log(`Entering ${buildingType}`);
        this.isInBuilding = true;
        this.currentInterior = buildingType;
        
        // Hide main game canvas
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            gameCanvas.style.display = 'none';
        }
        
        // Create interior canvas
        this.createInteriorCanvas();
        
        // Position player at entrance
        const interior = this.interiors[buildingType];
        if (game && game.player) {
            game.player.interiorX = interior.exitX;
            game.player.interiorY = interior.exitY - 20; // Slightly above exit
        }
        
        // Show building-specific UI
        this.showBuildingUI(buildingType);
        
        // Start interior rendering
        this.renderInterior();
    }
    
    exitBuilding() {
        if (!this.isInBuilding) return;
        
        console.log(`Exiting ${this.currentInterior}`);
        this.isInBuilding = false;
        
        // Show main game canvas
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            gameCanvas.style.display = 'block';
        }
        
        // Remove interior canvas
        if (this.interiorCanvas && this.interiorCanvas.parentNode) {
            this.interiorCanvas.parentNode.removeChild(this.interiorCanvas);
        }
        this.interiorCanvas = null;
        this.interiorCtx = null;
        
        // Hide building-specific UI
        this.hideBuildingUI();
        
        this.currentInterior = null;
    }
    
    createInteriorCanvas() {
        const interior = this.interiors[this.currentInterior];
        
        // Create canvas element
        this.interiorCanvas = document.createElement('canvas');
        this.interiorCanvas.id = 'interiorCanvas';
        this.interiorCanvas.width = interior.width;
        this.interiorCanvas.height = interior.height;
        this.interiorCanvas.style.position = 'absolute';
        this.interiorCanvas.style.left = '50%';
        this.interiorCanvas.style.top = '50%';
        this.interiorCanvas.style.transform = 'translate(-50%, -50%)';
        this.interiorCanvas.style.border = '2px solid #8B4513';
        this.interiorCanvas.style.backgroundColor = '#000000';
        this.interiorCanvas.style.zIndex = '1000';
        
        // Add to page
        document.body.appendChild(this.interiorCanvas);
        this.interiorCtx = this.interiorCanvas.getContext('2d');
        
        // Add click handler for interior interactions
        this.interiorCanvas.addEventListener('click', (e) => {
            this.handleInteriorClick(e);
        });
        
        // Add exit instruction
        this.showExitInstructions();
    }
    
    showExitInstructions() {
        const instructions = document.createElement('div');
        instructions.id = 'interiorInstructions';
        instructions.innerHTML = `
            <div style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); 
                        background: rgba(139, 69, 19, 0.9); color: #FFD700; padding: 12px; 
                        border: 2px solid #8B4513; border-radius: 8px; font-family: Arial, sans-serif; 
                        font-size: 14px; z-index: 1001; text-align: center; box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
                <strong style="color: #FFFF00;">${this.currentInterior.replace('_', ' ').toUpperCase()}</strong><br>
                <span style="color: #FFFFFF;">Press ESC to exit • Click NPCs to interact</span>
            </div>
        `;
        document.body.appendChild(instructions);
    }
    
    renderInterior() {
        if (!this.interiorCtx || !this.currentInterior) return;
        
        const interior = this.interiors[this.currentInterior];
        
        // Clear canvas
        this.interiorCtx.fillStyle = '#000000';
        this.interiorCtx.fillRect(0, 0, interior.width, interior.height);
        
        // Draw interior background
        if (imageManager.isLoaded() && imageManager.hasImage(interior.image)) {
            imageManager.drawImage(this.interiorCtx, interior.image, 0, 0);
        } else {
            // Fallback background
            this.interiorCtx.fillStyle = '#8B4513';
            this.interiorCtx.fillRect(0, 0, interior.width, interior.height);
            
            this.interiorCtx.fillStyle = '#FFFFFF';
            this.interiorCtx.font = '16px Arial';
            this.interiorCtx.textAlign = 'center';
            this.interiorCtx.fillText('Interior: ' + this.currentInterior, interior.width/2, interior.height/2);
        }
        
        // Draw player if in interior
        if (game && game.player && game.player.interiorX !== undefined) {
            this.drawInteriorPlayer();
        }
        
        // Draw NPCs
        this.drawInteriorNPCs();
        
        // Draw exit marker
        this.drawExitMarker();
        
        // Continue rendering
        if (this.isInBuilding) {
            requestAnimationFrame(() => this.renderInterior());
        }
    }
    
    drawInteriorPlayer() {
        if (!game.player.interiorX) return;
        
        const x = game.player.interiorX;
        const y = game.player.interiorY;
        
        // Draw player as blue circle
        this.interiorCtx.fillStyle = '#0000FF';
        this.interiorCtx.beginPath();
        this.interiorCtx.arc(x, y, 8, 0, Math.PI * 2);
        this.interiorCtx.fill();
        
        // Player name
        this.interiorCtx.fillStyle = '#FFFFFF';
        this.interiorCtx.font = '10px Arial';
        this.interiorCtx.textAlign = 'center';
        this.interiorCtx.fillText(game.player.username || 'Player', x, y - 12);
    }
    
    drawInteriorNPCs() {
        const interior = this.interiors[this.currentInterior];
        
        for (let npc of interior.npcs) {
            // Draw NPC
            if (npc.type === 'banker') {
                this.interiorCtx.fillStyle = '#FFD700';
            } else if (npc.type === 'shopkeeper') {
                this.interiorCtx.fillStyle = '#8B4513';
            } else {
                this.interiorCtx.fillStyle = '#FF0000';
            }
            
            this.interiorCtx.beginPath();
            this.interiorCtx.arc(npc.x, npc.y, 10, 0, Math.PI * 2);
            this.interiorCtx.fill();
            
            // NPC name
            this.interiorCtx.fillStyle = '#FFFFFF';
            this.interiorCtx.font = '10px Arial';
            this.interiorCtx.textAlign = 'center';
            this.interiorCtx.fillText(npc.name, npc.x, npc.y - 15);
            
            // Interaction indicator
            this.interiorCtx.strokeStyle = '#FFFF00';
            this.interiorCtx.lineWidth = 2;
            this.interiorCtx.beginPath();
            this.interiorCtx.arc(npc.x, npc.y, 15, 0, Math.PI * 2);
            this.interiorCtx.stroke();
        }
    }
    
    drawExitMarker() {
        const interior = this.interiors[this.currentInterior];
        
        // Draw exit door
        this.interiorCtx.fillStyle = '#654321';
        this.interiorCtx.fillRect(interior.exitX - 15, interior.exitY - 5, 30, 10);
        
        // Exit text
        this.interiorCtx.fillStyle = '#00FF00';
        this.interiorCtx.font = '12px Arial';
        this.interiorCtx.textAlign = 'center';
        this.interiorCtx.fillText('EXIT', interior.exitX, interior.exitY - 10);
    }
    
    handleInteriorClick(e) {
        const rect = this.interiorCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const interior = this.interiors[this.currentInterior];
        
        // Check NPC interactions
        for (let npc of interior.npcs) {
            const distance = Math.sqrt((clickX - npc.x) ** 2 + (clickY - npc.y) ** 2);
            if (distance < 20) {
                this.interactWithNPC(npc);
                return;
            }
        }
        
        // Check exit interaction
        const exitDistance = Math.sqrt((clickX - interior.exitX) ** 2 + (clickY - interior.exitY) ** 2);
        if (exitDistance < 25) {
            this.exitBuilding();
            return;
        }
        
        // Move player
        if (game && game.player) {
            game.player.interiorX = clickX;
            game.player.interiorY = clickY;
        }
    }
    
    interactWithNPC(npc) {
        console.log(`Interacting with ${npc.name}`);
        
        if (npc.type === 'banker') {
            this.openBankInterface();
        } else if (npc.type === 'shopkeeper') {
            this.openShopInterface(npc);
        }
    }
    
    openBankInterface() {
        alert('Bank Interface\n\nThis would open the banking system where you can store and retrieve items.');
    }
    
    openShopInterface(npc) {
        alert(`Shop Interface - ${npc.name}\n\nThis would open the shop where you can buy and sell items.`);
    }
    
    showBuildingUI(buildingType) {
        // Add building-specific UI elements here
        // For now, just show instructions
    }
    
    hideBuildingUI() {
        // Remove building-specific UI
        const instructions = document.getElementById('interiorInstructions');
        if (instructions) {
            instructions.remove();
        }
    }
    
    // Check if player is in a building
    isPlayerInBuilding() {
        return this.isInBuilding;
    }
    
    getCurrentBuilding() {
        return this.currentInterior;
    }
}

// Global interior manager instance
const interiorManager = new InteriorManager();