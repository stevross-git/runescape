from PIL import Image, ImageDraw
import random
import math
import os

# Create assets directories if they don't exist
os.makedirs('client/assets/resources', exist_ok=True)

def add_noise(img, variation=10):
    """Add subtle noise to make textures less uniform"""
    pixels = img.load()
    width, height = img.size
    for x in range(width):
        for y in range(height):
            if pixels[x, y][3] > 0:  # Only add noise to non-transparent pixels
                r, g, b, a = pixels[x, y]
                # Add random variation
                r = max(0, min(255, r + random.randint(-variation, variation)))
                g = max(0, min(255, g + random.randint(-variation, variation)))
                b = max(0, min(255, b + random.randint(-variation, variation)))
                pixels[x, y] = (r, g, b, a)
    return img

def create_tree_sprite(name, trunk_color, leaf_color, leaf_style='round'):
    """Create a detailed 48x48 tree sprite"""
    img = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw trunk (bottom center)
    trunk_width = 8
    trunk_height = 20
    trunk_x = 24 - trunk_width // 2
    trunk_y = 48 - trunk_height
    
    # Trunk with slight taper
    for i in range(trunk_height):
        width = trunk_width - (i // 8)  # Slight taper
        x_offset = (trunk_width - width) // 2
        draw.rectangle([
            trunk_x + x_offset, 
            trunk_y + i,
            trunk_x + x_offset + width - 1, 
            trunk_y + i
        ], fill=(*trunk_color, 255))
    
    # Add trunk texture
    for i in range(trunk_height):
        if random.random() > 0.7:
            y = trunk_y + i
            draw.point((trunk_x + random.randint(0, trunk_width-1), y), 
                      fill=(trunk_color[0] - 20, trunk_color[1] - 20, trunk_color[2] - 20, 255))
    
    # Draw canopy based on style
    if leaf_style == 'round':
        # Round canopy (oak, maple)
        canopy_radius = 18
        canopy_center_x = 24
        canopy_center_y = 20
        
        # Base canopy circle
        draw.ellipse([
            canopy_center_x - canopy_radius,
            canopy_center_y - canopy_radius,
            canopy_center_x + canopy_radius,
            canopy_center_y + canopy_radius
        ], fill=(*leaf_color, 255))
        
        # Add smaller overlapping circles for natural look
        for _ in range(8):
            offset_x = random.randint(-8, 8)
            offset_y = random.randint(-8, 8)
            small_radius = random.randint(8, 12)
            variation = random.randint(-15, 15)
            color = (
                max(0, min(255, leaf_color[0] + variation)),
                max(0, min(255, leaf_color[1] + variation)),
                max(0, min(255, leaf_color[2] + variation))
            )
            draw.ellipse([
                canopy_center_x + offset_x - small_radius,
                canopy_center_y + offset_y - small_radius,
                canopy_center_x + offset_x + small_radius,
                canopy_center_y + offset_y + small_radius
            ], fill=(*color, 200))
    
    elif leaf_style == 'droopy':
        # Droopy willow style
        canopy_center_x = 24
        canopy_center_y = 18
        
        # Main canopy
        draw.ellipse([
            canopy_center_x - 16,
            canopy_center_y - 12,
            canopy_center_x + 16,
            canopy_center_y + 16
        ], fill=(*leaf_color, 255))
        
        # Drooping branches
        for i in range(6):
            branch_x = canopy_center_x + random.randint(-12, 12)
            branch_start_y = canopy_center_y + 8
            branch_length = random.randint(8, 15)
            
            for j in range(branch_length):
                y = branch_start_y + j
                if y < 48:
                    variation = random.randint(-10, 10)
                    color = (
                        max(0, min(255, leaf_color[0] + variation)),
                        max(0, min(255, leaf_color[1] + variation)),
                        max(0, min(255, leaf_color[2] + variation))
                    )
                    draw.point((branch_x + random.randint(-1, 1), y), fill=(*color, 200))
    
    elif leaf_style == 'conifer':
        # Coniferous tree (yew)
        base_width = 6
        for level in range(6):
            y_pos = 35 - level * 5
            width = base_width + level * 3
            
            # Draw triangular section
            for i in range(width):
                x_start = 24 - width // 2 + i
                height = min(5, width - abs(i - width // 2))
                
                for j in range(height):
                    y = y_pos - j
                    if y >= 0:
                        variation = random.randint(-10, 10)
                        color = (
                            max(0, min(255, leaf_color[0] + variation)),
                            max(0, min(255, leaf_color[1] + variation)),
                            max(0, min(255, leaf_color[2] + variation))
                        )
                        draw.point((x_start, y), fill=(*color, 255))
    
    # Add some highlights and shadows for depth
    for _ in range(20):
        x = random.randint(5, 42)
        y = random.randint(5, 35)
        if img.getpixel((x, y))[3] > 0:  # Only on existing pixels
            # Add highlight
            draw.point((x, y), fill=(255, 255, 255, 100))
    
    for _ in range(15):
        x = random.randint(5, 42)
        y = random.randint(5, 35)
        if img.getpixel((x, y))[3] > 0:  # Only on existing pixels
            # Add shadow
            draw.point((x, y), fill=(0, 0, 0, 80))
    
    img = add_noise(img, 5)
    img.save(f'client/assets/resources/tree_{name}.png')
    print(f"Created tree_{name}.png (48x48)")

def create_stump():
    """Create a tree stump sprite"""
    img = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Main stump circle
    stump_radius = 12
    center_x, center_y = 24, 35
    
    # Base stump
    draw.ellipse([
        center_x - stump_radius,
        center_y - stump_radius,
        center_x + stump_radius,
        center_y + stump_radius
    ], fill=(101, 67, 33, 255))
    
    # Tree rings
    for ring in range(3):
        radius = stump_radius - ring * 3
        if radius > 2:
            draw.ellipse([
                center_x - radius,
                center_y - radius,
                center_x + radius,
                center_y + radius
            ], outline=(80, 50, 25, 200), width=1)
    
    # Add texture and cracks
    for _ in range(30):
        angle = random.random() * 6.28
        distance = random.random() * stump_radius
        x = int(center_x + distance * math.cos(angle))
        y = int(center_y + distance * math.sin(angle))
        if 0 <= x < 48 and 0 <= y < 48:
            variation = random.randint(-20, 20)
            color = (101 + variation, 67 + variation, 33 + variation)
            color = tuple(max(0, min(255, c)) for c in color)
            draw.point((x, y), fill=(*color, 255))
    
    # Central crack
    draw.line([
        (center_x - 2, center_y - 8),
        (center_x + 3, center_y + 6)
    ], fill=(60, 40, 20, 255), width=2)
    
    img = add_noise(img, 8)
    img.save('client/assets/resources/stump.png')
    print("Created stump.png (48x48)")

# Generate bigger tree sprites
print("Generating bigger tree sprites (48x48)...")

# Oak tree - round, medium green
create_tree_sprite('oak', (101, 67, 33), (34, 139, 34), 'round')

# Willow tree - droopy, light green  
create_tree_sprite('willow', (139, 90, 43), (144, 238, 144), 'droopy')

# Maple tree - round, orange-red
create_tree_sprite('maple', (101, 67, 33), (178, 34, 34), 'round')

# Yew tree - coniferous, dark green
create_tree_sprite('yew', (85, 60, 42), (0, 100, 0), 'conifer')

# Tree stump
create_stump()

print("\nAll bigger tree sprites generated successfully!")
print("Trees are now 48x48 pixels (50% larger than player)")