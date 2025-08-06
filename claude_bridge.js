#!/usr/bin/env node

// Claude Code Bridge - Monitors for messages from the game terminal
const fs = require('fs');
const path = require('path');
const http = require('http');

const SERVER_URL = 'http://localhost:3000';
const CHECK_INTERVAL = 2000; // Check every 2 seconds

console.log('🚀 Claude Code Bridge Starting...');
console.log('📡 Monitoring for messages from game terminal...');
console.log('🌐 Server URL:', SERVER_URL);

let lastCheckedTime = new Date().toISOString();
let processedMessages = new Set();

function checkForMessages() {
    const url = `${SERVER_URL}/claude/messages`;
    
    http.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const messages = JSON.parse(data);
                const newMessages = messages.filter(msg => 
                    msg.status === 'PENDING' && 
                    !processedMessages.has(msg.id) &&
                    new Date(msg.timestamp) > new Date(lastCheckedTime)
                );
                
                newMessages.forEach(message => {
                    console.log('\n' + '='.repeat(80));
                    console.log('📥 NEW MESSAGE FROM CLAUDE TERMINAL:');
                    console.log('='.repeat(80));
                    console.log('🕐 Timestamp:', message.timestamp);
                    console.log('💬 Command:', message.command);
                    console.log('🆔 Message ID:', message.id);
                    console.log('\n📜 FULL MESSAGE:');
                    console.log('-'.repeat(40));
                    console.log(message.fullMessage);
                    console.log('-'.repeat(40));
                    console.log('\n💡 RESPOND TO THIS MESSAGE ABOVE ☝️');
                    console.log('='.repeat(80));
                    
                    processedMessages.add(message.id);
                    
                    // Mark as processed on server
                    markAsProcessed(message.id);
                });
                
                if (newMessages.length > 0) {
                    lastCheckedTime = new Date().toISOString();
                }
                
            } catch (error) {
                // Server might be down, continue silently
            }
        });
        
    }).on('error', (error) => {
        // Server might be down, continue silently
    });
}

function markAsProcessed(messageId) {
    const postData = '';
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/claude/processed/${messageId}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    const req = http.request(options, (res) => {
        // Message marked as processed
    });
    
    req.on('error', (error) => {
        // Continue silently
    });
    
    req.write(postData);
    req.end();
}

// Start monitoring
setInterval(checkForMessages, CHECK_INTERVAL);

// Initial check
setTimeout(checkForMessages, 1000);

console.log(`✅ Bridge active! Checking every ${CHECK_INTERVAL}ms for new messages...`);
console.log('🎮 Go to your game and type commands in the Claude Terminal!');
console.log('📝 Messages will appear here automatically...\n');