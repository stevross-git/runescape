class Minimap {
    constructor() {
        this.canvas = document.getElementById('minimapCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scale = 0.1; // How much of the world to show
        this.zoom = 1;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const zoomInBtn = document.getElementById('minimapZoomIn');
        const zoomOutBtn = document.getElementById('minimapZoomOut');
        const worldMapBtn = document.getElementById('worldMapBtn');
        const homeBtn = document.getElementById('homeBtn');

        zoomInBtn.addEventListener('click', () => {
            this.zoom = Math.min(this.zoom + 0.2, 2);
        });

        zoomOutBtn.addEventListener('click', () => {
            this.zoom = Math.max(this.zoom - 0.2, 0.5);
        });

        worldMapBtn.addEventListener('click', () => {
            this.toggleWorldMap();
        });

        homeBtn.addEventListener('click', () => {
            this.homeTeleport();
        });

        // Add click listener for minimap walking
        this.canvas.addEventListener('click', (e) => {
            this.handleMinimapClick(e);
        });
    }

    render(world, player) {
        if (!world || !player) return;

        // Clear canvas
        this.ctx.fillStyle = '#2e5d32'; // Forest green background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const effectiveScale = this.scale * this.zoom;

        // Draw world bounds
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        const worldSize = 800; // Assuming world is 800x600
        const mapWorldWidth = worldSize * effectiveScale;
        const mapWorldHeight = 600 * effectiveScale;
        this.ctx.strokeRect(
            centerX - mapWorldWidth / 2, 
            centerY - mapWorldHeight / 2, 
            mapWorldWidth, 
            mapWorldHeight
        );

        // Draw resources on minimap
        if (world.resources) {
            world.resources.forEach(resource => {
                const mapX = centerX + (resource.x - player.x) * effectiveScale;
                const mapY = centerY + (resource.y - player.y) * effectiveScale;

                // Only draw if within minimap bounds
                if (mapX >= 0 && mapX <= this.canvas.width && mapY >= 0 && mapY <= this.canvas.height) {
                    this.ctx.fillStyle = this.getResourceColor(resource);
                    this.ctx.fillRect(mapX - 1, mapY - 1, 2, 2);
                }
            });
        }

        // Draw NPCs on minimap
        if (world.npcs) {
            Object.values(world.npcs).forEach(npc => {
                const mapX = centerX + (npc.x - player.x) * effectiveScale;
                const mapY = centerY + (npc.y - player.y) * effectiveScale;

                // Only draw if within minimap bounds
                if (mapX >= 0 && mapX <= this.canvas.width && mapY >= 0 && mapY <= this.canvas.height) {
                    this.ctx.fillStyle = this.getNPCColor(npc);
                    this.ctx.fillRect(mapX - 1, mapY - 1, 3, 3);
                }
            });
        }

        // Draw other players
        if (world.otherPlayers) {
            Object.values(world.otherPlayers).forEach(otherPlayer => {
                const mapX = centerX + (otherPlayer.x - player.x) * effectiveScale;
                const mapY = centerY + (otherPlayer.y - player.y) * effectiveScale;

                // Only draw if within minimap bounds
                if (mapX >= 0 && mapX <= this.canvas.width && mapY >= 0 && mapY <= this.canvas.height) {
                    this.ctx.fillStyle = '#00FFFF'; // Cyan for other players
                    this.ctx.fillRect(mapX - 1, mapY - 1, 3, 3);
                }
            });
        }

        // Draw player position (always in center)
        this.ctx.fillStyle = '#FFFF00'; // Yellow for player
        this.ctx.fillRect(centerX - 2, centerY - 2, 4, 4);

        // Draw north indicator
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('N', centerX, 15);

        // Draw compass rose
        this.drawCompassRose(centerX, centerY);
    }

    getResourceColor(resource) {
        switch (resource.type) {
            case 'tree': return '#228B22'; // Forest green
            case 'rock': return '#696969'; // Dim gray
            case 'fishing': return '#4169E1'; // Royal blue
            case 'farming': return '#32CD32'; // Lime green
            case 'fire': return '#FF4500'; // Orange red
            default: return '#8B4513'; // Saddle brown
        }
    }

    getNPCColor(npc) {
        switch (npc.type) {
            case 'shopkeeper': return '#9966FF'; // Purple for shopkeepers
            case 'banker': return '#00FF00'; // Green for bankers
            case 'goblin': return '#FF0000'; // Red for hostile NPCs
            default: return '#FFA500'; // Orange for neutral NPCs
        }
    }

    drawCompassRose(centerX, centerY) {
        const size = 8;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        
        // North arrow
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - size);
        this.ctx.lineTo(centerX - 2, centerY - size + 4);
        this.ctx.lineTo(centerX + 2, centerY - size + 4);
        this.ctx.closePath();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();
    }

    toggleWorldMap() {
        // Placeholder for world map functionality
        addChatMessage('World map not yet implemented', 'system');
    }

    homeTeleport() {
        if (game && game.player && window.socket) {
            window.socket.emit('homeTeleport');
            addChatMessage('Attempting to teleport home...', 'system');
        } else if (!window.socket) {
            console.error('Socket not available for home teleport');
            addChatMessage('Unable to teleport - connection error', 'system');
        }
    }

    // Method to handle clicking on the minimap (for future walking functionality)
    handleMinimapClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const effectiveScale = this.scale * this.zoom;
        
        // Convert minimap coordinates to world coordinates
        const worldX = game.player.x + (clickX - centerX) / effectiveScale;
        const worldY = game.player.y + (clickY - centerY) / effectiveScale;
        
        // Emit movement command to server
        if (game && game.player) {
            socket.emit('minimapWalk', { x: worldX, y: worldY });
            addChatMessage(`Walking to ${Math.round(worldX)}, ${Math.round(worldY)}`, 'system');
        }
    }
}