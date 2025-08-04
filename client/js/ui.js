class UI {
    constructor() {
        this.inventoryGrid = document.getElementById('inventoryGrid');
        this.equipmentSlots = document.getElementById('equipmentSlots');
        this.setupInventoryGrid();
        this.setupEquipmentSlots();
        this.setupShopInterface();
        this.setupSpellbook();
        this.setupBankInterface();
        this.currentShopId = null;
        this.selectedSpell = null;
        this.bankOpen = false;
    }

    setupInventoryGrid() {
        for (let i = 0; i < 28; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.index = i;
            
            slot.addEventListener('click', () => {
                this.handleInventoryClick(i);
            });
            
            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.handleInventoryRightClick(i, e);
            });
            
            this.inventoryGrid.appendChild(slot);
        }
    }

    setupEquipmentSlots() {
        const slots = this.equipmentSlots.querySelectorAll('.equipment-slot');
        slots.forEach(slot => {
            const slotType = slot.dataset.slot;
            
            slot.addEventListener('click', () => {
                this.handleEquipmentClick(slotType);
            });
            
            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.handleEquipmentRightClick(slotType, e);
            });
        });
    }

    updatePlayerStats(stats) {
        const hpBar = document.getElementById('hpBar');
        const mpBar = document.getElementById('mpBar');
        const prayerBar = document.getElementById('prayerBar');
        const hpText = document.getElementById('hpText');
        const mpText = document.getElementById('mpText');
        const prayerText = document.getElementById('prayerText');

        const hpPercent = (stats.hp / stats.maxHp) * 100;
        const mpPercent = (stats.mp / stats.maxMp) * 100;
        const prayerPercent = (stats.prayer / stats.maxPrayer) * 100;

        hpBar.style.width = hpPercent + '%';
        mpBar.style.width = mpPercent + '%';
        prayerBar.style.width = prayerPercent + '%';

        hpText.textContent = `${stats.hp}/${stats.maxHp}`;
        mpText.textContent = `${stats.mp}/${stats.maxMp}`;
        prayerText.textContent = `${stats.prayer}/${stats.maxPrayer}`;
    }

    updateInventory(inventory) {
        const slots = this.inventoryGrid.children;
        console.log('Updating inventory UI with:', inventory);
        
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            const item = inventory[i];
            
            if (item) {
                slot.classList.add('occupied');
                
                // Get icon for the item
                const itemIcon = this.getItemIcon(item);
                slot.textContent = itemIcon;
                
                const quantity = item.quantity > 1 ? ` (${item.quantity})` : '';
                slot.title = `${item.name}${quantity}`;
                
                console.log(`Slot ${i}: ${item.name} (${itemIcon})`);
            } else {
                slot.classList.remove('occupied');
                slot.textContent = '';
                slot.title = '';
            }
        }
    }

    getItemIcon(item) {
        const itemIcons = {
            // Weapons
            'bronze dagger': '🗡️',
            'bronze sword': '⚔️',
            'iron axe': '🪓',
            'steel axe': '🪓',
            'woodcutting axe': '🪓',
            'pickaxe': '⛏️',
            'iron pickaxe': '⛏️',
            
            // Armor & Equipment
            'leather armor': '🦺',
            'chainmail': '🛡️',
            'iron armor': '🛡️',
            'wooden shield': '🛡️',
            'iron helmet': '⛑️',
            'leather cap': '🧢',
            'leather boots': '👢',
            'iron boots': '👢',
            'leather gloves': '🧤',
            
            // Consumables
            'bread': '🍞',
            'health potion': '🧪',
            'food': '🍖',
            
            // Materials & Resources
            'bones': '🦴',
            'oak logs': '🟫',
            'willow logs': '🟫',
            'maple logs': '🟫',
            'yew logs': '🟫',
            'copper ore': '🟫',
            'tin ore': '⬜',
            'iron ore': '⬛',
            'coal': '⚫',
            'gold ore': '🟨',
            'shrimp': '🦐',
            'anchovies': '🐟',
            'sardines': '🐟',
            'herring': '🐟',
            'trout': '🐟',
            'grimy guam': '🌿',
            'grimy marrentill': '🌿',
            'grimy tarromin': '🌿',
            'grimy harralander': '🌿',
            'bird nest': '🥚',
            'gems': '💎',
            'casket': '📦',
            'big bass': '🐠',
            'seeds': '🌱',
            'clean herbs': '🌿',
            'coins': '🪙',
            
            // Runes
            'air rune': '💨',
            'water rune': '💧', 
            'earth rune': '🌍',
            'fire rune': '🔥',
            'mind rune': '🧠',
            'body rune': '👤',
            
            // Magic equipment
            'wizard hat': '🧙',
            'wizard robe': '👘'
        };
        
        return itemIcons[item.name] || '📦';
    }

    updateSkills(skills) {
        for (let skill in skills) {
            const element = document.getElementById(skill + 'Level');
            if (element) {
                element.textContent = skills[skill];
            }
        }
    }

    updateEquipment(equipment) {
        const slots = this.equipmentSlots.querySelectorAll('.equipment-slot');
        slots.forEach(slot => {
            const slotType = slot.dataset.slot;
            const item = equipment[slotType];
            
            if (item) {
                slot.classList.add('equipped');
                
                // Use specific icons for different item types
                const itemIcons = {
                    // Weapons
                    'bronze dagger': '🗡️',
                    'bronze sword': '⚔️',
                    'iron axe': '🪓',
                    'steel axe': '🪓',
                    'woodcutting axe': '🪓',
                    'pickaxe': '⛏️',
                    'iron pickaxe': '⛏️',
                    
                    // Armor
                    'leather armor': '🦺',
                    'chainmail': '🛡️',
                    'iron armor': '🛡️',
                    'wooden shield': '🛡️',
                    
                    // Helmets
                    'iron helmet': '⛑️',
                    'leather cap': '🧢',
                    
                    // Other
                    'leather boots': '👢',
                    'iron boots': '👢',
                    'leather gloves': '🧤'
                };
                
                slot.textContent = itemIcons[item.name] || this.getDefaultIcon(slotType);
                slot.title = `${item.name} (+${item.attackBonus || 0} Attack, +${item.defenseBonus || 0} Defense)`;
            } else {
                slot.classList.remove('equipped');
                const icons = {
                    weapon: '⚔️',
                    helmet: '🪖',
                    armor: '🛡️',
                    legs: '👖',
                    boots: '👢',
                    gloves: '🧤'
                };
                slot.textContent = icons[slotType] || '?';
                slot.title = slotType.charAt(0).toUpperCase() + slotType.slice(1);
            }
        });
    }

    getDefaultIcon(slotType) {
        const defaultIcons = {
            weapon: '⚔️',
            helmet: '⛑️',
            armor: '🛡️',
            legs: '👖',
            boots: '👢',
            gloves: '🧤'
        };
        return defaultIcons[slotType] || '?';
    }

    handleInventoryClick(index) {
        if (game && game.player && game.player.inventory[index]) {
            const item = game.player.inventory[index];
            
            if (item.type === 'equipment') {
                if (game.player.equipItem(item, item.slot)) {
                    game.player.inventory[index] = null;
                    this.updateInventory(game.player.inventory);
                    this.updateEquipment(game.player.equipment);
                    addChatMessage(`Equipped ${item.name}`, 'system');
                    socket.emit('equipItem', { item, slot: item.slot });
                }
            } else {
                addChatMessage(`You have: ${item.name}`, 'system');
            }
        }
    }

    handleInventoryRightClick(index, event) {
        if (game && game.player && game.player.inventory[index]) {
            const item = game.player.inventory[index];
            const options = [];
            
            if (item.type === 'equipment') {
                options.push({
                    text: `Equip ${item.name}`,
                    action: () => {
                        if (game.player.equipItem(item, item.slot)) {
                            game.player.inventory[index] = null;
                            this.updateInventory(game.player.inventory);
                            this.updateEquipment(game.player.equipment);
                            addChatMessage(`Equipped ${item.name}`, 'system');
                            socket.emit('equipItem', { item, slot: item.slot });
                        }
                    }
                });
            }
            
            if (item.type === 'consumable') {
                options.push({
                    text: `Use ${item.name}`,
                    action: () => {
                        this.useItem(index);
                    }
                });
            }
            
            if (item.name === 'bones') {
                options.push({
                    text: `Bury ${item.name}`,
                    action: () => {
                        this.buryBones(index);
                    }
                });
            }
            
            options.push({
                text: `Drop ${item.name}`,
                action: () => {
                    game.player.inventory[index] = null;
                    this.updateInventory(game.player.inventory);
                    addChatMessage(`Dropped ${item.name}`, 'system');
                    socket.emit('dropItem', { item });
                }
            });
            
            if (options.length > 0) {
                this.showContextMenu(event.clientX, event.clientY, options);
            }
        }
    }

    handleEquipmentClick(slot) {
        if (game && game.player && game.player.equipment[slot]) {
            const item = game.player.equipment[slot];
            addChatMessage(`Equipped: ${item.name}`, 'system');
        }
    }

    handleEquipmentRightClick(slot, event) {
        if (game && game.player && game.player.equipment[slot]) {
            const item = game.player.equipment[slot];
            
            this.showContextMenu(event.clientX, event.clientY, [{
                text: `Unequip ${item.name}`,
                action: () => {
                    if (game.player.unequipItem(slot)) {
                        this.updateInventory(game.player.inventory);
                        this.updateEquipment(game.player.equipment);
                        addChatMessage(`Unequipped ${item.name}`, 'system');
                        socket.emit('unequipItem', { slot });
                    } else {
                        addChatMessage('Inventory is full!', 'system');
                    }
                }
            }]);
        }
    }

    useItem(index) {
        const item = game.player.inventory[index];
        if (!item || item.type !== 'consumable') return;
        
        if (item.name === 'food') {
            const healAmount = item.healAmount || 5;
            game.player.heal(healAmount);
            addChatMessage(`You eat the ${item.name} and heal ${healAmount} HP`, 'system');
        }
        
        game.player.inventory[index] = null;
        this.updateInventory(game.player.inventory);
        this.updatePlayerStats(game.player.stats);
        socket.emit('useItem', { item });
    }

    buryBones(index) {
        const item = game.player.inventory[index];
        if (!item || item.name !== 'bones') return;
        
        addChatMessage(`You bury the ${item.name}...`, 'system');
        socket.emit('buryBones', { itemIndex: index });
    }

    showContextMenu(x, y, options) {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'absolute';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.background = 'rgba(0,0,0,0.9)';
        menu.style.border = '1px solid #ffff00';
        menu.style.padding = '5px';
        menu.style.zIndex = '1000';

        options.forEach(option => {
            const item = document.createElement('div');
            item.textContent = option.text;
            item.style.padding = '5px 10px';
            item.style.cursor = 'pointer';
            item.style.color = '#ffff00';
            
            item.addEventListener('click', () => {
                option.action();
                menu.remove();
            });
            
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(255,255,0,0.2)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });

            menu.appendChild(item);
        });

        document.body.appendChild(menu);

        document.addEventListener('click', function removeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            }
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.background = type === 'error' ? '#ff0000' : '#00ff00';
        notification.style.color = '#000000';
        notification.style.padding = '10px 20px';
        notification.style.border = '2px solid #ffff00';
        notification.style.zIndex = '2000';

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showLevelUpNotification(skill, level) {
        // Create RuneScape-style level up overlay
        const overlay = document.createElement('div');
        overlay.className = 'levelup-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0, 0, 0, 0.8)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '9999';
        overlay.style.animation = 'fadeIn 0.5s ease-in';

        const notification = document.createElement('div');
        notification.className = 'levelup-notification';
        notification.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
        notification.style.border = '4px solid #8B4513';
        notification.style.borderRadius = '15px';
        notification.style.padding = '30px 50px';
        notification.style.textAlign = 'center';
        notification.style.color = '#000';
        notification.style.fontFamily = 'Arial, sans-serif';
        notification.style.fontWeight = 'bold';
        notification.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
        notification.style.transform = 'scale(0)';
        notification.style.animation = 'levelUpPop 0.8s ease-out forwards';

        // Get skill icon
        const skillIcons = {
            attack: '⚔️',
            defense: '🛡️',
            strength: '💪',
            hitpoints: '❤️',
            magic: '🔮',
            ranged: '🏹',
            prayer: '🙏',
            mining: '⛏️',
            woodcutting: '🪓',
            fishing: '🎣',
            farming: '🌱',
            cooking: '🍳'
        };

        notification.innerHTML = `
            <div style="font-size: 64px; margin-bottom: 10px;">
                ${skillIcons[skill] || '⭐'}
            </div>
            <div style="font-size: 24px; margin-bottom: 15px;">
                CONGRATULATIONS!
            </div>
            <div style="font-size: 18px; margin-bottom: 10px;">
                Your ${skill.charAt(0).toUpperCase() + skill.slice(1)} level is now
            </div>
            <div style="font-size: 48px; color: #8B0000; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                ${level}
            </div>
            <div style="font-size: 14px; margin-top: 15px; color: #666;">
                Click anywhere to continue
            </div>
        `;

        overlay.appendChild(notification);
        document.body.appendChild(overlay);

        // Add CSS animations if not already added
        if (!document.querySelector('#levelup-styles')) {
            const style = document.createElement('style');
            style.id = 'levelup-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes levelUpPop {
                    0% { transform: scale(0) rotate(-180deg); }
                    50% { transform: scale(1.2) rotate(0deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                
                .levelup-notification:hover {
                    transform: scale(1.05) !important;
                    transition: transform 0.2s ease;
                }
            `;
            document.head.appendChild(style);
        }

        // Close on click
        overlay.addEventListener('click', () => {
            overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                }
            }, 300);
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.click();
            }
        }, 5000);

        // Play a simple "ding" sound effect (web audio API)
        this.playLevelUpSound();
    }

    playLevelUpSound() {
        try {
            // Create a simple level up sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create oscillator for a triumphant chord
            const oscillator1 = audioContext.createOscillator();
            const oscillator2 = audioContext.createOscillator();
            const oscillator3 = audioContext.createOscillator();
            
            const gainNode = audioContext.createGain();
            
            // Set frequencies for a major chord (C-E-G)
            oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
            oscillator3.frequency.setValueAtTime(783.99, audioContext.currentTime); // G5
            
            oscillator1.type = 'sine';
            oscillator2.type = 'sine';
            oscillator3.type = 'sine';
            
            // Volume envelope
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
            
            // Connect nodes
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            oscillator3.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Play sound
            oscillator1.start(audioContext.currentTime);
            oscillator2.start(audioContext.currentTime);
            oscillator3.start(audioContext.currentTime);
            
            oscillator1.stop(audioContext.currentTime + 1.5);
            oscillator2.stop(audioContext.currentTime + 1.5);
            oscillator3.stop(audioContext.currentTime + 1.5);
        } catch (e) {
            console.log('Audio not supported or blocked');
        }
    }

    showDamageEffect() {
        // Red screen flash when taking damage
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.background = 'rgba(255, 0, 0, 0.3)';
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '8888';
        flash.style.animation = 'damageFlash 0.5s ease-out';
        
        document.body.appendChild(flash);
        
        // Add damage flash animation if not exists
        if (!document.querySelector('#damage-styles')) {
            const style = document.createElement('style');
            style.id = 'damage-styles';
            style.textContent = `
                @keyframes damageFlash {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            if (flash.parentNode) {
                flash.remove();
            }
        }, 500);
    }

    showDeathScreen() {
        // Prevent multiple death screens
        if (window.currentDeathOverlay) {
            return;
        }
        
        // RuneScape-style death screen
        const deathOverlay = document.createElement('div');
        deathOverlay.style.position = 'fixed';
        deathOverlay.style.top = '0';
        deathOverlay.style.left = '0';
        deathOverlay.style.width = '100%';
        deathOverlay.style.height = '100%';
        deathOverlay.style.background = 'rgba(0, 0, 0, 0.9)';
        deathOverlay.style.display = 'flex';
        deathOverlay.style.alignItems = 'center';
        deathOverlay.style.justifyContent = 'center';
        deathOverlay.style.zIndex = '9998';
        deathOverlay.style.color = '#ff0000';
        deathOverlay.style.fontFamily = 'Arial, sans-serif';
        deathOverlay.style.textAlign = 'center';
        
        deathOverlay.innerHTML = `
            <div>
                <div style="font-size: 72px; margin-bottom: 20px;">💀</div>
                <div style="font-size: 48px; font-weight: bold; margin-bottom: 20px;">
                    YOU DIED
                </div>
                <div style="font-size: 24px; margin-bottom: 30px; color: #ffff00;">
                    You have been defeated in combat!
                </div>
                <button id="respawnBtn" style="
                    font-size: 18px; 
                    padding: 15px 30px; 
                    background: linear-gradient(145deg, #8d6e63, #6d4c41); 
                    border: 2px outset #a1887f; 
                    color: #ffff00; 
                    cursor: pointer;
                    font-family: inherit;
                    border-radius: 5px;
                    font-weight: bold;
                ">
                    Respawn
                </button>
            </div>
        `;
        
        document.body.appendChild(deathOverlay);
        
        // Respawn functionality
        const respawnBtn = document.getElementById('respawnBtn');
        
        if (respawnBtn) {
            respawnBtn.addEventListener('click', () => {
                if (window.socket) {
                    respawnBtn.disabled = true;
                    respawnBtn.textContent = 'Respawning...';
                    window.currentDeathOverlay = deathOverlay;
                    window.socket.emit('respawn');
                } else {
                    console.error('Socket not available for respawn');
                    alert('Connection error - cannot respawn');
                }
            });
        }
    }

    showHealingEffect(healAmount) {
        // Green healing flash
        const healFlash = document.createElement('div');
        healFlash.style.position = 'fixed';
        healFlash.style.top = '0';
        healFlash.style.left = '0';
        healFlash.style.width = '100%';
        healFlash.style.height = '100%';
        healFlash.style.background = 'rgba(0, 255, 0, 0.2)';
        healFlash.style.pointerEvents = 'none';
        healFlash.style.zIndex = '8887';
        healFlash.style.animation = 'healFlash 0.6s ease-out';
        
        document.body.appendChild(healFlash);
        
        // Floating heal number
        const healNumber = document.createElement('div');
        healNumber.textContent = `+${healAmount}`;
        healNumber.style.position = 'fixed';
        healNumber.style.top = '50%';
        healNumber.style.left = '50%';
        healNumber.style.transform = 'translate(-50%, -50%)';
        healNumber.style.fontSize = '32px';
        healNumber.style.fontWeight = 'bold';
        healNumber.style.color = '#00ff00';
        healNumber.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        healNumber.style.pointerEvents = 'none';
        healNumber.style.zIndex = '8889';
        healNumber.style.animation = 'floatUp 1s ease-out forwards';
        
        document.body.appendChild(healNumber);
        
        // Add heal animations if not exists
        if (!document.querySelector('#heal-styles')) {
            const style = document.createElement('style');
            style.id = 'heal-styles';
            style.textContent = `
                @keyframes healFlash {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
                
                @keyframes floatUp {
                    0% { opacity: 1; transform: translate(-50%, -50%); }
                    100% { opacity: 0; transform: translate(-50%, -100%); }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            if (healFlash.parentNode) healFlash.remove();
            if (healNumber.parentNode) healNumber.remove();
        }, 1000);
    }

    setupShopInterface() {
        const shopInterface = document.getElementById('shopInterface');
        const closeShop = document.getElementById('closeShop');
        
        closeShop.addEventListener('click', () => {
            this.closeShop();
        });
        
        // Close shop when clicking outside the shop window
        shopInterface.addEventListener('click', (e) => {
            if (e.target === shopInterface) {
                this.closeShop();
            }
        });
    }

    openShop(shopData) {
        this.currentShopId = shopData.shopId;
        const shopInterface = document.getElementById('shopInterface');
        const shopName = document.getElementById('shopName');
        const shopGrid = document.getElementById('shopGrid');
        const playerInventoryGrid = document.getElementById('playerInventoryGrid');
        const playerCoins = document.getElementById('playerCoins');
        
        // Set shop name
        shopName.textContent = shopData.shopName;
        
        // Clear grids
        shopGrid.innerHTML = '';
        playerInventoryGrid.innerHTML = '';
        
        // Populate shop items
        shopData.inventory.forEach((item, index) => {
            const itemSlot = document.createElement('div');
            itemSlot.className = 'shop-item';
            if (item.stock <= 0) {
                itemSlot.classList.add('out-of-stock');
            }
            
            // Get item icon
            const itemIcon = this.getItemIcon(item);
            itemSlot.innerHTML = `
                ${itemIcon}
                <div class="shop-item-price">${item.price}g</div>
                <div class="shop-item-stock">${item.stock}</div>
            `;
            
            itemSlot.title = `${item.name} - ${item.price} coins (${item.stock} in stock)`;
            
            if (item.stock > 0) {
                itemSlot.addEventListener('click', () => {
                    this.buyItem(index, item);
                });
            }
            
            shopGrid.appendChild(itemSlot);
        });
        
        // Populate player inventory
        this.updateShopPlayerInventory();
        
        // Update player coins
        this.updatePlayerCoins();
        
        // Show shop interface
        shopInterface.style.display = 'flex';
    }

    updateShopPlayerInventory() {
        if (!game || !game.player) return;
        
        const playerInventoryGrid = document.getElementById('playerInventoryGrid');
        playerInventoryGrid.innerHTML = '';
        
        game.player.inventory.forEach((item, index) => {
            const itemSlot = document.createElement('div');
            itemSlot.className = 'shop-player-item';
            
            if (item) {
                const itemIcon = this.getItemIcon(item);
                itemSlot.textContent = itemIcon;
                itemSlot.title = `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`;
                
                // Only allow selling non-currency items
                if (item.type !== 'currency') {
                    itemSlot.addEventListener('click', () => {
                        this.sellItem(index, item);
                    });
                }
            }
            
            playerInventoryGrid.appendChild(itemSlot);
        });
    }

    updatePlayerCoins() {
        if (!game || !game.player) return;
        
        const playerCoins = document.getElementById('playerCoins');
        let coins = 0;
        
        for (let item of game.player.inventory) {
            if (item && item.name === 'coins') {
                coins = item.quantity || 0;
                break;
            }
        }
        
        playerCoins.textContent = `Coins: ${coins}`;
    }

    buyItem(itemIndex, item) {
        if (!this.currentShopId) return;
        
        socket.emit('buyItem', {
            shopId: this.currentShopId,
            itemIndex: itemIndex
        });
    }

    sellItem(itemIndex, item) {
        socket.emit('sellItem', {
            itemIndex: itemIndex
        });
    }

    closeShop() {
        const shopInterface = document.getElementById('shopInterface');
        shopInterface.style.display = 'none';
        this.currentShopId = null;
    }

    setupSpellbook() {
        const spells = document.querySelectorAll('.spell');
        spells.forEach(spell => {
            spell.addEventListener('click', () => {
                const spellName = spell.dataset.spell;
                
                // Deselect other spells
                spells.forEach(s => s.classList.remove('selected'));
                
                if (this.selectedSpell === spellName) {
                    // Deselect if clicking the same spell
                    this.selectedSpell = null;
                    addChatMessage('Spell deselected.', 'system');
                } else {
                    // Select new spell
                    this.selectedSpell = spellName;
                    spell.classList.add('selected');
                    
                    if (spellName === 'heal') {
                        addChatMessage(`${spellName} selected. Click to cast.`, 'system');
                        this.castSpell(spellName);
                    } else {
                        addChatMessage(`${spellName} selected. Click a target to cast.`, 'system');
                    }
                }
            });
        });
    }

    castSpell(spellName, targetType = null, targetId = null) {
        if (!game || !game.player) return;
        
        socket.emit('castSpell', {
            spellName: spellName,
            targetType: targetType,
            targetId: targetId
        });
        
        // Reset spell selection after casting
        this.selectedSpell = null;
        document.querySelectorAll('.spell').forEach(s => s.classList.remove('selected'));
    }

    getSelectedSpell() {
        return this.selectedSpell;
    }

    setupBankInterface() {
        const bankInterface = document.getElementById('bankInterface');
        const closeBank = document.getElementById('closeBank');
        
        closeBank.addEventListener('click', () => {
            this.closeBank();
        });
        
        // Close bank when clicking outside
        bankInterface.addEventListener('click', (e) => {
            if (e.target === bankInterface) {
                this.closeBank();
            }
        });
    }

    openBank(bankData) {
        this.bankOpen = true;
        const bankInterface = document.getElementById('bankInterface');
        const bankGrid = document.getElementById('bankGrid');
        const bankInventoryGrid = document.getElementById('bankInventoryGrid');
        
        // Clear grids
        bankGrid.innerHTML = '';
        bankInventoryGrid.innerHTML = '';
        
        // Create bank slots (100 slots)
        for (let i = 0; i < 100; i++) {
            const slot = document.createElement('div');
            slot.className = 'bank-item';
            slot.dataset.index = i;
            
            const item = bankData.bankItems[i];
            if (item) {
                slot.classList.add('occupied');
                const itemIcon = this.getItemIcon(item);
                slot.textContent = itemIcon;
                slot.title = `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`;
                
                slot.addEventListener('click', () => {
                    this.withdrawItem(i);
                });
            }
            
            bankGrid.appendChild(slot);
        }
        
        // Create inventory slots for bank interface
        for (let i = 0; i < 28; i++) {
            const slot = document.createElement('div');
            slot.className = 'bank-inv-item';
            slot.dataset.index = i;
            
            const item = bankData.inventory[i];
            if (item) {
                slot.classList.add('occupied');
                const itemIcon = this.getItemIcon(item);
                slot.textContent = itemIcon;
                slot.title = `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`;
                
                slot.addEventListener('click', () => {
                    this.depositItem(i);
                });
            }
            
            bankInventoryGrid.appendChild(slot);
        }
        
        // Show bank interface
        bankInterface.style.display = 'flex';
    }

    depositItem(inventoryIndex) {
        if (!game || !game.player || !this.bankOpen) return;
        
        const item = game.player.inventory[inventoryIndex];
        if (!item) return;
        
        socket.emit('depositItem', {
            inventoryIndex: inventoryIndex
        });
    }

    withdrawItem(bankIndex) {
        if (!this.bankOpen) return;
        
        socket.emit('withdrawItem', {
            bankIndex: bankIndex
        });
    }

    updateBank(bankData) {
        if (!this.bankOpen) return;
        
        // Update the bank interface with new data
        this.openBank(bankData);
    }

    closeBank() {
        const bankInterface = document.getElementById('bankInterface');
        bankInterface.style.display = 'none';
        this.bankOpen = false;
    }
}