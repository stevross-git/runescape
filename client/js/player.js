class Player {
    constructor(x, y, username) {
        this.x = x;
        this.y = y;
        this.username = username;
        this.id = null;
        
        this.targetX = x;
        this.targetY = y;
        
        this.speed = 100;
        this.isMoving = false;
        
        this.stats = {
            hp: 10,
            maxHp: 10,
            mp: 10,
            maxMp: 10,
            level: 1,
            experience: 0
        };
        
        this.skills = {
            attack: 1,
            defense: 1,
            strength: 1,
            magic: 1,
            mining: 1,
            woodcutting: 1
        };
        
        this.inventory = new Array(28).fill(null);
        this.equipment = {
            weapon: null,
            helmet: null,
            armor: null,
            legs: null,
            boots: null,
            gloves: null
        };
        
        this.size = 48; // Increased size to better show the sprite
        this.color = '#FFD700';
        
        // Animation properties
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 200; // milliseconds per frame
        this.direction = 'down'; // down, up, left, right
        this.totalFrames = 4; // number of animation frames per direction
        // Sprite sheet dimensions - will be auto-calculated from actual image
        this.spriteFrameWidth = 256; // Default frame width (will be updated)
        this.spriteFrameHeight = 341; // Default frame height (will be updated)
        this.spriteSheetRows = 3; // actual number of rows in sprite sheet
    }

    setDestination(x, y) {
        // Check if destination is walkable (not water)
        if (game && game.world && game.world.getTerrainAt) {
            const terrain = game.world.getTerrainAt(x, y);
            if (terrain === 'water') {
                // Find nearest walkable tile
                const nearestWalkable = this.findNearestWalkableTile(x, y);
                if (nearestWalkable) {
                    this.targetX = nearestWalkable.x;
                    this.targetY = nearestWalkable.y;
                    this.isMoving = true;
                }
                return;
            }
        }
        
        this.targetX = x;
        this.targetY = y;
        this.isMoving = true;
    }

    findNearestWalkableTile(targetX, targetY) {
        if (!game || !game.world || !game.world.getTerrainAt) return null;
        
        // Search in expanding circles for walkable terrain
        for (let radius = 32; radius <= 128; radius += 32) {
            for (let angle = 0; angle < 360; angle += 45) {
                const radians = (angle * Math.PI) / 180;
                const testX = targetX + Math.cos(radians) * radius;
                const testY = targetY + Math.sin(radians) * radius;
                
                const terrain = game.world.getTerrainAt(testX, testY);
                if (terrain !== 'water') {
                    return { x: testX, y: testY };
                }
            }
        }
        
        return null;
    }

    update(deltaTime) {
        if (this.isMoving) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Update direction based on movement
            this.updateDirection(dx, dy);
            
            // Update animation
            this.animationTimer += deltaTime;
            if (this.animationTimer >= this.animationSpeed) {
                this.animationFrame = (this.animationFrame + 1) % this.totalFrames;
                this.animationTimer = 0;
            }
            
            if (distance < 2) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
                this.animationFrame = 0; // Reset to idle frame when stopped
            } else {
                const moveDistance = (this.speed * deltaTime) / 1000;
                const ratio = moveDistance / distance;
                
                this.x += dx * ratio;
                this.y += dy * ratio;
            }
        } else {
            // Reset animation when not moving
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
    }
    
    updateDirection(dx, dy) {
        // Determine primary movement direction
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal movement is stronger
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            // Vertical movement is stronger
            this.direction = dy > 0 ? 'down' : 'up';
        }
    }
    
    getAnimationOffset() {
        if (!this.isMoving) return { x: 0, y: 0 };
        
        // Create subtle side-to-side movement for walking
        const sideOffset = Math.sin((this.animationFrame / this.totalFrames) * Math.PI * 2) * 1;
        
        switch(this.direction) {
            case 'left':
            case 'right':
                return { x: 0, y: sideOffset };
            case 'up':
            case 'down':
                return { x: sideOffset, y: 0 };
            default:
                return { x: 0, y: 0 };
        }
    }
    
    getWalkingBob() {
        if (!this.isMoving) return 0;
        
        // Create up-down bobbing motion
        return Math.sin((this.animationFrame / this.totalFrames) * Math.PI * 4) * 1;
    }
    
    getDirectionRotation() {
        // Optional: rotate sprite slightly based on direction
        if (!this.isMoving) return 0;
        
        const maxRotation = 0.1; // radians (about 6 degrees)
        const rotationOffset = Math.sin((this.animationFrame / this.totalFrames) * Math.PI * 2) * maxRotation;
        
        switch(this.direction) {
            case 'left': return -rotationOffset;
            case 'right': return rotationOffset;
            default: return 0;
        }
    }
    
    getDirectionRow() {
        // Map direction to sprite sheet row (3-row layout)
        switch(this.direction) {
            case 'down': return 0;  // First row (facing forward)
            case 'left': return 1;  // Second row (facing left)
            case 'right': return 2; // Third row (facing right)
            case 'up': return 0;    // Use down animation for up (or could use row 0 reversed)
            default: return 0;
        }
    }
    
    getSpriteFrame() {
        // Calculate sprite sheet coordinates
        // Ensure we don't go out of bounds
        const safeFrame = Math.floor(this.animationFrame) % this.totalFrames;
        const safeRow = this.getDirectionRow() % this.spriteSheetRows;
        
        const frameX = Math.floor(safeFrame * this.spriteFrameWidth);
        const frameY = Math.floor(safeRow * this.spriteFrameHeight);
        
        // The actual character is much smaller than the cell and positioned near the center
        // Based on your sprite sheet, the character appears to be about 50x80 pixels
        // positioned roughly in the center of each 256x341 cell
        const charWidth = 50;
        const charHeight = 80;
        
        // Offset to find the character within the large cell
        // These values may need adjustment based on the exact sprite positioning
        const offsetX = (this.spriteFrameWidth - charWidth) / 2;
        const offsetY = (this.spriteFrameHeight - charHeight) / 2 - 50; // Character seems higher in cell
        
        return { 
            x: frameX + offsetX, 
            y: frameY + offsetY,
            charWidth: charWidth,
            charHeight: charHeight
        };
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Calculate render position (centered on player position)
        const renderX = screenX - this.size/2;
        const renderY = screenY - this.size/2;
        
        // Try to render player walking sprite, fallback to static sprite, then colored rectangle
        const hasWalkingSprite = imageManager.hasImage('player_male_walking');
        const hasStaticSprite = imageManager.hasImage('player_male');
        
        if (!this.spriteCheckLogged) {
            console.log(`🎮 Sprite availability - Walking: ${hasWalkingSprite}, Static: ${hasStaticSprite}`);
            this.spriteCheckLogged = true;
        }
        
        if (imageManager.isLoaded() && hasWalkingSprite) {
            // Always use walking sprite (for both moving and idle)
            const walkingSprite = imageManager.getImage('player_male_walking');
            const spriteFrame = this.isMoving ? this.getSpriteFrame() : { x: 0, y: 0 }; // Use first frame when idle
            
            // Debug logging for first time and errors
            if (!this.walkingSpriteLogged) {
                console.log(`🚶 Walking sprite loaded. Size: ${walkingSprite.width}x${walkingSprite.height}`);
                console.log(`🚶 Expected frames: ${this.totalFrames} frames x ${this.spriteSheetRows} rows`);
                console.log(`🚶 Frame size: ${this.spriteFrameWidth}x${this.spriteFrameHeight}`);
                
                // Auto-calculate frame dimensions based on actual image size
                const actualFrameWidth = Math.floor(walkingSprite.width / 4);
                const actualFrameHeight = Math.floor(walkingSprite.height / 3);
                if (Math.abs(actualFrameWidth - this.spriteFrameWidth) > 1 || Math.abs(actualFrameHeight - this.spriteFrameHeight) > 1) {
                    console.log(`🚶 Adjusting frame size from ${this.spriteFrameWidth}x${this.spriteFrameHeight} to: ${actualFrameWidth}x${actualFrameHeight}`);
                    this.spriteFrameWidth = actualFrameWidth;
                    this.spriteFrameHeight = actualFrameHeight;
                }
                
                this.walkingSpriteLogged = true;
                
                // DEBUG: Show entire sprite sheet in corner for 10 seconds
                this.debugShowFullSprite = true;
                setTimeout(() => { this.debugShowFullSprite = false; }, 10000);
            }
            
            // DEBUG: Draw entire sprite sheet scaled down in corner
            if (this.debugShowFullSprite) {
                ctx.save();
                ctx.globalAlpha = 0.8;
                const debugScale = 0.25;
                ctx.drawImage(walkingSprite, 10, 100, walkingSprite.width * debugScale, walkingSprite.height * debugScale);
                ctx.strokeStyle = 'yellow';
                ctx.lineWidth = 1;
                // Draw grid
                for (let i = 0; i <= 4; i++) {
                    ctx.beginPath();
                    ctx.moveTo(10 + i * this.spriteFrameWidth * debugScale, 100);
                    ctx.lineTo(10 + i * this.spriteFrameWidth * debugScale, 100 + walkingSprite.height * debugScale);
                    ctx.stroke();
                }
                for (let i = 0; i <= 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(10, 100 + i * this.spriteFrameHeight * debugScale);
                    ctx.lineTo(10 + walkingSprite.width * debugScale, 100 + i * this.spriteFrameHeight * debugScale);
                    ctx.stroke();
                }
                ctx.restore();
            }
            
            
            
            // Draw specific frame from sprite sheet
            try {
                // Validate sprite frame coordinates
                if (spriteFrame.x < 0 || spriteFrame.y < 0 || 
                    spriteFrame.x + this.spriteFrameWidth > walkingSprite.width ||
                    spriteFrame.y + this.spriteFrameHeight > walkingSprite.height) {
                    console.error(`Invalid sprite frame: ${spriteFrame.x},${spriteFrame.y} (${this.spriteFrameWidth}x${this.spriteFrameHeight}) in ${walkingSprite.width}x${walkingSprite.height} image`);
                    // Use frame 0,0 as fallback
                    spriteFrame.x = 0;
                    spriteFrame.y = 0;
                }
                
                // Draw the correct frame from sprite sheet
                ctx.drawImage(
                    walkingSprite,
                    spriteFrame.x, spriteFrame.y, // Use calculated sprite position
                    spriteFrame.charWidth, spriteFrame.charHeight, // Use actual character size, not full cell
                    renderX, renderY, // Destination position
                    this.size, this.size // Destination size (scale to game size)
                );
                
            } catch (error) {
                console.error('Error drawing walking sprite:', error);
                // Fallback to static sprite
                imageManager.drawImage(ctx, 'player_male', renderX, renderY, this.size, this.size);
            }
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = this.color;
            ctx.fillRect(renderX, renderY, this.size, this.size);
            
            // Add simple direction indicator
            if (this.isMoving) {
                ctx.fillStyle = '#FFFFFF';
                const indicatorSize = 4;
                let indicatorX = screenX;
                let indicatorY = screenY;
                
                switch(this.direction) {
                    case 'up': indicatorY -= this.size/2 + 5; break;
                    case 'down': indicatorY += this.size/2 + 5; break;
                    case 'left': indicatorX -= this.size/2 + 5; break;
                    case 'right': indicatorX += this.size/2 + 5; break;
                }
                
                ctx.fillRect(indicatorX - indicatorSize/2, indicatorY - indicatorSize/2, indicatorSize, indicatorSize);
            }
        }
        
        // Draw username
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(this.username, screenX, screenY - this.size/2 - 5);
        ctx.fillText(this.username, screenX, screenY - this.size/2 - 5);
        
        if (this.stats.hp < this.stats.maxHp) {
            const barWidth = this.size;
            const barHeight = 4;
            const barX = screenX - barWidth/2;
            const barY = screenY + this.size/2 + 2;
            
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#00FF00';
            const hpRatio = this.stats.hp / this.stats.maxHp;
            ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
        }
    }

    takeDamage(damage) {
        this.stats.hp = Math.max(0, this.stats.hp - damage);
        return this.stats.hp <= 0;
    }

    heal(amount) {
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
    }

    addItem(item) {
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i] === null) {
                this.inventory[i] = item;
                return true;
            }
        }
        return false;
    }

    removeItem(index) {
        if (index >= 0 && index < this.inventory.length) {
            const item = this.inventory[index];
            this.inventory[index] = null;
            return item;
        }
        return null;
    }

    gainExperience(skill, amount) {
        if (this.skills.hasOwnProperty(skill)) {
            const currentLevel = this.skills[skill];
            const experienceNeeded = this.getExperienceForLevel(currentLevel + 1);
            
            this.stats.experience += amount;
            
            if (this.stats.experience >= experienceNeeded) {
                this.skills[skill]++;
                addChatMessage(`Congratulations! Your ${skill} level is now ${this.skills[skill]}!`, 'system');
            }
        }
    }

    getExperienceForLevel(level) {
        return Math.floor(level * level * 100);
    }

    equipItem(item, slot) {
        if (item.type === 'equipment' && item.slot === slot) {
            const currentEquipped = this.equipment[slot];
            this.equipment[slot] = item;
            
            if (currentEquipped) {
                this.addItem(currentEquipped);
            }
            
            this.updateStats();
            return true;
        }
        return false;
    }

    unequipItem(slot) {
        const item = this.equipment[slot];
        if (item && this.addItem(item)) {
            this.equipment[slot] = null;
            this.updateStats();
            return true;
        }
        return false;
    }

    updateStats() {
        let bonusAttack = 0;
        let bonusDefense = 0;
        
        for (let slot in this.equipment) {
            const item = this.equipment[slot];
            if (item) {
                bonusAttack += item.attackBonus || 0;
                bonusDefense += item.defenseBonus || 0;
            }
        }
        
        this.stats.attackBonus = bonusAttack;
        this.stats.defenseBonus = bonusDefense;
    }

    getEquippedItem(slot) {
        return this.equipment[slot];
    }
}