class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.world = new World();
        this.player = null;
        this.otherPlayers = new Map();
        this.ui = new UI();
        this.minimap = new Minimap();
        this.actionBar = new ActionBar();
        this.lastTime = 0;
        this.running = false;
        
        this.setupEventListeners();
    }

    init(playerData) {
        this.player = new Player(playerData.x, playerData.y, playerData.username);
        this.player.stats = playerData.stats;
        this.player.inventory = playerData.inventory;
        this.player.skills = playerData.skills;
        this.player.equipment = playerData.equipment || this.player.equipment;
        
        // Center camera on player immediately
        this.world.updateCamera(this.player.x, this.player.y, this.canvas.width, this.canvas.height);
        
        this.ui.updatePlayerStats(this.player.stats);
        this.ui.updateInventory(this.player.inventory);
        this.ui.updateSkills(this.player.skills);
        this.ui.updateEquipment(this.player.equipment);
        
        // Initialize action bar with default spells
        this.actionBar.initializeDefaults();
        
        this.running = true;
        this.gameLoop();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Scale coordinates if canvas is scaled
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const canvasX = x * scaleX;
            const canvasY = y * scaleY;
            
            const worldX = canvasX + this.world.camera.x;
            const worldY = canvasY + this.world.camera.y;
            
            if (this.player) {
                // Check if clicking on an interactive object
                const clickedObject = this.world.getObjectAt(worldX, worldY, 40);
                
                if (clickedObject) {
                    // Move to object first, then interact
                    const distance = Math.sqrt((this.player.x - worldX) ** 2 + (this.player.y - worldY) ** 2);
                    
                    if (distance > 50) {
                        // Move closer to object
                        this.player.setDestination(worldX, worldY);
                        socket.emit('playerMove', { x: worldX, y: worldY });
                        
                        // Set pending interaction
                        this.player.pendingInteraction = {
                            type: clickedObject.type,
                            object: clickedObject.object,
                            targetX: worldX,
                            targetY: worldY
                        };
                    } else {
                        // Close enough to interact immediately
                        this.handleObjectInteraction(clickedObject);
                    }
                } else {
                    // Normal movement
                    this.player.setDestination(worldX, worldY);
                    socket.emit('playerMove', { x: worldX, y: worldY });
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e.key);
        });
    }

    handleKeyPress(key) {
        if (!this.player) return;

        const speed = 5;
        let newX = this.player.x;
        let newY = this.player.y;

        switch(key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                newY -= speed;
                break;
            case 's':
            case 'arrowdown':
                newY += speed;
                break;
            case 'a':
            case 'arrowleft':
                newX -= speed;
                break;
            case 'd':
            case 'arrowright':
                newX += speed;
                break;
        }

        if (newX !== this.player.x || newY !== this.player.y) {
            this.player.setDestination(newX, newY);
            socket.emit('playerMove', { x: newX, y: newY });
        }
    }

    updatePlayerPosition(data) {
        if (this.player && data.id === this.player.id) {
            this.player.x = data.x;
            this.player.y = data.y;
        }
    }

    updateOtherPlayers(players) {
        this.otherPlayers.clear();
        
        for (let playerData of players) {
            if (this.player && playerData.id !== this.player.id) {
                const otherPlayer = new Player(playerData.x, playerData.y, playerData.username);
                otherPlayer.id = playerData.id;
                this.otherPlayers.set(playerData.id, otherPlayer);
            }
        }
    }

    update(deltaTime) {
        if (this.player) {
            const oldX = this.player.x;
            const oldY = this.player.y;
            
            this.player.update(deltaTime);
            this.world.updateCamera(this.player.x, this.player.y, this.canvas.width, this.canvas.height);
            
            // Check for PvP area changes when player moves
            if (Math.abs(this.player.x - oldX) > 1 || Math.abs(this.player.y - oldY) > 1) {
                this.checkPvPArea();
            }
            
            // Check for pending interactions when player stops moving
            if (!this.player.isMoving && this.player.pendingInteraction) {
                const interaction = this.player.pendingInteraction;
                const distance = Math.sqrt((this.player.x - interaction.targetX) ** 2 + (this.player.y - interaction.targetY) ** 2);
                
                if (distance <= 50) {
                    this.handleObjectInteraction({
                        type: interaction.type,
                        object: interaction.object
                    });
                    this.player.pendingInteraction = null;
                }
            }
        }

        for (let player of this.otherPlayers.values()) {
            player.update(deltaTime);
        }
        
        // Update fires
        this.world.updateFires();
    }

    handleObjectInteraction(clickedObject) {
        if (!this.player) return;
        
        switch(clickedObject.type) {
            case 'tree':
                this.chopTree(clickedObject.object);
                break;
            case 'rock':
                this.mineRock(clickedObject.object);
                break;
            case 'npc':
                if (clickedObject.object.type === 'shopkeeper') {
                    this.openShop(clickedObject.object);
                } else if (clickedObject.object.type === 'banker') {
                    this.openBank(clickedObject.object);
                } else if (clickedObject.object.type === 'quest_giver') {
                    this.openQuests(clickedObject.object);
                } else {
                    this.attackNPC(clickedObject.object);
                }
                break;
            case 'fire':
                this.useFire(clickedObject.object);
                break;
            case 'player':
                this.showPlayerContextMenu(clickedObject.object);
                break;
        }
    }

    chopTree(tree) {
        if (tree.health <= 0) {
            addChatMessage('This tree has already been cut down!', 'system');
            return;
        }
        
        // Check if player has axe equipped
        const weapon = this.player.equipment.weapon;
        if (!weapon || (!weapon.name.includes('axe') && !weapon.name.includes('Axe'))) {
            addChatMessage('You need an axe to cut down trees!', 'system');
            return;
        }
        
        addChatMessage(`You swing your ${weapon.name} at the tree...`, 'system');
        
        // Start chopping animation/process
        this.player.isChopping = true;
        setTimeout(() => {
            this.player.isChopping = false;
            socket.emit('gatherResource', { 
                type: 'tree', 
                treeId: tree.id,
                x: tree.x, 
                y: tree.y 
            });
        }, 1500);
    }

    mineRock(rock) {
        if (rock.health <= 0) {
            addChatMessage('This rock has already been mined!', 'system');
            return;
        }
        
        // Check if player has pickaxe equipped
        const weapon = this.player.equipment.weapon;
        if (!weapon || !weapon.name.includes('pickaxe')) {
            addChatMessage('You need a pickaxe to mine rocks!', 'system');
            return;
        }
        
        addChatMessage(`You swing your ${weapon.name} at the rock...`, 'system');
        
        this.player.isMining = true;
        setTimeout(() => {
            this.player.isMining = false;
            socket.emit('gatherResource', { 
                type: 'rock', 
                rockId: rock.id,
                x: rock.x, 
                y: rock.y 
            });
        }, 2000);
    }

    openShop(npc) {
        addChatMessage(`You speak with the ${npc.name || npc.type}...`, 'system');
        socket.emit('openShop', { 
            shopId: npc.id
        });
    }

    openBank(npc) {
        addChatMessage(`You speak with the ${npc.name || npc.type}...`, 'system');
        socket.emit('openBank', { 
            bankerId: npc.id
        });
    }

    openQuests(npc) {
        addChatMessage(`Quest Giver: "I have a quest for you!"`, 'system');
        addChatMessage(`Quest available: First Steps - Learn the basics of the game`, 'system');
        socket.emit('openQuests', { 
            questGiverId: npc.id
        });
    }

    attackNPC(npc) {
        if (npc.hp <= 0) {
            addChatMessage('This creature is already dead!', 'system');
            return;
        }
        
        if (npc.type === 'shopkeeper') {
            addChatMessage('You cannot attack shopkeepers!', 'system');
            return;
        }
        
        // Check if a spell is selected
        const selectedSpell = this.ui.getSelectedSpell();
        if (selectedSpell && selectedSpell !== 'heal') {
            addChatMessage(`You cast ${selectedSpell} on the ${npc.type}!`, 'system');
            this.ui.castSpell(selectedSpell, 'npc', npc.id);
        } else {
            addChatMessage(`You attack the ${npc.type}!`, 'system');
            socket.emit('attackNPC', { 
                npcType: npc.type,
                npcId: npc.id,
                x: npc.x, 
                y: npc.y 
            });
        }
    }

    useFire(fire) {
        if (fire.burnTime <= 0) {
            addChatMessage('The fire has gone out!', 'system');
            return;
        }
        
        // Check if player has raw food to cook
        let rawFood = null;
        let rawFoodIndex = -1;
        
        for (let i = 0; i < this.player.inventory.length; i++) {
            const item = this.player.inventory[i];
            if (item && item.name && item.name.includes('raw')) {
                rawFood = item;
                rawFoodIndex = i;
                break;
            }
        }
        
        if (!rawFood) {
            // Check for fish that can be cooked
            for (let i = 0; i < this.player.inventory.length; i++) {
                const item = this.player.inventory[i];
                if (item && (item.name === 'shrimp' || item.name === 'trout' || item.name === 'anchovies' || item.name === 'sardines' || item.name === 'herring')) {
                    rawFood = item;
                    rawFoodIndex = i;
                    break;
                }
            }
        }
        
        if (!rawFood) {
            addChatMessage('You need raw food to cook!', 'system');
            return;
        }
        
        addChatMessage(`You start cooking the ${rawFood.name}...`, 'system');
        
        socket.emit('cookFood', {
            fireId: fire.id,
            itemIndex: rawFoodIndex,
            x: fire.x,
            y: fire.y
        });
    }

    render() {
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.world.render(this.ctx);

        if (this.player) {
            this.player.render(this.ctx, this.world.camera);
        }

        for (let player of this.otherPlayers.values()) {
            player.render(this.ctx, this.world.camera);
        }
        
        // Render minimap
        this.minimap.render(this.world, this.player);
    }

    gameLoop(currentTime = 0) {
        if (!this.running) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    showPlayerContextMenu(targetPlayer) {
        if (!this.player || !targetPlayer) return;
        
        const options = [
            {
                text: `Trade with ${targetPlayer.username}`,
                action: () => this.requestTrade(targetPlayer)
            },
            {
                text: `Attack ${targetPlayer.username}`,
                action: () => this.attackPlayer(targetPlayer)
            }
        ];
        
        // Show context menu at player position
        const screenX = targetPlayer.x - this.world.camera.x;
        const screenY = targetPlayer.y - this.world.camera.y;
        this.ui.showContextMenu(screenX + 400, screenY + 300, options); // Offset for canvas position
    }

    requestTrade(targetPlayer) {
        if (!this.player || !targetPlayer) return;
        
        addChatMessage(`Sending trade request to ${targetPlayer.username}...`, 'system');
        socket.emit('requestTrade', {
            targetId: targetPlayer.id
        });
    }

    attackPlayer(targetPlayer) {
        if (!this.player || !targetPlayer) return;
        
        // Check if we can attack this player (PvP area check on server side)
        addChatMessage(`Attacking ${targetPlayer.username}!`, 'combat');
        
        socket.emit('attackPlayer', {
            targetId: targetPlayer.id
        });
    }

    checkPvPArea() {
        if (this.player) {
            socket.emit('checkPvPArea', {
                x: this.player.x,
                y: this.player.y
            });
        }
    }

    stop() {
        this.running = false;
    }
}