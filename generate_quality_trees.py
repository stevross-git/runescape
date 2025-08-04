from PIL import Image, ImageDraw
import random
import math
import os

# Create assets directories if they don't exist
os.makedirs('client/assets/resources', exist_ok=True)

def create_high_quality_tree(name, trunk_color, leaf_color, style='oak'):
    """Create a high-quality 48x48 tree sprite"""
    img = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    if style == 'oak':
        # Oak tree - classic RuneScape style
        # Trunk
        trunk_points = [
            (20, 48), (28, 48),  # Base
            (22, 30), (26, 30)   # Top
        ]
        draw.polygon(trunk_points, fill=trunk_color)
        
        # Main canopy circle
        draw.ellipse([8, 8, 40, 40], fill=leaf_color)
        
        # Smaller overlapping circles for natural look
        draw.ellipse([12, 12, 36, 36], fill=(leaf_color[0] + 10, leaf_color[1] + 10, leaf_color[2] + 10))
        draw.ellipse([6, 14, 26, 34], fill=(leaf_color[0] - 5, leaf_color[1] - 5, leaf_color[2] - 5))
        draw.ellipse([22, 14, 42, 34], fill=(leaf_color[0] - 5, leaf_color[1] - 5, leaf_color[2] - 5))
        draw.ellipse([14, 6, 34, 26], fill=(leaf_color[0] - 8, leaf_color[1] - 8, leaf_color[2] - 8))
        
        # Trunk texture
        draw.line([(21, 30), (21, 48)], fill=(trunk_color[0] - 20, trunk_color[1] - 20, trunk_color[2] - 20), width=1)
        draw.line([(27, 30), (27, 48)], fill=(trunk_color[0] - 20, trunk_color[1] - 20, trunk_color[2] - 20), width=1)
        
    elif style == 'willow':
        # Willow tree - drooping branches
        # Trunk
        draw.rectangle([22, 25, 26, 48], fill=trunk_color)
        
        # Main canopy (smaller and higher)
        draw.ellipse([12, 5, 36, 25], fill=leaf_color)
        
        # Drooping branches
        for i in range(8):
            start_x = 14 + i * 3
            start_y = 20
            end_x = start_x + random.randint(-2, 2)
            end_y = start_y + random.randint(10, 18)
            
            # Create curved drooping effect
            for j in range(int(end_y - start_y)):
                curve_x = start_x + int(math.sin(j * 0.3) * 2)
                branch_y = start_y + j
                if branch_y < 48:
                    draw.point((curve_x, branch_y), fill=(leaf_color[0] - 10, leaf_color[1] - 10, leaf_color[2] - 10))
                    # Add leaves along branches
                    if j % 3 == 0:
                        draw.ellipse([curve_x - 1, branch_y - 1, curve_x + 1, branch_y + 1], fill=leaf_color)
    
    elif style == 'maple':
        # Maple tree - fuller, rounded canopy
        # Trunk
        draw.polygon([(19, 48), (29, 48), (25, 30), (23, 30)], fill=trunk_color)
        
        # Large main canopy
        draw.ellipse([4, 6, 44, 38], fill=leaf_color)
        
        # Multiple overlapping sections for maple fullness
        draw.ellipse([8, 10, 32, 34], fill=(leaf_color[0] + 15, leaf_color[1] + 5, leaf_color[2] + 5))
        draw.ellipse([16, 10, 40, 34], fill=(leaf_color[0] + 15, leaf_color[1] + 5, leaf_color[2] + 5))
        draw.ellipse([12, 4, 36, 28], fill=(leaf_color[0] + 20, leaf_color[1] + 10, leaf_color[2] + 10))
        
        # Add some texture spots
        for _ in range(10):
            x = random.randint(8, 40)
            y = random.randint(8, 32)
            if 8 <= x <= 40 and 8 <= y <= 32:
                draw.ellipse([x-1, y-1, x+1, y+1], fill=(leaf_color[0] + 30, leaf_color[1] + 15, leaf_color[2] + 15))
    
    elif style == 'yew':
        # Yew tree - coniferous, dark and dense
        # Trunk
        draw.rectangle([22, 30, 26, 48], fill=trunk_color)
        
        # Coniferous layers from bottom to top
        layers = [
            (18, 28, 30, 35),  # Bottom layer
            (16, 22, 32, 30),  # Middle layer
            (14, 16, 34, 25),  # Top layer
            (20, 10, 28, 18),  # Peak
        ]
        
        for layer in layers:
            x1, y1, x2, y2 = layer
            # Draw triangular/elliptical sections
            draw.ellipse([x1, y1, x2, y2], fill=leaf_color)
            # Add darker inner sections
            draw.ellipse([x1+2, y1+1, x2-2, y2-1], fill=(leaf_color[0] - 15, leaf_color[1] - 15, leaf_color[2] - 15))
    
    # Add highlights and shadows for depth
    # Highlights (lighter spots)
    for _ in range(5):
        x = random.randint(5, 42)
        y = random.randint(5, 35)
        if img.getpixel((x, y))[3] > 200:  # Only on solid pixels
            draw.point((x, y), fill=(255, 255, 255, 100))
    
    # Shadows (darker spots)
    for _ in range(8):
        x = random.randint(5, 42)
        y = random.randint(5, 35)
        if img.getpixel((x, y))[3] > 200:  # Only on solid pixels
            current = img.getpixel((x, y))
            darker = (max(0, current[0] - 30), max(0, current[1] - 30), max(0, current[2] - 30), current[3])
            draw.point((x, y), fill=darker)
    
    return img

def create_detailed_stump():
    """Create a detailed tree stump"""
    img = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Main stump oval
    draw.ellipse([16, 32, 32, 46], fill=(101, 67, 33))
    
    # Top surface (cut)
    draw.ellipse([16, 30, 32, 38], fill=(120, 80, 40))
    
    # Tree rings on top
    draw.ellipse([18, 31, 30, 37], outline=(90, 60, 30), width=1)
    draw.ellipse([20, 32, 28, 36], outline=(80, 50, 25), width=1)
    draw.ellipse([22, 33, 26, 35], outline=(70, 45, 20), width=1)
    
    # Side texture
    for i in range(15):
        y = 32 + i
        if y < 46:
            variation = random.randint(-10, 10)
            color = (101 + variation, 67 + variation, 33 + variation)
            draw.line([(16, y), (32, y)], fill=color)
    
    # Crack in the side
    draw.line([(20, 35), (22, 45)], fill=(60, 40, 20), width=2)
    
    return img

# Generate high-quality trees
print("Generating high-quality tree sprites...")

# Oak - traditional green
oak_img = create_high_quality_tree('oak', (101, 67, 33), (46, 125, 50), 'oak')
oak_img.save('client/assets/resources/tree_oak.png')
print("Created tree_oak.png")

# Willow - light green with drooping
willow_img = create_high_quality_tree('willow', (139, 90, 43), (144, 238, 144), 'willow')
willow_img.save('client/assets/resources/tree_willow.png')
print("Created tree_willow.png")

# Maple - reddish autumn colors
maple_img = create_high_quality_tree('maple', (101, 67, 33), (178, 34, 34), 'maple')
maple_img.save('client/assets/resources/tree_maple.png')
print("Created tree_maple.png")

# Yew - dark green, coniferous
yew_img = create_high_quality_tree('yew', (85, 60, 42), (0, 100, 0), 'yew')
yew_img.save('client/assets/resources/tree_yew.png')
print("Created tree_yew.png")

# Stump
stump_img = create_detailed_stump()
stump_img.save('client/assets/resources/stump.png')
print("Created stump.png")

print("\nHigh-quality tree sprites generated!")
print("Features:")
print("- Clean, RuneScape-style appearance")
print("- Proper trunk proportions")
print("- Layered canopies for depth")
print("- Species-specific characteristics")
print("- 48x48 size (1.5x player size)")