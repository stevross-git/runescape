# 🎨 Tile Image Generation Guide

## Overview
Every tile folder now contains a `prompts.txt` file with 10 different style variations. Use these prompts with AI image generators like DALL-E, Midjourney, or Stable Diffusion to create diverse tile sets.

## 📁 Structure
```
Each tile folder contains:
├── 1.png           (current/default image)
├── 2.png           (optional variants)
├── ...
├── 10.png          (up to 10 variants supported)
└── prompts.txt     (10 style prompts for generation)
```

## 🎭 Style Categories

### Countries (3 styles):
1. **Japanese Style** - Zen aesthetics, traditional art, minimalist
2. **German/European Style** - Bavarian charm, half-timbered, medieval
3. **Mexican/Arabian Style** - Desert themes, southwestern, Middle Eastern

### Games (2 styles):
4. **Minecraft Style** - Blocky, cubic design, sandbox aesthetic
5. **Animal Crossing Style** - Cute, cartoon, cozy Nintendo design

### Movies (3 styles):
6. **Disney Style** - Magical, fairy tale elements, animated
7. **Lord of the Rings Style** - Epic fantasy, Tolkien aesthetics
8. **Studio Ghibli Style** - Whimsical, anime movie magic

### TV Shows (2 styles):
9. **Game of Thrones Style** - Medieval, HBO drama, gritty
10. **Adventure Time Style** - Cartoon Network, colorful whimsy

## 🚀 How to Generate Images

### Step 1: Choose Your Tile
Navigate to any tile folder, e.g.:
```
terrain/grass/prompts.txt
buildings/castle/prompts.txt
trees/tree_oak/prompts.txt
```

### Step 2: Select Style
Pick one of the 10 prompts based on the aesthetic you want.

### Step 3: Generate
Use the prompt with your preferred AI image generator:
- **DALL-E 3** (OpenAI)
- **Midjourney** (Discord)
- **Stable Diffusion** (Various interfaces)

### Step 4: Save & Place
Save the generated image as:
- `2.png` for style #2
- `3.png` for style #3
- etc.

## 📋 Example Workflow

1. **Open**: `terrain/grass/prompts.txt`
2. **Copy**: "Japanese Style: Traditional grass with zen aesthetics, 16x16 pixel art"
3. **Generate**: Use prompt in DALL-E
4. **Save**: Result as `terrain/grass/2.png`
5. **Test**: Refresh world builder to see new variant

## 🎯 Tips for Best Results

### For AI Generation:
- Add "transparent background" if needed
- Specify "16x16 pixel art" for consistency
- Add "top-down view" for terrain tiles
- Include "video game asset" for proper style

### For Consistency:
- Keep similar lighting across variants
- Maintain color palette coherence
- Ensure tiles are seamless/tileable
- Test in-game before finalizing

## 📊 Tile Counts
- **Terrain**: 10 types × 10 styles = 100 possible images
- **Buildings**: 11 types × 10 styles = 110 possible images
- **Shops**: 8 types × 10 styles = 80 possible images
- **Trees**: 10 types × 10 styles = 100 possible images
- **Rocks**: 10 types × 10 styles = 100 possible images
- **Utilities**: 9 types × 10 styles = 90 possible images
- **Decorations**: 9 types × 10 styles = 90 possible images
- **Special**: 5 types × 10 styles = 50 possible images

**Total**: 72 tile types × 10 styles = **720 possible unique images**

## 🎪 Custom Styles
Want different styles? Edit any `prompts.txt` file to add:
- Historical periods (Victorian, Art Deco, etc.)
- Cultural themes (Celtic, Nordic, Asian, etc.)
- Artistic movements (Impressionist, Cubist, etc.)
- Other games/media inspirations

## 🔧 Integration
The world builder automatically:
- Loads all variants from folders
- Shows variant selector when multiple exist
- Saves chosen variant with each tile
- Renders correct variant in-game

Start generating your diverse tile collection! 🎨