let socket;
let game;

document.addEventListener('DOMContentLoaded', async function() {
    const loadingScreen = document.getElementById('loadingScreen');
    const loginScreen = document.getElementById('loginScreen');
    const gameScreen = document.getElementById('gameScreen');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const loadingProgress = document.getElementById('loadingProgress');
    const loadingText = document.getElementById('loadingText');

    // Load images first
    console.log('Starting asset loading...');
    
    // Update loading progress periodically
    const progressInterval = setInterval(() => {
        const progress = imageManager.getLoadingProgress();
        loadingProgress.style.width = progress.percentage + '%';
        loadingText.textContent = `Loading assets... ${progress.loaded}/${progress.total} (${progress.percentage}%)`;
    }, 100);

    try {
        // Load all images
        await imageManager.loadAllImages();
        
        // Loading complete
        clearInterval(progressInterval);
        loadingProgress.style.width = '100%';
        loadingText.textContent = 'Assets loaded successfully!';
        
        // Force a test to confirm images loaded
        console.log('Image loading complete. Grass image available:', imageManager.hasImage('grass'));
        console.log('Total images loaded:', imageManager.loadedImages);
        
        // Wait a moment then show login screen
        setTimeout(() => {
            loadingScreen.classList.remove('active');
            loginScreen.classList.add('active');
        }, 500);
        
    } catch (error) {
        console.error('Failed to load assets:', error);
        clearInterval(progressInterval);
        loadingText.textContent = 'Failed to load some assets. Continuing anyway...';
        
        setTimeout(() => {
            loadingScreen.classList.remove('active');
            loginScreen.classList.add('active');
        }, 1000);
    }

    socket = io();
    window.socket = socket; // Make socket globally available

    loginBtn.addEventListener('click', function() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (username && password) {
            socket.emit('login', { username, password });
        }
    });

    registerBtn.addEventListener('click', function() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (username && password) {
            socket.emit('register', { username, password });
        }
    });

    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });

    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });

    socket.on('loginSuccess', function(playerData) {
        loginScreen.classList.remove('active');
        gameScreen.classList.add('active');
        
        game = new Game();
        game.init(playerData);
        
        addChatMessage('Welcome to RuneScape Clone!', 'system');
    });

    socket.on('loginFailed', function(message) {
        alert(message);
    });

    socket.on('registerSuccess', function(message) {
        alert(message);
    });

    socket.on('registerFailed', function(message) {
        alert(message);
    });

    socket.on('playerMove', function(data) {
        if (game) {
            game.updatePlayerPosition(data);
        }
    });

    socket.on('playersUpdate', function(players) {
        if (game) {
            game.updateOtherPlayers(players);
        }
    });

    socket.on('chatMessage', function(data) {
        addChatMessage(`${data.username}: ${data.message}`, 'player');
    });

    socket.on('resourceDamaged', function(data) {
        if (game && game.world) {
            game.world.damageResource(data);
        }
    });

    socket.on('skillUpdate', function(data) {
        if (game && game.player) {
            game.player.skills[data.skill] = data.level;
            game.ui.updateSkills(game.player.skills);
        }
    });

    socket.on('levelUp', function(data) {
        if (game && game.ui) {
            game.ui.showLevelUpNotification(data.skill, data.level);
            soundManager.playChord('levelup_chord');
        }
    });

    socket.on('inventoryUpdate', function(data) {
        if (game && game.player && game.ui) {
            game.player.inventory = data.inventory;
            game.ui.updateInventory(game.player.inventory);
            
            // Update shop interface if open
            if (game.ui.currentShopId) {
                game.ui.updateShopPlayerInventory();
                game.ui.updatePlayerCoins();
            }
            
            console.log('Inventory updated:', data.inventory);
        }
    });

    socket.on('npcPositions', function(npcData) {
        if (game && game.world) {
            game.world.updateNPCs(npcData);
        }
    });

    socket.on('npcUpdate', function(data) {
        if (game && game.world) {
            game.world.updateSingleNPC(data);
        }
    });

    socket.on('takeDamage', function(data) {
        if (game && game.player && game.ui) {
            game.player.stats.hp = data.hp;
            game.ui.updatePlayerStats(game.player.stats);
            
            const defenseText = data.playerDefense > 0 ? ` (${data.playerDefense} defense)` : '';
            addChatMessage(`The ${data.attacker} hits you for ${data.damage} damage!${defenseText}`, 'combat');
            
            // Screen flash effect when taking damage
            game.ui.showDamageEffect();
        }
    });

    socket.on('playerDeath', function(data) {
        if (game && game.ui) {
            addChatMessage(`You have been killed by a ${data.killer}!`, 'combat');
            game.ui.showDeathScreen();
        }
    });

    socket.on('npcAttack', function(data) {
        // Visual attack animation for all players to see
        if (game && game.world) {
            game.world.showAttackAnimation(data.npcId, data.targetId);
        }
    });

    socket.on('respawned', function(data) {
        if (game && game.player) {
            game.player.x = data.x;
            game.player.y = data.y;
            game.player.stats.hp = data.hp;
            game.player.stats.maxHp = data.maxHp;
            
            // Update camera and UI
            game.world.updateCamera(game.player.x, game.player.y, game.canvas.width, game.canvas.height);
            game.ui.updatePlayerStats(game.player.stats);
            
            // Close death screen if it exists
            if (window.currentDeathOverlay) {
                window.currentDeathOverlay.remove();
                window.currentDeathOverlay = null;
            }
        }
    });

    socket.on('itemUsed', function(data) {
        if (game && game.player && game.ui) {
            game.player.stats.hp = data.newHp;
            game.player.stats.maxHp = data.maxHp;
            game.ui.updatePlayerStats(game.player.stats);
            
            // Show healing effect
            if (data.healAmount > 0) {
                game.ui.showHealingEffect(data.healAmount);
                soundManager.playSound('eat');
            }
        }
    });

    socket.on('shopOpened', function(shopData) {
        if (game && game.ui) {
            game.ui.openShop(shopData);
            soundManager.playSound('shop');
        }
    });

    socket.on('itemBought', function(data) {
        if (game && game.ui) {
            game.ui.updateShopPlayerInventory();
            game.ui.updatePlayerCoins();
        }
    });

    socket.on('spellCast', function(data) {
        if (game && game.ui) {
            soundManager.playChord('magic_sparkle');
            
            if (data.healAmount) {
                // Healing spell
                game.player.stats.hp = data.newHp;
                game.ui.updatePlayerStats(game.player.stats);
                game.ui.showHealingEffect(data.healAmount);
            }
            
            if (data.damage && data.targetId) {
                // Offensive spell visual effects could be added here
                addChatMessage(`Your spell hits for ${data.damage} damage!`, 'combat');
            }
        }
    });

    socket.on('bankOpened', function(bankData) {
        if (game && game.ui) {
            game.ui.openBank(bankData);
        }
    });

    socket.on('bankUpdate', function(bankData) {
        if (game && game.ui) {
            game.ui.updateBank(bankData);
            // Also update main inventory display
            game.player.inventory = bankData.inventory;
            game.ui.updateInventory(game.player.inventory);
        }
    });

    socket.on('disconnect', function() {
        addChatMessage('Connection lost', 'system');
    });

    // PvP Event Handlers
    socket.on('pvpAreaEntered', function(data) {
        addChatMessage(`⚠️ You have entered the ${data.area}!`, 'system');
        addChatMessage(`${data.description}`, 'system');
    });

    socket.on('pvpAreaLeft', function() {
        addChatMessage('You have left the PvP area', 'system');
    });

    socket.on('playerAttacked', function(data) {
        if (game && game.world) {
            // Show attack animation between players
            addChatMessage(`Player attack: ${data.damage} damage!`, 'combat');
        }
    });

    // Trading Event Handlers
    socket.on('tradeRequest', function(data) {
        if (confirm(`${data.fromUsername} wants to trade with you. Accept?`)) {
            socket.emit('acceptTrade', { fromId: data.fromId });
        } else {
            socket.emit('declineTrade', { fromId: data.fromId });
        }
    });

    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const message = chatInput.value.trim();
            if (message) {
                socket.emit('chatMessage', message);
                chatInput.value = '';
            }
        }
    });
});

function addChatMessage(message, type) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${type}`;
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}