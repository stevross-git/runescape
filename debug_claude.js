// Debug the Claude system step by step
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Simple test of the automatic processing function
async function testAutomaticProcessing() {
    console.log('🧪 Testing automatic processing logic...');
    
    // Test extractIconType function
    function extractIconType(command) {
        const types = ['stone', 'mud', 'sand', 'snow', 'water', 'grass', 'dirt', 'cobblestone'];
        return types.find(type => command.includes(type));
    }
    
    // Test commands
    const testCommands = [
        'update water icon',
        'update the stone icon', 
        'change dirt icon',
        'modify grass image'
    ];
    
    testCommands.forEach(cmd => {
        const iconType = extractIconType(cmd.toLowerCase());
        console.log(`Command: "${cmd}" -> Icon Type: ${iconType}`);
    });
    
    // Test file update logic
    async function updateIconAutomatically(iconType) {
        try {
            const htmlFile = path.join(__dirname, 'client/runescape_world_builder.html');
            const jsFile = path.join(__dirname, 'client/js/runescape_world_builder.js');
            
            console.log(`📁 HTML File: ${htmlFile}`);
            console.log(`📁 JS File: ${jsFile}`);
            console.log(`🔍 Checking if files exist...`);
            console.log(`HTML exists: ${fs.existsSync(htmlFile)}`);
            console.log(`JS exists: ${fs.existsSync(jsFile)}`);
            
            if (!fs.existsSync(htmlFile)) {
                return { success: false, error: 'HTML file not found' };
            }
            
            if (!fs.existsSync(jsFile)) {
                return { success: false, error: 'JS file not found' };
            }
            
            // Define icon updates
            const iconUpdates = {
                water: { emoji: '🌊', gradient: 'linear-gradient(135deg, #4169E1, #1E90FF, #87CEEB)', color: '#4169E1' },
                grass: { emoji: '🌱', gradient: 'linear-gradient(135deg, #228B22, #32CD32, #90EE90)', color: '#228B22' }
            };
            
            const update = iconUpdates[iconType];
            if (!update) {
                return { success: false, error: `No update defined for ${iconType}` };
            }
            
            console.log(`🎨 Update for ${iconType}:`, update);
            
            // Read HTML file
            let htmlContent = fs.readFileSync(htmlFile, 'utf8');
            console.log(`📖 HTML file size: ${htmlContent.length} characters`);
            
            // Find current water tile line
            const waterMatch = htmlContent.match(/data-type="water"[^>]*>/);
            console.log(`🔍 Current water tile: ${waterMatch ? waterMatch[0] : 'NOT FOUND'}`);
            
            return { success: true, message: 'Test completed' };
            
        } catch (error) {
            console.error('❌ Error in updateIconAutomatically:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Test with water icon
    const result = await updateIconAutomatically('water');
    console.log('🎯 Test result:', result);
}

// Run the test
testAutomaticProcessing().catch(console.error);