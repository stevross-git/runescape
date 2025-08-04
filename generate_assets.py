#!/usr/bin/env python3
"""
Generate pixel art assets for RuneScape clone
Creates simple 32x32 pixel art images in RuneScape style
"""

from PIL import Image, ImageDraw
import os

def create_directories():
    """Create asset directories if they don't exist"""
    dirs = [
        'client/assets/tiles',
        'client/assets/resources', 
        'client/assets/npcs',
        'client/assets/player',
        'client/assets/ui',
        'client/assets/items',
        'client/assets/effects'
    ]
    
    for dir_path in dirs:
        os.makedirs(dir_path, exist_ok=True)
        print(f"Created directory: {dir_path}")

def create_tile_image(name, base_color, accent_color=None, pattern='solid'):
    """Create a 32x32 tile image"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    if pattern == 'solid':
        draw.rectangle([0, 0, 31, 31], fill=base_color)
    elif pattern == 'checkered':
        # Create checkered pattern
        for x in range(0, 32, 4):
            for y in range(0, 32, 4):
                color = base_color if (x//4 + y//4) % 2 == 0 else accent_color
                draw.rectangle([x, y, x+3, y+3], fill=color)
    elif pattern == 'textured':
        # Create simple texture
        draw.rectangle([0, 0, 31, 31], fill=base_color)
        if accent_color:
            # Add random dots for texture
            import random
            random.seed(42)  # Consistent randomness
            for _ in range(20):
                x, y = random.randint(0, 31), random.randint(0, 31)
                draw.point((x, y), fill=accent_color)
    
    # Add border
    draw.rectangle([0, 0, 31, 31], outline=(0, 0, 0, 100), width=1)
    
    img.save(f'client/assets/tiles/{name}.png')
    print(f"Created tile: {name}.png")

def create_resource_image(name, main_color, accent_color=None, shape='tree'):
    """Create resource images"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    if shape == 'tree':
        # Draw tree trunk
        draw.rectangle([14, 20, 17, 31], fill=(101, 67, 33))  # Brown trunk
        # Draw tree canopy
        draw.ellipse([8, 8, 23, 23], fill=main_color)
        draw.ellipse([10, 10, 21, 21], fill=accent_color or main_color)
    elif shape == 'rock':
        # Draw rock shape
        points = [(16, 8), (24, 12), (28, 20), (24, 28), (8, 28), (4, 20), (8, 12)]
        draw.polygon(points, fill=main_color)
        # Add highlight
        highlight_points = [(16, 8), (20, 10), (22, 14), (18, 16), (12, 14)]
        draw.polygon(highlight_points, fill=accent_color or main_color)
    elif shape == 'stump':
        # Draw tree stump
        draw.ellipse([10, 24, 21, 31], fill=(101, 67, 33))
        draw.rectangle([12, 20, 19, 28], fill=(139, 69, 19))
        # Add rings
        draw.ellipse([13, 21, 18, 26], outline=(101, 67, 33), width=1)
    
    img.save(f'client/assets/resources/{name}.png')
    print(f"Created resource: {name}.png")

def create_npc_image(name, body_color, accent_color=None):
    """Create simple NPC sprites"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Body
    draw.ellipse([12, 18, 19, 28], fill=body_color)
    # Head
    draw.ellipse([13, 8, 18, 16], fill=accent_color or body_color)
    # Eyes
    draw.point((14, 11), fill=(0, 0, 0))
    draw.point((17, 11), fill=(0, 0, 0))
    # Simple limbs
    draw.rectangle([10, 22, 12, 26], fill=body_color)  # Left arm
    draw.rectangle([19, 22, 21, 26], fill=body_color)  # Right arm
    draw.rectangle([13, 26, 15, 30], fill=(101, 67, 33))  # Left leg
    draw.rectangle([16, 26, 18, 30], fill=(101, 67, 33))  # Right leg
    
    img.save(f'client/assets/npcs/{name}.png')
    print(f"Created NPC: {name}.png")

def create_player_image(name, shirt_color, pants_color):
    """Create player sprite"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Head
    draw.ellipse([13, 6, 18, 14], fill=(255, 220, 177))  # Skin tone
    # Body/shirt
    draw.rectangle([12, 14, 19, 22], fill=shirt_color)
    # Pants
    draw.rectangle([12, 22, 19, 28], fill=pants_color)
    # Arms
    draw.rectangle([10, 16, 12, 20], fill=(255, 220, 177))  # Left arm
    draw.rectangle([19, 16, 21, 20], fill=(255, 220, 177))  # Right arm
    # Legs
    draw.rectangle([13, 28, 15, 32], fill=pants_color)  # Left leg
    draw.rectangle([16, 28, 18, 32], fill=pants_color)  # Right leg
    # Eyes
    draw.point((14, 9), fill=(0, 0, 0))
    draw.point((17, 9), fill=(0, 0, 0))
    # Hair
    draw.rectangle([13, 6, 18, 8], fill=(139, 69, 19))
    
    img.save(f'client/assets/player/{name}.png')
    print(f"Created player: {name}.png")

def create_item_image(name, main_color, accent_color=None, item_type='generic'):
    """Create item images"""
    img = Image.new('RGBA', (16, 16), (0, 0, 0, 0))  # Items are smaller
    draw = ImageDraw.Draw(img)
    
    if item_type == 'sword':
        # Draw sword blade
        draw.rectangle([7, 2, 8, 12], fill=main_color)
        # Draw hilt
        draw.rectangle([6, 10, 9, 12], fill=accent_color or (139, 69, 19))
        # Draw handle
        draw.rectangle([7, 12, 8, 14], fill=(101, 67, 33))
    elif item_type == 'axe':
        # Draw handle
        draw.rectangle([7, 6, 8, 14], fill=(101, 67, 33))
        # Draw axe head
        draw.polygon([(6, 6), (9, 6), (9, 8), (6, 8)], fill=main_color)
        draw.polygon([(5, 7), (6, 6), (6, 8), (5, 9)], fill=main_color)
    elif item_type == 'bread':
        # Draw bread loaf
        draw.ellipse([4, 6, 11, 10], fill=main_color)
        draw.ellipse([5, 7, 10, 9], fill=accent_color or main_color)
    elif item_type == 'coins':
        # Draw coin stack
        draw.ellipse([6, 8, 9, 11], fill=main_color)
        draw.ellipse([6, 7, 9, 10], fill=main_color)
        draw.ellipse([6, 6, 9, 9], fill=main_color)
    else:
        # Generic rectangle
        draw.rectangle([4, 4, 11, 11], fill=main_color)
        if accent_color:
            draw.rectangle([5, 5, 10, 10], fill=accent_color)
    
    img.save(f'client/assets/items/{name}.png')
    print(f"Created item: {name}.png")

def main():
    """Generate all asset images"""
    print("Generating RuneScape-style pixel art assets...")
    
    create_directories()
    
    # Create tile images
    create_tile_image('grass', (34, 139, 34), (60, 179, 113), 'textured')
    create_tile_image('dirt', (139, 69, 19), (160, 82, 45), 'textured')
    create_tile_image('stone', (105, 105, 105), (128, 128, 128), 'textured')
    create_tile_image('water', (65, 105, 225), (100, 149, 237), 'textured')
    
    # Create resource images
    create_resource_image('tree_oak', (34, 139, 34), (60, 179, 113), 'tree')
    create_resource_image('tree_willow', (144, 238, 144), (152, 251, 152), 'tree')
    create_resource_image('tree_maple', (255, 99, 71), (255, 127, 80), 'tree')
    create_resource_image('tree_yew', (47, 79, 79), (60, 90, 90), 'tree')
    create_resource_image('stump', (139, 69, 19), (160, 82, 45), 'stump')
    
    create_resource_image('rock_copper', (205, 133, 63), (222, 184, 135), 'rock')
    create_resource_image('rock_tin', (192, 192, 192), (211, 211, 211), 'rock')
    create_resource_image('rock_iron', (169, 169, 169), (190, 190, 190), 'rock')
    create_resource_image('rock_coal', (47, 47, 47), (64, 64, 64), 'rock')
    create_resource_image('rock_gold', (255, 215, 0), (255, 255, 224), 'rock')
    create_resource_image('rock_depleted', (105, 105, 105), (128, 128, 128), 'rock')
    
    # Create NPC images
    create_npc_image('goblin', (139, 0, 0), (255, 140, 140))
    create_npc_image('shopkeeper', (75, 0, 130), (138, 43, 226))
    create_npc_image('banker', (0, 0, 139), (65, 105, 225))
    create_npc_image('quest_giver', (139, 69, 19), (205, 133, 63))
    
    # Create player images
    create_player_image('male', (0, 100, 200), (25, 25, 112))
    create_player_image('female', (200, 0, 100), (139, 0, 139))
    
    # Create item images
    create_item_image('sword', (192, 192, 192), (139, 69, 19), 'sword')
    create_item_image('axe', (169, 169, 169), None, 'axe')
    create_item_image('pickaxe', (160, 160, 160), None, 'axe')
    create_item_image('bread', (222, 184, 135), (245, 222, 179), 'bread')
    create_item_image('coins', (255, 215, 0), None, 'coins')
    
    # Create effect images
    fire_img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    fire_draw = ImageDraw.Draw(fire_img)
    # Draw fire
    fire_draw.ellipse([12, 20, 19, 30], fill=(255, 69, 0))
    fire_draw.ellipse([13, 16, 18, 24], fill=(255, 140, 0))
    fire_draw.ellipse([14, 12, 17, 18], fill=(255, 255, 0))
    fire_img.save('client/assets/effects/fire.png')
    print("Created effect: fire.png")
    
    print(f"\nSuccessfully generated all asset images!")
    print("Assets are now ready for use in the RuneScape clone.")

if __name__ == "__main__":
    main()