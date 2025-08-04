from PIL import Image, ImageDraw
import random
import os

# Create assets directories if they don't exist
os.makedirs('client/assets/interiors', exist_ok=True)

def create_bank_interior():
    """Create a bank interior room layout"""
    width, height = 320, 240
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Stone checkered floor
    tile_size = 16
    for x in range(0, width, tile_size):
        for y in range(0, height, tile_size):
            tile_x = x // tile_size
            tile_y = y // tile_size
            if (tile_x + tile_y) % 2 == 0:
                color = (160, 160, 160)  # Light gray
            else:
                color = (120, 120, 120)  # Dark gray
            draw.rectangle([x, y, x + tile_size, y + tile_size], fill=color, outline=(80, 80, 80))
    
    # Bank counter (top wall)
    counter_y = 40
    draw.rectangle([40, counter_y, width - 40, counter_y + 30], fill=(139, 69, 19), outline=(101, 67, 33))
    
    # Vault doors on side walls
    vault_width, vault_height = 24, 32
    # Left wall vaults
    draw.rectangle([10, 80, 10 + vault_width, 80 + vault_height], fill=(64, 64, 64), outline=(32, 32, 32))
    draw.rectangle([10, 130, 10 + vault_width, 130 + vault_height], fill=(64, 64, 64), outline=(32, 32, 32))
    
    # Right wall vaults
    draw.rectangle([width - 10 - vault_width, 80, width - 10, 80 + vault_height], fill=(64, 64, 64), outline=(32, 32, 32))
    draw.rectangle([width - 10 - vault_width, 130, width - 10, 130 + vault_height], fill=(64, 64, 64), outline=(32, 32, 32))
    
    # Entrance door at bottom
    door_width = 40
    door_x = (width - door_width) // 2
    draw.rectangle([door_x, height - 20, door_x + door_width, height], fill=(101, 67, 33), outline=(80, 50, 25))
    
    # Bank clerk position marker
    clerk_x = width // 2
    clerk_y = counter_y - 20
    draw.ellipse([clerk_x - 8, clerk_y - 8, clerk_x + 8, clerk_y + 8], fill=(255, 255, 0), outline=(255, 215, 0))
    
    # Wall torches
    draw.ellipse([60, 20, 70, 30], fill=(255, 165, 0))  # Left torch
    draw.ellipse([width - 70, 20, width - 60, 30], fill=(255, 165, 0))  # Right torch
    
    img.save('client/assets/interiors/bank_interior.png')
    print("Created bank_interior.png (320x240)")

def create_general_store_interior():
    """Create a general store interior room layout"""
    width, height = 280, 200
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Wooden plank floor
    plank_width = 20
    for y in range(0, height, plank_width):
        # Alternate plank colors for wood grain effect
        color = (139, 90, 43) if (y // plank_width) % 2 == 0 else (160, 100, 50)
        draw.rectangle([0, y, width, y + plank_width], fill=color, outline=(101, 67, 33))
    
    # Shop counter (left wall)
    counter_x = 20
    draw.rectangle([counter_x, 40, counter_x + 30, height - 60], fill=(139, 69, 19), outline=(101, 67, 33))
    
    # Shelving units on walls
    shelf_depth = 15
    # Top wall shelves
    draw.rectangle([60, 10, width - 60, 10 + shelf_depth], fill=(160, 82, 45), outline=(139, 69, 19))
    draw.rectangle([60, 25, width - 60, 25 + shelf_depth], fill=(160, 82, 45), outline=(139, 69, 19))
    
    # Right wall shelves
    draw.rectangle([width - 25, 50, width - 10, height - 80], fill=(160, 82, 45), outline=(139, 69, 19))
    
    # Storage barrels and crates
    # Barrels
    draw.ellipse([80, 120, 100, 140], fill=(101, 67, 33), outline=(80, 50, 25))
    draw.ellipse([110, 140, 130, 160], fill=(101, 67, 33), outline=(80, 50, 25))
    
    # Crates
    draw.rectangle([200, 130, 220, 150], fill=(139, 69, 19), outline=(101, 67, 33))
    draw.rectangle([210, 110, 230, 130], fill=(139, 69, 19), outline=(101, 67, 33))
    
    # Entrance door at bottom
    door_width = 35
    door_x = (width - door_width) // 2
    draw.rectangle([door_x, height - 15, door_x + door_width, height], fill=(101, 67, 33), outline=(80, 50, 25))
    
    # Shopkeeper position marker
    shopkeeper_x = counter_x - 15
    shopkeeper_y = 100
    draw.ellipse([shopkeeper_x - 8, shopkeeper_y - 8, shopkeeper_x + 8, shopkeeper_y + 8], fill=(255, 255, 0), outline=(255, 215, 0))
    
    # Hanging lanterns
    draw.ellipse([100, 60, 110, 70], fill=(255, 215, 0))
    draw.ellipse([180, 60, 190, 70], fill=(255, 215, 0))
    
    img.save('client/assets/interiors/general_store_interior.png')
    print("Created general_store_interior.png (280x200)")

def create_house_interior():
    """Create a house interior room layout"""
    width, height = 240, 180
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Wooden plank floor with rug
    # Base floor
    for y in range(0, height, 15):
        color = (139, 90, 43) if (y // 15) % 2 == 0 else (160, 100, 50)
        draw.rectangle([0, y, width, y + 15], fill=color, outline=(101, 67, 33))
    
    # Center rug
    rug_x, rug_y = 80, 80
    rug_w, rug_h = 80, 60
    draw.rectangle([rug_x, rug_y, rug_x + rug_w, rug_y + rug_h], fill=(128, 0, 0), outline=(100, 0, 0))
    
    # Fireplace (left wall)
    fireplace_w, fireplace_h = 40, 30
    draw.rectangle([10, 40, 10 + fireplace_w, 40 + fireplace_h], fill=(64, 64, 64), outline=(32, 32, 32))
    # Fire
    draw.ellipse([15, 45, 45, 65], fill=(255, 69, 0))
    draw.ellipse([20, 50, 40, 60], fill=(255, 215, 0))
    
    # Dining table (center)
    table_w, table_h = 50, 30
    table_x = (width - table_w) // 2
    table_y = 90
    draw.rectangle([table_x, table_y, table_x + table_w, table_y + table_h], fill=(160, 82, 45), outline=(139, 69, 19))
    
    # Chairs around table
    chair_size = 12
    # Top chair
    draw.rectangle([table_x + table_w//2 - chair_size//2, table_y - chair_size - 5, 
                   table_x + table_w//2 + chair_size//2, table_y - 5], fill=(139, 69, 19))
    # Bottom chair
    draw.rectangle([table_x + table_w//2 - chair_size//2, table_y + table_h + 5, 
                   table_x + table_w//2 + chair_size//2, table_y + table_h + chair_size + 5], fill=(139, 69, 19))
    
    # Bed (top right corner)
    bed_w, bed_h = 35, 50
    bed_x = width - bed_w - 15
    bed_y = 20
    draw.rectangle([bed_x, bed_y, bed_x + bed_w, bed_y + bed_h], fill=(139, 69, 19), outline=(101, 67, 33))
    # Blanket
    draw.rectangle([bed_x + 3, bed_y + 3, bed_x + bed_w - 3, bed_y + bed_h - 3], fill=(0, 100, 200))
    
    # Storage chest (bottom right)
    chest_w, chest_h = 25, 20
    draw.rectangle([width - chest_w - 15, height - chest_h - 30, width - 15, height - 30], 
                  fill=(101, 67, 33), outline=(80, 50, 25))
    
    # Bookshelf (right wall)
    shelf_w, shelf_h = 20, 60
    draw.rectangle([width - shelf_w - 10, 90, width - 10, 90 + shelf_h], fill=(160, 82, 45), outline=(139, 69, 19))
    
    # Entrance door at bottom
    door_width = 30
    door_x = (width - door_width) // 2
    draw.rectangle([door_x, height - 12, door_x + door_width, height], fill=(101, 67, 33), outline=(80, 50, 25))
    
    # Windows
    window_size = 15
    # Left window
    draw.rectangle([10, 10, 10 + window_size, 10 + window_size], fill=(173, 216, 230), outline=(0, 0, 0))
    # Right window
    draw.rectangle([width - 25, 10, width - 10, 25], fill=(173, 216, 230), outline=(0, 0, 0))
    
    img.save('client/assets/interiors/house_interior.png')
    print("Created house_interior.png (240x180)")

def create_magic_shop_interior():
    """Create a magic shop interior room layout"""
    width, height = 300, 220
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Dark stone floor with magical runes
    tile_size = 20
    for x in range(0, width, tile_size):
        for y in range(0, height, tile_size):
            draw.rectangle([x, y, x + tile_size, y + tile_size], fill=(40, 40, 60), outline=(20, 20, 40))
            # Add magical rune symbols occasionally
            if random.random() < 0.1:
                draw.ellipse([x + 8, y + 8, x + 12, y + 12], fill=(150, 100, 255))
    
    # Curved counter (following tower shape)
    counter_points = []
    center_x, center_y = width // 2, 60
    radius = 80
    for angle in range(-45, 46, 5):
        x = center_x + radius * (angle / 90)
        y = center_y
        counter_points.extend([x, y])
        counter_points.extend([x, y + 25])
    
    if len(counter_points) >= 8:
        draw.polygon(counter_points[:8], fill=(60, 30, 80), outline=(40, 20, 60))
    
    # Magical shop counter (simplified)
    draw.rectangle([80, 50, 220, 75], fill=(60, 30, 80), outline=(40, 20, 60))
    
    # Crystal displays on counter
    draw.ellipse([100, 45, 110, 55], fill=(150, 100, 255))
    draw.ellipse([150, 45, 160, 55], fill=(100, 150, 255))
    draw.ellipse([200, 45, 210, 55], fill=(255, 100, 150))
    
    # Tall bookshelves
    shelf_w, shelf_h = 25, 100
    # Left bookshelf
    draw.rectangle([20, 80, 20 + shelf_w, 80 + shelf_h], fill=(80, 60, 100), outline=(60, 40, 80))
    # Right bookshelf
    draw.rectangle([width - 20 - shelf_w, 80, width - 20, 80 + shelf_h], fill=(80, 60, 100), outline=(60, 40, 80))
    
    # Magical workbench (left side)
    bench_w, bench_h = 40, 25
    draw.rectangle([30, 120, 30 + bench_w, 120 + bench_h], fill=(60, 30, 80), outline=(40, 20, 60))
    
    # Cauldron on workbench
    draw.ellipse([40, 115, 60, 130], fill=(20, 20, 20), outline=(0, 0, 0))
    
    # Crystal ball (right side)
    draw.ellipse([220, 110, 240, 130], fill=(200, 200, 255), outline=(150, 150, 255))
    
    # Spiral staircase (partial view in corner)
    stair_x, stair_y = width - 60, height - 60
    for i in range(5):
        step_y = stair_y - i * 8
        step_w = 50 - i * 5
        draw.rectangle([stair_x, step_y, stair_x + step_w, step_y + 6], fill=(80, 60, 100))
    
    # Entrance door at bottom with magical aura
    door_width = 35
    door_x = (width - door_width) // 2
    draw.rectangle([door_x, height - 15, door_x + door_width, height], fill=(60, 30, 80), outline=(40, 20, 60))
    
    # Magical aura around door
    for i in range(3):
        aura_size = 40 + i * 10
        draw.ellipse([door_x + door_width//2 - aura_size//2, height - 15 - aura_size//2,
                     door_x + door_width//2 + aura_size//2, height - 15 + aura_size//2], 
                    outline=(150 - i*30, 100 - i*20, 255 - i*30))
    
    # Magic shop keeper position marker
    keeper_x = width // 2
    keeper_y = 35
    draw.ellipse([keeper_x - 8, keeper_y - 8, keeper_x + 8, keeper_y + 8], fill=(255, 255, 0), outline=(255, 215, 0))
    
    # Magical orbs floating around room
    orb_positions = [(60, 40), (240, 40), (50, 160), (250, 160)]
    colors = [(150, 100, 255), (100, 150, 255), (255, 100, 150), (100, 255, 150)]
    
    for (x, y), color in zip(orb_positions, colors):
        draw.ellipse([x - 5, y - 5, x + 5, y + 5], fill=color)
        # Glow effect
        draw.ellipse([x - 8, y - 8, x + 8, y + 8], outline=color)
    
    # Wall runes for lighting
    rune_positions = [(40, 20), (width - 40, 20), (20, height//2), (width - 20, height//2)]
    for x, y in rune_positions:
        draw.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(150, 100, 255))
    
    img.save('client/assets/interiors/magic_shop_interior.png')
    print("Created magic_shop_interior.png (300x220)")

# Generate all interior layouts
print("Generating building interior layouts...")

create_bank_interior()
create_general_store_interior()
create_house_interior()
create_magic_shop_interior()

print("\nBuilding interiors generated successfully!")
print("Interior rooms created:")
print("- Bank Interior (320x240) - Stone floor, counter, vaults, clerk position")
print("- General Store Interior (280x200) - Wooden shop, shelves, barrels, shopkeeper position")
print("- House Interior (240x180) - Cozy home with fireplace, bed, table, storage")
print("- Magic Shop Interior (300x220) - Mystical tower with magical elements, spell components")
print("\nReplace these placeholder images with your AI-generated interiors!")