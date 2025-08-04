# RuneScape Clone

A web-based multiplayer RuneScape clone built with HTML5 Canvas and Node.js.

## Features

- **Real-time Multiplayer**: Play with other players in real-time using Socket.IO
- **Character System**: Create an account, level up skills, and track your progress
- **Interactive World**: Explore a 2000x2000 pixel world with trees, rocks, and NPCs
- **Combat System**: Fight goblins and other creatures to gain experience
- **Resource Gathering**: Mine rocks and chop trees to collect materials
- **Skills System**: Level up Attack, Defense, Strength, Magic, Mining, and Woodcutting
- **Inventory Management**: 28-slot inventory system
- **Chat System**: Communicate with other players

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd runescape
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

### Development

For development with auto-restart:
```bash
npm run dev
```

## How to Play

1. **Create Account**: Register with a username and password
2. **Movement**: Click anywhere on the green canvas to move, or use WASD keys
3. **Combat**: Click on brown goblin squares to attack them
4. **Resource Gathering**: Click on trees (green circles) or rocks (gray squares) to gather materials
5. **Chat**: Use the chat box in the bottom-left to communicate with other players
6. **Inventory**: Check your items in the inventory panel on the right
7. **Skills**: Monitor your skill levels in the skills panel

## Game Elements

- **Trees**: Green circles with brown trunks - click to gather logs (Woodcutting skill)
- **Rocks**: Gray squares - click to mine ore (Mining skill)  
- **Goblins**: Brown squares with level indicators - click to attack (Combat skills)
- **Your Character**: Golden square with your username
- **Other Players**: Golden squares with their usernames

## Technical Details

- **Client**: HTML5 Canvas, JavaScript ES6
- **Server**: Node.js, Express, Socket.IO
- **Real-time Communication**: WebSocket connections
- **Data Storage**: In-memory (sessions only)

## License

MIT License