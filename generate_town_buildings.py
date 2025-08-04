from PIL import Image, ImageDraw
import random
import os

# Create assets directories if they don't exist
os.makedirs('client/assets/buildings', exist_ok=True)

def create_building_base(width, height, wall_color, roof_color):
    """Create a basic building structure"""
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate roof height (about 1/3 of total height)
    roof_height = height // 3
    wall_height = height - roof_height
    
    # Draw walls
    draw.rectangle([0, roof_height, width-1, height-1], fill=wall_color, outline=(0, 0, 0))
    
    # Draw roof (triangle)
    roof_points = [
        (0, roof_height),           # Left base
        (width//2, 0),              # Peak
        (width-1, roof_height)      # Right base
    ]
    draw.polygon(roof_points, fill=roof_color, outline=(0, 0, 0))
    
    return img, draw, roof_height, wall_height

def create_bank():
    """Create a RuneScape-style bank building"""
    width, height = 96, 80
    img, draw, roof_height, wall_height = create_building_base(
        width, height,
        (180, 150, 120),  # Light stone walls
        (120, 80, 60)     # Brown roof
    )
    
    # Bank entrance (double doors)
    door_width = 16
    door_height = 24
    door_x = (width - door_width) // 2
    door_y = height - door_height
    
    # Draw double doors
    draw.rectangle([door_x, door_y, door_x + door_width//2 - 1, height-1], 
                  fill=(80, 50, 30), outline=(60, 40, 20))
    draw.rectangle([door_x + door_width//2 + 1, door_y, door_x + door_width, height-1], 
                  fill=(80, 50, 30), outline=(60, 40, 20))
    
    # Door handles
    draw.ellipse([door_x + 3, door_y + door_height//2 - 1, door_x + 5, door_y + door_height//2 + 1], 
                fill=(255, 215, 0))  # Gold handle
    draw.ellipse([door_x + door_width - 5, door_y + door_height//2 - 1, door_x + door_width - 3, door_y + door_height//2 + 1], 
                fill=(255, 215, 0))  # Gold handle
    
    # Bank windows
    window_size = 12
    window_y = roof_height + 8
    
    # Left window
    draw.rectangle([15, window_y, 15 + window_size, window_y + window_size], 
                  fill=(100, 150, 255), outline=(0, 0, 0))
    draw.line([(15 + window_size//2, window_y), (15 + window_size//2, window_y + window_size)], 
             fill=(0, 0, 0))
    draw.line([(15, window_y + window_size//2), (15 + window_size, window_y + window_size//2)], 
             fill=(0, 0, 0))
    
    # Right window
    draw.rectangle([width - 15 - window_size, window_y, width - 15, window_y + window_size], 
                  fill=(100, 150, 255), outline=(0, 0, 0))
    draw.line([(width - 15 - window_size//2, window_y), (width - 15 - window_size//2, window_y + window_size)], 
             fill=(0, 0, 0))
    draw.line([(width - 15 - window_size, window_y + window_size//2), (width - 15, window_y + window_size//2)], 
             fill=(0, 0, 0))
    
    # Bank sign above door
    sign_width = 32
    sign_height = 8
    sign_x = (width - sign_width) // 2
    sign_y = door_y - 12
    
    draw.rectangle([sign_x, sign_y, sign_x + sign_width, sign_y + sign_height], 
                  fill=(255, 215, 0), outline=(0, 0, 0))
    
    # Add roof tiles texture
    for i in range(0, width, 8):
        for j in range(5, roof_height, 6):
            if i < width - 4 and j < roof_height - 2:
                # Simple tile pattern
                tile_y = int(j + (i % 16) * 0.1)  # Slight offset for realism
                if tile_y < roof_height:
                    draw.rectangle([i, tile_y, i + 6, tile_y + 4], 
                                 fill=(100, 65, 45), outline=(80, 50, 35))
    
    img.save('client/assets/buildings/bank.png')
    print("Created bank.png (96x80)")

def create_general_store():
    """Create a general store building"""
    width, height = 80, 64
    img, draw, roof_height, wall_height = create_building_base(
        width, height,
        (150, 120, 90),   # Wooden walls
        (100, 60, 40)     # Dark brown roof
    )
    
    # Store entrance
    door_width = 12
    door_height = 20
    door_x = (width - door_width) // 2
    door_y = height - door_height
    
    draw.rectangle([door_x, door_y, door_x + door_width, height-1], 
                  fill=(80, 50, 30), outline=(60, 40, 20))
    
    # Door handle
    draw.ellipse([door_x + door_width - 4, door_y + door_height//2 - 1, 
                 door_x + door_width - 2, door_y + door_height//2 + 1], 
                fill=(139, 69, 19))
    
    # Store window (larger, for displaying goods)
    window_width = 20
    window_height = 14
    window_x = 12
    window_y = roof_height + 6
    
    draw.rectangle([window_x, window_y, window_x + window_width, window_y + window_height], 
                  fill=(100, 150, 255), outline=(0, 0, 0))
    
    # Window cross pattern
    draw.line([(window_x + window_width//2, window_y), (window_x + window_width//2, window_y + window_height)], 
             fill=(0, 0, 0))
    draw.line([(window_x, window_y + window_height//2), (window_x + window_width, window_y + window_height//2)], 
             fill=(0, 0, 0))
    
    # Shop sign
    sign_width = 28
    sign_height = 6
    sign_x = (width - sign_width) // 2
    sign_y = door_y - 10
    
    draw.rectangle([sign_x, sign_y, sign_x + sign_width, sign_y + sign_height], 
                  fill=(200, 180, 120), outline=(0, 0, 0))
    
    img.save('client/assets/buildings/general_store.png')
    print("Created general_store.png (80x64)")

def create_house():
    """Create a regular house"""
    width, height = 64, 48
    img, draw, roof_height, wall_height = create_building_base(
        width, height,
        (160, 140, 100),  # Light brown walls
        (120, 80, 60)     # Brown roof
    )
    
    # House door
    door_width = 10
    door_height = 16
    door_x = (width - door_width) // 2
    door_y = height - door_height
    
    draw.rectangle([door_x, door_y, door_x + door_width, height-1], 
                  fill=(100, 60, 40), outline=(80, 50, 30))
    
    # Door handle
    draw.ellipse([door_x + door_width - 3, door_y + door_height//2 - 1, 
                 door_x + door_width - 1, door_y + door_height//2 + 1], 
                fill=(139, 69, 19))
    
    # House windows
    window_size = 8
    window_y = roof_height + 4
    
    # Left window
    draw.rectangle([8, window_y, 8 + window_size, window_y + window_size], 
                  fill=(100, 150, 255), outline=(0, 0, 0))
    draw.line([(8 + window_size//2, window_y), (8 + window_size//2, window_y + window_size)], 
             fill=(0, 0, 0))
    draw.line([(8, window_y + window_size//2), (8 + window_size, window_y + window_size//2)], 
             fill=(0, 0, 0))
    
    # Right window
    draw.rectangle([width - 8 - window_size, window_y, width - 8, window_y + window_size], 
                  fill=(100, 150, 255), outline=(0, 0, 0))
    draw.line([(width - 8 - window_size//2, window_y), (width - 8 - window_size//2, window_y + window_size)], 
             fill=(0, 0, 0))
    draw.line([(width - 8 - window_size, window_y + window_size//2), (width - 8, window_y + window_size//2)], 
             fill=(0, 0, 0))
    
    img.save('client/assets/buildings/house.png')
    print("Created house.png (64x48)")

def create_magic_shop():
    """Create a magic shop with mystical appearance"""
    width, height = 72, 64
    img, draw, roof_height, wall_height = create_building_base(
        width, height,
        (80, 60, 100),    # Purple-tinted walls
        (60, 40, 80)      # Purple roof
    )
    
    # Magic shop door
    door_width = 12
    door_height = 18
    door_x = (width - door_width) // 2
    door_y = height - door_height
    
    draw.rectangle([door_x, door_y, door_x + door_width, height-1], 
                  fill=(60, 30, 80), outline=(40, 20, 60))
    
    # Mystical door handle (glowing)
    draw.ellipse([door_x + door_width - 4, door_y + door_height//2 - 1, 
                 door_x + door_width - 2, door_y + door_height//2 + 1], 
                fill=(150, 100, 255))
    
    # Arched window
    window_width = 16
    window_height = 12
    window_x = (width - window_width) // 2
    window_y = roof_height + 5
    
    # Window base
    draw.rectangle([window_x, window_y + 4, window_x + window_width, window_y + window_height], 
                  fill=(50, 20, 100), outline=(0, 0, 0))
    
    # Window arch
    draw.arc([window_x, window_y, window_x + window_width, window_y + 8], 
            start=0, end=180, fill=(0, 0, 0))
    
    # Mystical glow effect
    for i in range(3):
        glow_size = 2 + i * 2
        glow_alpha = 100 - i * 30
        draw.ellipse([window_x + window_width//2 - glow_size, window_y + window_height//2 - glow_size,
                     window_x + window_width//2 + glow_size, window_y + window_height//2 + glow_size], 
                    fill=(100, 50, 255, glow_alpha))
    
    # Crystal on roof peak
    crystal_size = 4
    crystal_x = width//2 - crystal_size//2
    crystal_y = 2
    
    draw.polygon([
        (crystal_x + crystal_size//2, crystal_y),
        (crystal_x, crystal_y + crystal_size),
        (crystal_x + crystal_size, crystal_y + crystal_size)
    ], fill=(200, 150, 255), outline=(0, 0, 0))
    
    img.save('client/assets/buildings/magic_shop.png')
    print("Created magic_shop.png (72x64)")

def create_well():
    """Create a town well/fountain"""
    width, height = 32, 24
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Well base (circular stone)
    draw.ellipse([4, 8, width-4, height-2], fill=(120, 120, 120), outline=(80, 80, 80))
    
    # Well opening (dark)
    draw.ellipse([8, 10, width-8, height-6], fill=(20, 20, 20), outline=(0, 0, 0))
    
    # Well roof support posts
    draw.rectangle([6, 0, 8, 12], fill=(101, 67, 33))
    draw.rectangle([width-8, 0, width-6, 12], fill=(101, 67, 33))
    
    # Well roof
    draw.polygon([
        (2, 8),
        (width//2, 0),
        (width-2, 8)
    ], fill=(120, 80, 60), outline=(0, 0, 0))
    
    # Rope and bucket (small details)
    draw.line([(width//2, 2), (width//2, 10)], fill=(139, 90, 43), width=2)
    draw.rectangle([width//2 - 2, 8, width//2 + 2, 12], fill=(80, 60, 40), outline=(0, 0, 0))
    
    img.save('client/assets/buildings/well.png')
    print("Created well.png (32x24)")

def create_fence():
    """Create fence sections for town boundaries"""
    width, height = 32, 16
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Fence posts
    post_width = 3
    post_spacing = 8
    
    for i in range(0, width, post_spacing):
        draw.rectangle([i, 4, i + post_width, height], fill=(101, 67, 33), outline=(80, 50, 25))
    
    # Horizontal fence rails
    rail_height = 2
    # Top rail
    draw.rectangle([0, 6, width, 6 + rail_height], fill=(101, 67, 33), outline=(80, 50, 25))
    # Bottom rail
    draw.rectangle([0, 10, width, 10 + rail_height], fill=(101, 67, 33), outline=(80, 50, 25))
    
    img.save('client/assets/buildings/fence.png')
    print("Created fence.png (32x16)")

# Generate all building sprites
print("Generating RuneScape-style town buildings...")

create_bank()
create_general_store()
create_house()
create_magic_shop()
create_well()
create_fence()

print("\nTown buildings generated successfully!")
print("Buildings created:")
print("- Bank (96x80) - Large, official building with gold accents")
print("- General Store (80x64) - Shop with large display window")
print("- House (64x48) - Residential building")
print("- Magic Shop (72x64) - Mystical purple building")
print("- Well (32x24) - Town center water source")
print("- Fence (32x16) - Boundary and decoration")