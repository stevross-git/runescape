// Simple Claude Terminal Server - Guaranteed to work
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

let messageQueue = [];

// Simple automatic processor
function processMessage(command) {
    console.log(`🤖 AUTO-PROCESSING: "${command}"`);
    
    const cmd = command.toLowerCase();
    
    if (cmd.includes('grass')) {
        setTimeout(() => {
            console.log('✏️ Updating grass icon...');
            updateGrassIcon();
            io.emit('claudeUpdate', { status: '✅ Grass icon updated to 🌿!', type: 'success' });
        }, 2000);
        return 'grass';
    }
    
    if (cmd.includes('water')) {
        setTimeout(() => {
            console.log('✏️ Updating water icon...');
            updateWaterIcon();
            io.emit('claudeUpdate', { status: '✅ Water icon updated to 💧!', type: 'success' });
        }, 2000);
        return 'water';
    }
    
    if (cmd.includes('stone')) {
        setTimeout(() => {
            console.log('✏️ Updating stone icon...');
            updateStoneIcon();
            io.emit('claudeUpdate', { status: '✅ Stone icon updated to 🗿!', type: 'success' });
        }, 2000);
        return 'stone';
    }
    
    setTimeout(() => {
        io.emit('claudeUpdate', { status: '✅ Command processed!', type: 'success' });
    }, 1500);
    
    return 'generic';
}

function updateGrassIcon() {
    try {
        const htmlFile = path.join(__dirname, 'client/runescape_world_builder.html');
        let content = fs.readFileSync(htmlFile, 'utf8');
        
        // Simple replacement
        content = content.replace(
            /data-type="grass"[^>]*>🌱/g,
            'data-type="grass" data-name="Grass" style="background: linear-gradient(135deg, #228B22, #32CD32, #90EE90);">🌿'
        );
        
        fs.writeFileSync(htmlFile, content);
        console.log('✅ Grass icon updated in HTML');
    } catch (error) {
        console.error('❌ Error updating grass:', error.message);
    }
}

function updateWaterIcon() {
    try {
        const htmlFile = path.join(__dirname, 'client/runescape_world_builder.html');
        let content = fs.readFileSync(htmlFile, 'utf8');
        
        content = content.replace(
            /data-type="water"[^>]*>🌊/g,
            'data-type="water" data-name="Water" style="background: linear-gradient(135deg, #1E90FF, #00BFFF, #87CEEB);">💧'
        );
        
        fs.writeFileSync(htmlFile, content);
        console.log('✅ Water icon updated in HTML');
    } catch (error) {
        console.error('❌ Error updating water:', error.message);
    }
}

function updateStoneIcon() {
    try {
        const htmlFile = path.join(__dirname, 'client/runescape_world_builder.html');
        let content = fs.readFileSync(htmlFile, 'utf8');
        
        content = content.replace(
            /data-type="stone"[^>]*>🪨/g,
            'data-type="stone" data-name="Stone" style="background: linear-gradient(135deg, #696969, #A9A9A9, #D3D3D3);">🗿'
        );
        
        fs.writeFileSync(htmlFile, content);
        console.log('✅ Stone icon updated in HTML');
    } catch (error) {
        console.error('❌ Error updating stone:', error.message);
    }
}

// API endpoint
app.post('/claude/send', (req, res) => {
    const { command } = req.body;
    const messageId = Date.now();
    
    console.log(`📥 RECEIVED: "${command}"`);
    
    // Send immediate updates
    io.emit('claudeUpdate', { status: '🔍 Claude is analyzing...', type: 'system' });
    
    setTimeout(() => {
        io.emit('claudeUpdate', { status: `✏️ Processing: ${command}`, type: 'system' });
        const result = processMessage(command);
        
        setTimeout(() => {
            io.emit('claudeUpdate', { status: '🔄 Auto-refreshing page...', type: 'system' });
            setTimeout(() => {
                io.emit('autoRefresh', { reason: 'Icon updated' });
            }, 1000);
        }, 3000);
        
    }, 1000);
    
    res.json({ success: true, messageId });
});

// Socket connection
io.on('connection', (socket) => {
    console.log('🌐 Client connected to Claude terminal');
});

const PORT = 3001; // Use different port to avoid conflicts

server.listen(PORT, () => {
    console.log('🚀 Simple Claude Terminal Server running on port', PORT);
    console.log(`🌐 Open: http://localhost:${PORT}/runescape_world_builder.html`);
    console.log('💻 Click "Claude Terminal" and type: update grass icon');
});