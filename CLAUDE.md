# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based RuneScape clone built with HTML5 Canvas, JavaScript, and Node.js. It features:
- Real-time multiplayer gameplay using Socket.IO
- Player movement, stats, and inventory systems
- Skills system (combat, mining, woodcutting, etc.)
- Interactive world with NPCs, trees, and rocks
- Basic combat and resource gathering mechanics

## Commands

### Development
- `npm install` - Install dependencies
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

### Testing
- `npm test` - Run tests (not implemented yet)

## Architecture

### Client-Side (`/client`)
- `index.html` - Main game interface with login screen and game canvas
- `js/main.js` - Entry point, handles Socket.IO connection and login/register
- `js/game.js` - Main game loop, handles rendering and updates
- `js/player.js` - Player class with movement, stats, inventory, and skills
- `js/world.js` - World rendering, camera system, trees, rocks, NPCs
- `js/ui.js` - UI management for inventory, stats, notifications
- `css/style.css` - Game styling with RuneScape-inspired theme

### Server-Side (`/server`)
- `index.js` - Express server with Socket.IO, handles player authentication, movement, chat, combat, and resource gathering

### Key Systems
- **Movement**: Click-to-move with WASD support
- **Combat**: Click NPCs to attack, gain experience and items
- **Resource Gathering**: Click trees/rocks to gather materials
- **Skills**: Level up through activities (combat, mining, woodcutting)
- **Inventory**: 28-slot system with drag/drop interface
- **Chat**: Real-time messaging system

## Game World
- 2000x2000 pixel world with procedurally placed resources
- Camera follows player with smooth scrolling
- Tile-based grass rendering for performance
- Objects: Oak trees (100hp), Iron rocks (50hp), Goblins (15hp, level 2)

## Player Data Structure
```javascript
{
  stats: { hp, maxHp, mp, maxMp, level, experience },
  skills: { attack, defense, strength, magic, mining, woodcutting },
  inventory: Array(28) // null or { name, quantity }
}
```

## Development Notes
- Server runs on port 3000 by default
- Player data is stored in memory (not persistent)
- All coordinates are validated server-side
- Resource gathering and combat have randomized success rates