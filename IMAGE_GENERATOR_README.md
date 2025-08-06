# 🎨 RuneScape Tile Image Generator

A Python application for batch generating tile images using OpenAI's DALL-E API. Automatically reads prompt files and generates images with proper naming and folder structure.

## 🚀 Features

- **Interactive Menu System**: Browse and select from 72+ prompt files
- **Smart File Detection**: Automatically scans all tile categories and types
- **Progress Tracking**: Shows existing vs missing images (e.g., "9/10")
- **Batch Generation**: Generate all missing images or specific selections
- **Proper Naming**: Auto-saves as 1.png, 2.png, etc. in correct folders
- **Error Handling**: Robust error handling with detailed status messages
- **Rate Limiting**: Built-in delays to respect OpenAI API limits

## 📋 Prerequisites

1. **Python 3.7+** with required packages:
   ```bash
   pip install requests python-dotenv
   ```

2. **OpenAI API Key** in your `.env` file:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Prompt Files**: The system reads from `client/assets/world_builder/` structure

## 🎯 Quick Start

### Option 1: Interactive Mode
```bash
python tile_image_generator_simple.py
```

This launches an interactive menu where you can:
- Browse all 72 prompt files organized by category
- See current progress (e.g., "grass (9/10)")
- Select specific files to work on
- Choose generation options

### Option 2: Demo Mode
```bash
python demo_image_generator.py
```

Shows how the system works with a sample file.

## 📁 File Structure

The system expects this folder structure:
```
client/assets/world_builder/
├── terrain/
│   ├── grass/
│   │   ├── prompts.txt
│   │   ├── 1.png (existing)
│   │   ├── 2.png (existing)
│   │   └── 10.png (missing - will be generated)
│   └── dirt/
│       ├── prompts.txt
│       └── (images 1-10)
├── buildings/
├── shops/
├── trees/
├── rocks/
├── utilities/
├── decorations/
└── special/
```

## 📝 Prompt File Format

Each `prompts.txt` file contains 10 style variations:

```
TILE_NAME TILE PROMPTS - 10 Style Variations

1. Japanese Style (Country):
"Japanese zen garden grass texture, mossy green, subtle bamboo leaf patterns, traditional Japanese art style, 16x16 pixel art, top-down view, seamless tile, soft natural colors, video game asset"

2. Mexican Style (Country):
"Mexican desert grass texture, dry yellow-green grass, agave plant hints, vibrant aztec-inspired patterns, 16x16 pixel art, top-down view, warm earthy colors, video game tile asset"

...
```

## 🎮 Usage Examples

### Generate Missing Images for Grass
1. Run `python tile_image_generator_simple.py`
2. Select file `46. [terrain] grass (9/10)`
3. Choose "1. Generate all missing images"
4. Confirm and wait for generation

### Generate Specific Variants
1. Select your desired tile type
2. Choose "2. Generate specific prompt numbers"
3. Enter numbers like `1,3,5` to generate those variants
4. System will show you what exists vs what's missing

### Browse Available Prompts
1. Select any tile type
2. Choose "3. Show prompts and exit"
3. See all 10 style variations with preview text

## ⚡ Generation Process

For each image, the system:

1. **Enhances Prompt**: Adds "transparent background, 16x16 pixel art, top-down view, video game tile, high quality"
2. **Calls DALL-E 3**: Uses 1024x1024 resolution for high quality
3. **Downloads Image**: Retrieves the generated PNG
4. **Saves Correctly**: Names as `{number}.png` in the right folder
5. **Rate Limits**: Waits 5 seconds between generations

## 📊 Statistics Overview

Current system supports:
- **72 Tile Types** across 8 categories
- **720 Possible Images** (72 × 10 variants each)
- **10 Art Styles**: 3 countries, 2 games, 3 movies, 2 TV shows

### Style Categories:
1. **Japanese** - Zen aesthetics, traditional art
2. **Mexican/Arabian** - Desert themes, southwestern
3. **Scottish** - Highland, Celtic patterns
4. **Minecraft** - Blocky, cubic design
5. **Zelda/Animal Crossing** - Nintendo cartoon style
6. **Lord of the Rings** - Epic fantasy
7. **Avatar/Studio Ghibli** - Cinematic magic
8. **Game of Thrones** - Medieval HBO drama
9. **Adventure Time** - Cartoon Network whimsy

## 🛠️ Advanced Features

### Check Progress
The main menu shows current status:
```
46. [terrain] grass (9/10)  ← 9 images exist, 1 missing
47. [terrain] dirt (0/10)   ← No images yet
48. [terrain] stone (2/10)  ← 2 images, 8 missing
```

### Resume Interrupted Sessions
- System automatically detects existing images
- Only generates what's actually missing
- Can restart anytime without losing progress

### Error Recovery
- Handles API failures gracefully
- Shows detailed error messages
- Continues with remaining images if some fail

## 💡 Tips for Best Results

### Prompt Enhancement
The system automatically adds:
- `transparent background` - For proper tile blending
- `16x16 pixel art` - Consistent art style
- `top-down view` - Correct perspective
- `video game tile` - Gaming aesthetic
- `high quality` - Better output

### Cost Management
- Each DALL-E 3 image costs ~$0.04
- Full generation (720 images) ≈ $30
- Generate selectively to control costs
- Focus on tiles you'll actually use

### Organization Tips
- Generate core terrain first (grass, dirt, stone, water)
- Add buildings for your main towns
- Generate monsters/NPCs as needed
- Save specialty tiles (lava, ice) for later

## 🚨 Troubleshooting

### "No prompts found"
- Check that `prompts.txt` files exist in tile folders
- Verify the file format matches the expected structure

### "API Error"
- Check your OpenAI API key in `.env`
- Verify you have sufficient API credits
- Check internet connection

### "Permission Error"
- Ensure write permissions to the assets folder
- Run as administrator if needed on Windows

## 🎯 Integration with World Builder

Generated images automatically work with the world builder:
1. Images are saved in the correct folder structure
2. World builder loads images on refresh
3. Multi-variant system shows selection popup
4. Each tile type can have up to 10 visual styles

## 📈 Future Enhancements

Potential improvements:
- GUI interface with tkinter
- Batch processing all tiles
- Custom prompt editing
- Progress persistence
- Image preview before saving
- Different AI model options

## 🎪 Ready to Use!

Your image generator is ready to create hundreds of unique tile variants! Start with a few key tiles and expand your collection over time.

**Happy generating!** 🎨✨