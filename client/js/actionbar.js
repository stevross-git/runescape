class ActionBar {
    constructor() {
        this.slots = new Array(10).fill(null);
        this.combatMode = false;
        this.autoRetaliate = true;
        this.runMode = false;
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    setupEventListeners() {
        // Action bar slots
        const actionSlots = document.querySelectorAll('.action-slot');
        actionSlots.forEach((slot, index) => {
            slot.addEventListener('click', () => {
                this.useActionSlot(index);
            });

            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.clearActionSlot(index);
            });

            // Allow dropping items/spells onto action bar
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('drag-over');
            });

            slot.addEventListener('dragleave', () => {
                slot.classList.remove('drag-over');
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                this.handleDrop(index, e);
            });
        });

        // Combat mode toggle
        const combatModeBtn = document.getElementById('combatModeBtn');
        combatModeBtn.addEventListener('click', () => {
            this.toggleCombatMode();
        });

        // Auto retaliate toggle
        const autoRetaliateBtn = document.getElementById('autoRetaliateBtn');
        autoRetaliateBtn.addEventListener('click', () => {
            this.toggleAutoRetaliate();
        });

        // Run mode toggle
        const runModeBtn = document.getElementById('runModeBtn');
        runModeBtn.addEventListener('click', () => {
            this.toggleRunMode();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Number keys 1-9, 0 for action bar slots
            if (e.key >= '1' && e.key <= '9') {
                const slotIndex = parseInt(e.key) - 1;
                this.useActionSlot(slotIndex);
                e.preventDefault();
            } else if (e.key === '0') {
                this.useActionSlot(9); // Slot 10 (0-indexed as 9)
                e.preventDefault();
            }

            // Space for combat mode toggle
            if (e.code === 'Space' && !e.target.matches('input')) {
                this.toggleCombatMode();
                e.preventDefault();
            }

            // Tab for auto retaliate
            if (e.key === 'Tab' && !e.target.matches('input')) {
                this.toggleAutoRetaliate();
                e.preventDefault();
            }

            // Shift for run mode
            if (e.key === 'Shift') {
                if (!this.runMode) {
                    this.toggleRunMode();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            // Release shift to stop running
            if (e.key === 'Shift' && this.runMode) {
                this.toggleRunMode();
            }
        });
    }

    assignToSlot(slotIndex, item) {
        if (slotIndex < 0 || slotIndex >= 10) return false;

        this.slots[slotIndex] = {
            type: item.type, // 'item', 'spell', 'ability'
            id: item.id || item.name,
            name: item.name,
            icon: item.icon,
            data: item
        };

        this.updateSlotDisplay(slotIndex);
        return true;
    }

    updateSlotDisplay(slotIndex) {
        const slot = document.querySelector(`.action-slot[data-slot=\"${slotIndex}\"]`);
        if (!slot) return;

        const assignment = this.slots[slotIndex];
        if (assignment) {
            slot.classList.add('assigned');
            slot.innerHTML = `
                ${assignment.icon || '📦'}
                <div class="slot-number">${slotIndex === 9 ? '0' : (slotIndex + 1)}</div>
            `;
            slot.title = `${assignment.name} (Key: ${slotIndex === 9 ? '0' : (slotIndex + 1)})`;
        } else {
            slot.classList.remove('assigned');
            slot.innerHTML = slotIndex === 9 ? '0' : (slotIndex + 1).toString();
            slot.title = `Action Slot ${slotIndex + 1} (Key: ${slotIndex === 9 ? '0' : (slotIndex + 1)})`;
        }
    }

    useActionSlot(slotIndex) {
        const assignment = this.slots[slotIndex];
        if (!assignment) return;

        switch (assignment.type) {
            case 'item':
                this.useItem(assignment);
                break;
            case 'spell':
                this.castSpell(assignment);
                break;
            case 'ability':
                this.useAbility(assignment);
                break;
            case 'food':
                this.eatFood(assignment);
                break;
            case 'potion':
                this.drinkPotion(assignment);
                break;
        }

        // Add cooldown effect
        this.addCooldown(slotIndex, 1000); // 1 second cooldown
    }

    useItem(assignment) {
        // Find the item in inventory and use it
        if (game && game.player) {
            const inventoryIndex = game.player.inventory.findIndex(item => 
                item && item.name === assignment.name
            );
            
            if (inventoryIndex !== -1) {
                const item = game.player.inventory[inventoryIndex];
                if (item.type === 'consumable') {
                    game.ui.useItem(inventoryIndex);
                } else {
                    addChatMessage(`You cannot use ${item.name} from the action bar`, 'system');
                }
            } else {
                addChatMessage(`You don't have any ${assignment.name}`, 'system');
            }
        }
    }

    castSpell(assignment) {
        if (game && game.ui) {
            game.ui.castSpell(assignment.id);
            addChatMessage(`Casting ${assignment.name}...`, 'system');
        }
    }

    useAbility(assignment) {
        // Placeholder for special abilities
        addChatMessage(`Using ability: ${assignment.name}`, 'system');
    }

    eatFood(assignment) {
        this.useItem(assignment);
    }

    drinkPotion(assignment) {
        this.useItem(assignment);
    }

    clearActionSlot(slotIndex) {
        this.slots[slotIndex] = null;
        this.updateSlotDisplay(slotIndex);
        addChatMessage(`Cleared action slot ${slotIndex + 1}`, 'system');
    }

    addCooldown(slotIndex, duration) {
        const slot = document.querySelector(`.action-slot[data-slot=\"${slotIndex}\"]`);
        if (!slot) return;

        slot.classList.add('cooldown');
        setTimeout(() => {
            slot.classList.remove('cooldown');
        }, duration);
    }

    toggleCombatMode() {
        this.combatMode = !this.combatMode;
        const btn = document.getElementById('combatModeBtn');
        
        if (this.combatMode) {
            btn.classList.add('active');
            addChatMessage('Combat mode enabled', 'system');
        } else {
            btn.classList.remove('active');
            addChatMessage('Combat mode disabled', 'system');
        }

        // Emit to server
        if (socket) {
            socket.emit('toggleCombatMode', this.combatMode);
        }
    }

    toggleAutoRetaliate() {
        this.autoRetaliate = !this.autoRetaliate;
        const btn = document.getElementById('autoRetaliateBtn');
        
        if (this.autoRetaliate) {
            btn.classList.add('active');
            addChatMessage('Auto retaliate enabled', 'system');
        } else {
            btn.classList.remove('active');
            addChatMessage('Auto retaliate disabled', 'system');
        }

        // Emit to server
        if (socket) {
            socket.emit('toggleAutoRetaliate', this.autoRetaliate);
        }
    }

    toggleRunMode() {
        this.runMode = !this.runMode;
        const btn = document.getElementById('runModeBtn');
        
        if (this.runMode) {
            btn.classList.add('active');
            addChatMessage('Run mode enabled', 'system');
        } else {
            btn.classList.remove('active');
            addChatMessage('Run mode disabled', 'system');
        }

        // Emit to server
        if (socket) {
            socket.emit('toggleRunMode', this.runMode);
        }
    }

    handleDrop(slotIndex, event) {
        // Handle dropping items or spells onto action bar
        const dragData = event.dataTransfer.getData('text/plain');
        
        try {
            const itemData = JSON.parse(dragData);
            
            // Determine the type and create assignment
            let assignment = {
                type: itemData.type || 'item',
                id: itemData.id || itemData.name,
                name: itemData.name,
                icon: itemData.icon || '📦',
                data: itemData
            };

            // Special handling for different item types
            if (itemData.consumable) {
                assignment.type = itemData.name.includes('potion') ? 'potion' : 'food';
            }
            
            this.assignToSlot(slotIndex, assignment);
            addChatMessage(`Assigned ${itemData.name} to action slot ${slotIndex + 1}`, 'system');
            
        } catch (e) {
            console.log('Invalid drag data for action bar');
        }
    }

    // Method to auto-assign commonly used items
    autoAssignItem(item) {
        // Auto-assign food items to empty slots
        if (item.type === 'consumable' && item.healAmount) {
            const emptySlot = this.slots.findIndex(slot => slot === null);
            if (emptySlot !== -1) {
                this.assignToSlot(emptySlot, {
                    type: 'food',
                    name: item.name,
                    icon: game.ui.getItemIcon(item),
                    data: item
                });
            }
        }
    }

    // Initialize with common spells/items
    initializeDefaults() {
        // Auto-assign heal spell if available
        this.assignToSlot(0, {
            type: 'spell',
            id: 'heal',
            name: 'Heal',
            icon: '💚',
            data: { spell: 'heal' }
        });

        // Auto-assign wind strike spell
        this.assignToSlot(1, {
            type: 'spell',
            id: 'wind strike',
            name: 'Wind Strike',
            icon: '💨',
            data: { spell: 'wind strike' }
        });
    }
}