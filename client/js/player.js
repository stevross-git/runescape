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
        
        this.size = 32;
        this.color = '#FFD700';
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
            
            if (distance < 2) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
            } else {
                const moveDistance = (this.speed * deltaTime) / 1000;
                const ratio = moveDistance / distance;
                
                this.x += dx * ratio;
                this.y += dy * ratio;
            }
        }
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Try to render player image, fallback to colored rectangle
        if (imageManager.isLoaded() && imageManager.hasImage('player_male')) {
            imageManager.drawImage(ctx, 'player_male', screenX - this.size/2, screenY - this.size/2, this.size, this.size);
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = this.color;
            ctx.fillRect(screenX - this.size/2, screenY - this.size/2, this.size, this.size);
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