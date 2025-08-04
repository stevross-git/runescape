from PIL import Image, ImageDraw
import os

# Create directories
os.makedirs('client/assets/world_builder', exist_ok=True)
os.makedirs('client/assets/world_builder/prompts', exist_ok=True)

def create_placeholder_image(name, size, color, symbol=''):
    """Create a simple placeholder image"""
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Fill with color
    draw.rectangle([0, 0, size[0], size[1]], fill=color)
    
    # Add border
    draw.rectangle([0, 0, size[0]-1, size[1]-1], outline=(0, 0, 0, 255), width=1)
    
    # Save image
    img.save(f'client/assets/world_builder/{name}.png')
    return f'client/assets/world_builder/{name}.png'

def create_ai_prompt(name, prompt):
    """Create AI prompt file"""
    with open(f'client/assets/world_builder/prompts/{name}.txt', 'w') as f:
        f.write(prompt)
    return f'client/assets/world_builder/prompts/{name}.txt'

# Define all assets with colors, sizes, and AI prompts
assets = {
    # Terrain
    'grass': {
        'color': (34, 139, 34, 255),
        'size': (32, 32),
        'prompt': 'Create a RuneScape-style grass tile, top-down view, 32x32 pixels. Bright green grass texture with individual grass blades visible. Pixel art style, clean edges, saturated colors typical of 2007 RuneScape. Seamless tileable texture.'
    },
    'dirt': {
        'color': (139, 69, 19, 255),
        'size': (32, 32),
        'prompt': 'Create a RuneScape-style dirt tile, top-down view, 32x32 pixels. Brown earth texture with small rocks and soil particles. Pixel art style, clean edges, seamless tileable. Classic RuneScape earth brown color.'
    },
    'stone': {
        'color': (105, 105, 105, 255),
        'size': (32, 32),
        'prompt': 'Create a RuneScape-style stone tile, top-down view, 32x32 pixels. Gray stone blocks with visible mortar lines. Medieval cobblestone texture, pixel art style, seamless tileable. Classic RuneScape stone gray.'
    },
    'water': {
        'color': (65, 105, 225, 255),
        'size': (32, 32),
        'prompt': 'Create a RuneScape-style water tile, top-down view, 32x32 pixels. Animated blue water with light reflections and gentle ripples. Bright blue color, pixel art style, seamless tileable. Classic RuneScape water animation frame.'
    },
    'sand': {
        'color': (244, 164, 96, 255),
        'size': (32, 32),
        'prompt': 'Create a RuneScape-style sand tile, top-down view, 32x32 pixels. Light brown sandy texture with small granules visible. Desert/beach sand appearance, pixel art style, seamless tileable. Warm sandy brown color.'
    },
    'mud': {
        'color': (101, 67, 33, 255),
        'size': (32, 32),
        'prompt': 'Create a RuneScape-style mud tile, top-down view, 32x32 pixels. Dark brown muddy texture with wet appearance and small puddles. Swampy mud texture, pixel art style, seamless tileable.'
    },
    'path': {
        'color': (160, 160, 160, 255),
        'size': (32, 32),
        'prompt': 'Create a RuneScape-style stone path tile, top-down view, 32x32 pixels. Light gray cobblestone path with worn stones and mortar. Medieval road texture, pixel art style, seamless tileable.'
    },
    'lava': {
        'color': (255, 69, 0, 255),
        'size': (32, 32),
        'prompt': 'Create a RuneScape-style lava tile, top-down view, 32x32 pixels. Bright orange-red molten lava with glowing effect and bubbling texture. Animated lava with bright highlights, pixel art style, seamless tileable.'
    },
    
    # Buildings
    'bank': {
        'color': (255, 215, 0, 255),
        'size': (96, 80),
        'prompt': 'Create a RuneScape-style bank building sprite, top-down isometric view, 96x80 pixels. Gray stone walls, red tile roof, large wooden doors, golden bank symbol. Medieval architecture, pixel art style, transparent background.'
    },
    'shop': {
        'color': (139, 69, 19, 255),
        'size': (80, 64),
        'prompt': 'Create a RuneScape-style general store building sprite, top-down isometric view, 80x64 pixels. Brown wooden walls, dark roof, display window, shop sign. Medieval shop architecture, pixel art style, transparent background.'
    },
    'house': {
        'color': (210, 180, 140, 255),
        'size': (64, 48),
        'prompt': 'Create a RuneScape-style house building sprite, top-down isometric view, 64x48 pixels. Tan stone/timber walls, red tile roof, wooden door, small windows. Medieval cottage, pixel art style, transparent background.'
    },
    'castle': {
        'color': (105, 105, 105, 255),
        'size': (128, 96),
        'prompt': 'Create a RuneScape-style castle building sprite, top-down isometric view, 128x96 pixels. Gray stone walls, battlements, towers, large gate, flags. Medieval fortress architecture, pixel art style, transparent background.'
    },
    'tower': {
        'color': (153, 50, 204, 255),
        'size': (48, 80),
        'prompt': 'Create a RuneScape-style wizard tower sprite, top-down isometric view, 48x80 pixels. Purple stone walls, conical roof, magical aura, mystical windows. Tall magical tower, pixel art style, transparent background.'
    },
    'well': {
        'color': (112, 128, 144, 255),
        'size': (32, 24),
        'prompt': 'Create a RuneScape-style town well sprite, top-down isometric view, 32x24 pixels. Stone circular base, wooden roof, rope and bucket, dark water center. Medieval well, pixel art style, transparent background.'
    },
    'fence': {
        'color': (139, 69, 19, 255),
        'size': (32, 16),
        'prompt': 'Create a RuneScape-style wooden fence sprite, top-down isometric view, 32x16 pixels. Brown wooden posts and rails, weathered wood texture. Medieval fence section, pixel art style, transparent background.'
    },
    'gate': {
        'color': (101, 67, 33, 255),
        'size': (48, 32),
        'prompt': 'Create a RuneScape-style wooden gate sprite, top-down isometric view, 48x32 pixels. Heavy wooden gate with iron hinges, medieval construction, closed position. Fortified entrance, pixel art style, transparent background.'
    },
    
    # Nature
    'tree_oak': {
        'color': (34, 139, 34, 255),
        'size': (48, 48),
        'prompt': 'Create a RuneScape-style oak tree sprite, top-down isometric view, 48x48 pixels. Large green canopy, brown trunk, full mature tree. Classic RuneScape tree design, pixel art style, transparent background.'
    },
    'tree_pine': {
        'color': (47, 79, 79, 255),
        'size': (48, 48),
        'prompt': 'Create a RuneScape-style pine tree sprite, top-down isometric view, 48x48 pixels. Dark green coniferous tree, triangular shape, brown trunk. Evergreen forest tree, pixel art style, transparent background.'
    },
    'tree_willow': {
        'color': (144, 238, 144, 255),
        'size': (48, 48),
        'prompt': 'Create a RuneScape-style willow tree sprite, top-down isometric view, 48x48 pixels. Light green drooping branches, graceful weeping willow shape. Riverside tree design, pixel art style, transparent background.'
    },
    'bush': {
        'color': (50, 205, 50, 255),
        'size': (24, 16),
        'prompt': 'Create a RuneScape-style bush sprite, top-down isometric view, 24x16 pixels. Small green shrub with dense foliage, rounded shape. Garden/forest undergrowth, pixel art style, transparent background.'
    },
    'flowers': {
        'color': (255, 105, 180, 255),
        'size': (16, 12),
        'prompt': 'Create a RuneScape-style flower patch sprite, top-down isometric view, 16x12 pixels. Colorful mixed flowers - red, pink, yellow blooms with green leaves. Garden flowers, pixel art style, transparent background.'
    },
    'mushroom': {
        'color': (255, 0, 0, 255),
        'size': (16, 20),
        'prompt': 'Create a RuneScape-style mushroom sprite, top-down isometric view, 16x20 pixels. Red cap with white spots, pale stem, classic toadstool design. Forest mushroom, pixel art style, transparent background.'
    },
    'crystal': {
        'color': (230, 230, 250, 255),
        'size': (24, 32),
        'prompt': 'Create a RuneScape-style crystal formation sprite, top-down isometric view, 24x32 pixels. Purple/blue glowing crystal cluster, faceted gems, magical glow effect. Mining crystal, pixel art style, transparent background.'
    },
    'rock': {
        'color': (105, 105, 105, 255),
        'size': (32, 24),
        'prompt': 'Create a RuneScape-style mining rock sprite, top-down isometric view, 32x24 pixels. Gray stone boulder with mining spots, ore veins visible. Mineable rock formation, pixel art style, transparent background.'
    },
    
    # Shops
    'general_store': {
        'color': (139, 69, 19, 255),
        'size': (80, 64),
        'prompt': 'Create a RuneScape-style general store building sprite, top-down isometric view, 80x64 pixels. Brown wooden walls, dark roof, display window, shop sign. Medieval shop architecture, pixel art style, transparent background.'
    },
    'magic_shop': {
        'color': (153, 50, 204, 255),
        'size': (72, 64),
        'prompt': 'Create a RuneScape-style magic shop building sprite, top-down isometric view, 72x64 pixels. Purple stone walls with magical runes, conical roof, glowing crystal orb above entrance. Mystical shop, pixel art style, transparent background.'
    },
    'weapon_shop': {
        'color': (205, 133, 63, 255),
        'size': (76, 60),
        'prompt': 'Create a RuneScape-style weapon shop building sprite, top-down isometric view, 76x60 pixels. Stone and wood construction, weapon displays in windows, anvil outside, crossed swords sign. Armorer shop, pixel art style, transparent background.'
    },
    'armor_shop': {
        'color': (160, 160, 160, 255),
        'size': (76, 60),
        'prompt': 'Create a RuneScape-style armor shop building sprite, top-down isometric view, 76x60 pixels. Stone building with metal reinforcements, armor displays, shield and helmet sign. Medieval armorer, pixel art style, transparent background.'
    },
    'food_shop': {
        'color': (255, 182, 193, 255),
        'size': (64, 48),
        'prompt': 'Create a RuneScape-style food shop building sprite, top-down isometric view, 64x48 pixels. Cozy bakery with chimney smoke, bread displays in window, wheat decorations. Medieval bakery, pixel art style, transparent background.'
    },
    'rune_shop': {
        'color': (65, 105, 225, 255),
        'size': (68, 56),
        'prompt': 'Create a RuneScape-style rune shop building sprite, top-down isometric view, 68x56 pixels. Blue stone walls with mystical runes carved in, glowing magical energy, rune symbols above door. Magic rune store, pixel art style, transparent background.'
    },
    'archery_shop': {
        'color': (34, 139, 34, 255),
        'size': (70, 52),
        'prompt': 'Create a RuneScape-style archery shop building sprite, top-down isometric view, 70x52 pixels. Green wooden building with bow and arrow sign, target practice area, quiver decorations. Fletcher shop, pixel art style, transparent background.'
    },
    
    # Buildings
    'house_small': {
        'color': (210, 180, 140, 255),
        'size': (48, 36),
        'prompt': 'Create a RuneScape-style small house sprite, top-down isometric view, 48x36 pixels. Simple cottage with tan walls, red tile roof, wooden door, small window. Residential home, pixel art style, transparent background.'
    },
    'house_large': {
        'color': (205, 133, 63, 255),
        'size': (80, 60),
        'prompt': 'Create a RuneScape-style large house sprite, top-down isometric view, 80x60 pixels. Two-story manor with multiple rooms, dormer windows, chimney, grand entrance. Wealthy residence, pixel art style, transparent background.'
    },
    'tower_wizard': {
        'color': (153, 50, 204, 255),
        'size': (56, 96),
        'prompt': 'Create a RuneScape-style wizard tower sprite, top-down isometric view, 56x96 pixels. Tall purple stone tower with conical roof, multiple floors, magical windows, floating orbs around it. Mystical mage tower, pixel art style, transparent background.'
    },
    'church': {
        'color': (245, 222, 179, 255),
        'size': (96, 80),
        'prompt': 'Create a RuneScape-style church building sprite, top-down isometric view, 96x80 pixels. Stone church with bell tower, stained glass windows, cross on top, arched doorway. Medieval cathedral, pixel art style, transparent background.'
    },
    'inn': {
        'color': (139, 69, 19, 255),
        'size': (88, 64),
        'prompt': 'Create a RuneScape-style inn building sprite, top-down isometric view, 88x64 pixels. Wooden tavern with multiple chimneys, hanging inn sign, warm lights in windows. Medieval tavern/inn, pixel art style, transparent background.'
    },
    'windmill': {
        'color': (244, 164, 96, 255),
        'size': (64, 80),
        'prompt': 'Create a RuneScape-style windmill sprite, top-down isometric view, 64x80 pixels. Stone base with wooden windmill blades, grain storage, countryside windmill design. Agricultural building, pixel art style, transparent background.'
    },
    'lighthouse': {
        'color': (255, 255, 255, 255),
        'size': (40, 96),
        'prompt': 'Create a RuneScape-style lighthouse sprite, top-down isometric view, 40x96 pixels. Tall white stone tower with light beacon at top, spiral windows, coastal lighthouse design. Maritime structure, pixel art style, transparent background.'
    },
    'cobblestone': {
        'color': (160, 160, 160, 255),
        'size': (32, 32),
        'prompt': 'Create a RuneScape-style cobblestone tile, top-down view, 32x32 pixels. Gray stone cobbles with darker mortar lines, medieval street texture. City road surface, pixel art style, seamless tileable.'
    },
    'snow': {
        'color': (255, 250, 250, 255),
        'size': (32, 32),
        'prompt': 'Create a RuneScape-style snow tile, top-down view, 32x32 pixels. Pure white snow with subtle blue shadows, winter terrain texture. Cold climate ground, pixel art style, seamless tileable.'
    },
    
    # Enhanced Mining Rocks
    'rock_mithril': {
        'color': (65, 105, 225, 255),
        'size': (40, 32),
        'prompt': 'Create a RuneScape-style mithril rock sprite, top-down isometric view, 40x32 pixels. Blue-tinted stone with visible mithril ore veins, sparkling metallic deposits. High-level mining rock, pixel art style, transparent background.'
    },
    'rock_adamant': {
        'color': (144, 238, 144, 255),
        'size': (44, 36),
        'prompt': 'Create a RuneScape-style adamant rock sprite, top-down isometric view, 44x36 pixels. Green-tinted stone with adamant ore veins, rare metal deposits. Premium mining rock, pixel art style, transparent background.'
    },
    'rock_rune': {
        'color': (64, 224, 208, 255),
        'size': (48, 40),
        'prompt': 'Create a RuneScape-style runite rock sprite, top-down isometric view, 48x40 pixels. Cyan-tinted stone with magical runite ore, glowing runes carved in surface. Highest level mining rock, pixel art style, transparent background.'
    },
    
    # Enhanced Trees
    'tree_normal': {
        'color': (34, 139, 34, 255),
        'size': (40, 40),
        'prompt': 'Create a RuneScape-style normal tree sprite, top-down isometric view, 40x40 pixels. Basic green tree with brown trunk, simple canopy. Starting level woodcutting tree, pixel art style, transparent background.'
    },
    'tree_yew': {
        'color': (47, 79, 79, 255),
        'size': (56, 56),
        'prompt': 'Create a RuneScape-style yew tree sprite, top-down isometric view, 56x56 pixels. Dark green ancient tree with thick trunk, mystical appearance. High-level woodcutting tree, pixel art style, transparent background.'
    },
    'tree_magic': {
        'color': (153, 50, 204, 255),
        'size': (64, 64),
        'prompt': 'Create a RuneScape-style magic tree sprite, top-down isometric view, 64x64 pixels. Purple magical tree with glowing leaves, sparkles around it, ethereal appearance. Highest level woodcutting tree, pixel art style, transparent background.'
    },
    'tree_palm': {
        'color': (50, 205, 50, 255),
        'size': (48, 64),
        'prompt': 'Create a RuneScape-style palm tree sprite, top-down isometric view, 48x64 pixels. Tropical palm with coconuts, curved trunk, island tree design. Desert/tropical tree, pixel art style, transparent background.'
    },
    'tree_dead': {
        'color': (105, 105, 105, 255),
        'size': (40, 48),
        'prompt': 'Create a RuneScape-style dead tree sprite, top-down isometric view, 40x48 pixels. Bare branches, gray/brown bark, lifeless appearance. Wilderness/haunted tree, pixel art style, transparent background.'
    },
    
    # Skills and Objects
    'fishing_spot': {
        'color': (65, 105, 225, 255),
        'size': (32, 24),
        'prompt': 'Create a RuneScape-style fishing spot sprite, top-down isometric view, 32x24 pixels. Rippling water with fish visible beneath surface, fishing spot indicator. Skill location marker, pixel art style, transparent background.'
    },
    'spinning_wheel': {
        'color': (222, 184, 135, 255),
        'size': (32, 32),
        'prompt': 'Create a RuneScape-style spinning wheel sprite, top-down isometric view, 32x32 pixels. Wooden spinning wheel with spindle and fiber, crafting tool. Crafting skill object, pixel art style, transparent background.'
    },
    'pottery_wheel': {
        'color': (205, 133, 63, 255),
        'size': (32, 24),
        'prompt': 'Create a RuneScape-style pottery wheel sprite, top-down isometric view, 32x24 pixels. Clay pottery wheel with clay pot being shaped, crafting station. Crafting skill object, pixel art style, transparent background.'
    },
    'loom': {
        'color': (139, 69, 19, 255),
        'size': (48, 32),
        'prompt': 'Create a RuneScape-style loom sprite, top-down isometric view, 48x32 pixels. Wooden weaving loom with fabric in progress, textile crafting station. Crafting skill object, pixel art style, transparent background.'
    },
    'cooking_range': {
        'color': (255, 99, 71, 255),
        'size': (40, 32),
        'prompt': 'Create a RuneScape-style cooking range sprite, top-down isometric view, 40x32 pixels. Stone cooking stove with fire inside, pot on top, kitchen appliance. Cooking skill object, pixel art style, transparent background.'
    },
    'fence_wood': {
        'color': (139, 69, 19, 255),
        'size': (32, 16),
        'prompt': 'Create a RuneScape-style wooden fence sprite, top-down isometric view, 32x16 pixels. Brown wooden fence posts and rails, weathered wood texture. Property boundary, pixel art style, transparent background.'
    },
    'fence_stone': {
        'color': (105, 105, 105, 255),
        'size': (32, 20),
        'prompt': 'Create a RuneScape-style stone fence sprite, top-down isometric view, 32x20 pixels. Gray stone wall with mortar, solid boundary fence. Defensive barrier, pixel art style, transparent background.'
    },
    'gate_wood': {
        'color': (101, 67, 33, 255),
        'size': (40, 24),
        'prompt': 'Create a RuneScape-style wooden gate sprite, top-down isometric view, 40x24 pixels. Heavy wooden gate with iron hinges, rustic design. Entrance barrier, pixel art style, transparent background.'
    },
    'gate_metal': {
        'color': (160, 160, 160, 255),
        'size': (40, 28),
        'prompt': 'Create a RuneScape-style metal gate sprite, top-down isometric view, 40x28 pixels. Iron gate with decorative metalwork, sturdy construction. Security entrance, pixel art style, transparent background.'
    },
    
    # Objects
    'altar': {
        'color': (153, 50, 204, 255),
        'size': (48, 32),
        'prompt': 'Create a RuneScape-style prayer altar sprite, top-down isometric view, 48x32 pixels. Stone altar with religious symbols, candles, holy aura. Medieval prayer altar, pixel art style, transparent background.'
    },
    'anvil': {
        'color': (47, 47, 47, 255),
        'size': (32, 24),
        'prompt': 'Create a RuneScape-style anvil sprite, top-down isometric view, 32x24 pixels. Black iron anvil with horn and face, heavy blacksmith tool. Smithing anvil, pixel art style, transparent background.'
    },
    'furnace': {
        'color': (255, 69, 0, 255),
        'size': (48, 40),
        'prompt': 'Create a RuneScape-style furnace sprite, top-down isometric view, 48x40 pixels. Stone furnace with glowing fire inside, chimney, hot coals. Smelting furnace, pixel art style, transparent background.'
    },
    'chest': {
        'color': (139, 69, 19, 255),
        'size': (32, 24),
        'prompt': 'Create a RuneScape-style treasure chest sprite, top-down isometric view, 32x24 pixels. Wooden chest with iron bands, lock, closed lid. Treasure storage chest, pixel art style, transparent background.'
    },
    'statue': {
        'color': (211, 211, 211, 255),
        'size': (32, 48),
        'prompt': 'Create a RuneScape-style statue sprite, top-down isometric view, 32x48 pixels. Stone statue of warrior/hero figure, weathered appearance, pedestal base. Decorative monument, pixel art style, transparent background.'
    },
    'bridge': {
        'color': (139, 69, 19, 255),
        'size': (64, 16),
        'prompt': 'Create a RuneScape-style wooden bridge sprite, top-down isometric view, 64x16 pixels. Wooden planks with support beams, crosses water/gaps. Medieval bridge section, pixel art style, transparent background.'
    },
    'portal': {
        'color': (153, 50, 204, 255),
        'size': (40, 48),
        'prompt': 'Create a RuneScape-style magical portal sprite, top-down isometric view, 40x48 pixels. Swirling purple energy, stone archway, magical runes, teleportation gateway. Mystical portal, pixel art style, transparent background.'
    },
    'spawn': {
        'color': (255, 215, 0, 255),
        'size': (32, 32),
        'prompt': 'Create a RuneScape-style spawn point sprite, top-down isometric view, 32x32 pixels. Golden glowing marker with star/cross symbol, bright aura. Player spawn location indicator, pixel art style, transparent background.'
    }
}

def generate_all_assets():
    print("Generating World Builder assets...")
    
    created_images = []
    created_prompts = []
    
    for name, config in assets.items():
        # Create placeholder image
        img_path = create_placeholder_image(name, config['size'], config['color'])
        created_images.append(img_path)
        
        # Create AI prompt file
        prompt_path = create_ai_prompt(name, config['prompt'])
        created_prompts.append(prompt_path)
        
        print(f"Created: {name}.png ({config['size'][0]}x{config['size'][1]}) + prompt")
    
    print(f"\nGenerated {len(created_images)} placeholder images")
    print(f"Generated {len(created_prompts)} AI prompt files")
    print("\nTo replace with high-quality images:")
    print("1. Use the AI prompts in the 'prompts' folder")
    print("2. Generate images with your preferred AI tool")
    print("3. Replace the placeholder images in 'client/assets/world_builder/'")
    print("4. Maintain the exact same filenames and dimensions")
    
    # Create index file
    with open('client/assets/world_builder/README.txt', 'w') as f:
        f.write("RuneScape World Builder Assets\n")
        f.write("==============================\n\n")
        f.write("This folder contains placeholder images and AI prompts for the world builder.\n\n")
        f.write("To create high-quality assets:\n")
        f.write("1. Check the 'prompts' folder for AI generation prompts\n")
        f.write("2. Use your preferred AI image generator (DALL-E, Midjourney, etc.)\n")
        f.write("3. Replace the placeholder PNG files with your generated images\n")
        f.write("4. Keep the same filenames and dimensions\n\n")
        f.write("Image List:\n")
        for name, config in assets.items():
            f.write(f"- {name}.png ({config['size'][0]}x{config['size'][1]})\n")

if __name__ == "__main__":
    generate_all_assets()