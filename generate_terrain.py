from PIL import Image, ImageDraw
import random
import os

# Create assets directories if they don't exist
os.makedirs('client/assets/tiles', exist_ok=True)

def add_noise(img, variation=10):
    """Add subtle noise to make textures less uniform"""
    pixels = img.load()
    width, height = img.size
    for x in range(width):
        for y in range(height):
            r, g, b, a = pixels[x, y]
            # Add random variation
            r = max(0, min(255, r + random.randint(-variation, variation)))
            g = max(0, min(255, g + random.randint(-variation, variation)))
            b = max(0, min(255, b + random.randint(-variation, variation)))
            pixels[x, y] = (r, g, b, a)
    return img

def create_grass_tile():
    """Create a detailed RuneScape-style grass tile"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Base grass color with variation
    base_colors = [
        (34, 139, 34),   # Forest green
        (46, 125, 50),   # Medium green
        (60, 121, 60),   # Slightly lighter
        (50, 130, 50),   # Mid green
    ]
    
    # Fill with base color
    draw.rectangle([0, 0, 31, 31], fill=(46, 125, 50, 255))
    
    # Add grass texture pattern
    for i in range(200):
        x = random.randint(0, 31)
        y = random.randint(0, 31)
        color = random.choice(base_colors)
        # Draw small grass blades
        if random.random() > 0.5:
            draw.line([(x, y), (x, y-2)], fill=(*color, 255), width=1)
        else:
            draw.point((x, y), fill=(*color, 255))
    
    # Add darker spots for depth
    for i in range(30):
        x = random.randint(2, 29)
        y = random.randint(2, 29)
        size = random.randint(1, 2)
        draw.ellipse([x, y, x+size, y+size], fill=(30, 100, 30, 100))
    
    # Add highlights
    for i in range(20):
        x = random.randint(0, 31)
        y = random.randint(0, 31)
        draw.point((x, y), fill=(80, 160, 80, 200))
    
    img = add_noise(img, 5)
    img.save('client/assets/tiles/grass.png')
    print("Created grass.png")

def create_grass_variant(variant_num):
    """Create grass variants for less repetition"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Slightly different base colors for variants
    if variant_num == 1:
        base = (50, 135, 45)
    elif variant_num == 2:
        base = (42, 128, 48)
    else:
        base = (48, 140, 52)
    
    draw.rectangle([0, 0, 31, 31], fill=(*base, 255))
    
    # Different pattern density
    density = 150 + (variant_num * 30)
    for i in range(density):
        x = random.randint(0, 31)
        y = random.randint(0, 31)
        variation = random.randint(-15, 15)
        color = (base[0] + variation, base[1] + variation, base[2] + variation)
        color = tuple(max(0, min(255, c)) for c in color)
        draw.point((x, y), fill=(*color, 255))
    
    # Add some texture
    for i in range(20 + variant_num * 5):
        x = random.randint(1, 30)
        y = random.randint(1, 30)
        if random.random() > 0.5:
            draw.line([(x, y), (x+1, y)], fill=(30, 100, 30, 150), width=1)
    
    img = add_noise(img, 4)
    img.save(f'client/assets/tiles/grass{variant_num}.png')
    print(f"Created grass{variant_num}.png")

def create_dirt_tile():
    """Create a detailed RuneScape-style dirt/path tile"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Base dirt color
    base_colors = [
        (139, 90, 43),   # Saddle brown
        (160, 82, 45),   # Sienna
        (150, 85, 40),   # Dirt brown
        (130, 80, 35),   # Darker dirt
    ]
    
    draw.rectangle([0, 0, 31, 31], fill=(145, 85, 40, 255))
    
    # Add dirt texture
    for i in range(300):
        x = random.randint(0, 31)
        y = random.randint(0, 31)
        color = random.choice(base_colors)
        draw.point((x, y), fill=(*color, 255))
    
    # Add small stones/pebbles
    for i in range(15):
        x = random.randint(2, 29)
        y = random.randint(2, 29)
        size = random.randint(1, 2)
        stone_color = (100 + random.randint(-20, 20), 90 + random.randint(-20, 20), 80)
        draw.ellipse([x, y, x+size, y+size], fill=(*stone_color, 255))
    
    # Add cracks/lines
    for i in range(5):
        x1 = random.randint(0, 31)
        y1 = random.randint(0, 31)
        x2 = x1 + random.randint(-5, 5)
        y2 = y1 + random.randint(-5, 5)
        draw.line([(x1, y1), (x2, y2)], fill=(100, 60, 30, 150), width=1)
    
    img = add_noise(img, 8)
    img.save('client/assets/tiles/dirt.png')
    print("Created dirt.png")

def create_path_tile():
    """Create a worn path tile"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Lighter dirt for paths
    draw.rectangle([0, 0, 31, 31], fill=(165, 125, 85, 255))
    
    # Add worn texture
    for i in range(200):
        x = random.randint(0, 31)
        y = random.randint(0, 31)
        variation = random.randint(-20, 20)
        color = (165 + variation, 125 + variation, 85 + variation)
        color = tuple(max(0, min(255, c)) for c in color)
        draw.point((x, y), fill=(*color, 255))
    
    # Add foot traffic wear
    for i in range(10):
        x = random.randint(5, 26)
        y = random.randint(5, 26)
        draw.ellipse([x, y, x+3, y+2], fill=(155, 115, 75, 100))
    
    img = add_noise(img, 6)
    img.save('client/assets/tiles/path.png')
    print("Created path.png")

def create_stone_tile():
    """Create a detailed stone/rock tile"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Base stone color
    draw.rectangle([0, 0, 31, 31], fill=(105, 105, 105, 255))
    
    # Add stone texture with cracks
    for i in range(250):
        x = random.randint(0, 31)
        y = random.randint(0, 31)
        variation = random.randint(-25, 25)
        gray = 105 + variation
        gray = max(0, min(255, gray))
        draw.point((x, y), fill=(gray, gray, gray, 255))
    
    # Add darker cracks
    for i in range(8):
        x1 = random.randint(0, 31)
        y1 = random.randint(0, 31)
        x2 = x1 + random.randint(-8, 8)
        y2 = y1 + random.randint(-8, 8)
        draw.line([(x1, y1), (x2, y2)], fill=(60, 60, 60, 200), width=1)
    
    # Add some moss/weathering
    for i in range(5):
        x = random.randint(2, 29)
        y = random.randint(2, 29)
        draw.ellipse([x, y, x+3, y+3], fill=(85, 105, 85, 80))
    
    img = add_noise(img, 10)
    img.save('client/assets/tiles/stone.png')
    print("Created stone.png")

def create_water_tile():
    """Create an animated-looking water tile"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Base water color
    draw.rectangle([0, 0, 31, 31], fill=(28, 107, 160, 255))
    
    # Add water ripples
    for i in range(100):
        x = random.randint(0, 31)
        y = random.randint(0, 31)
        variation = random.randint(-20, 30)
        blue = 160 + variation
        blue = max(0, min(255, blue))
        draw.point((x, y), fill=(28, 107, blue, 255))
    
    # Add wave patterns
    for y in range(0, 32, 4):
        for x in range(32):
            if (x + y) % 8 < 4:
                draw.point((x, y), fill=(40, 120, 180, 200))
    
    # Add highlights for water shimmer
    for i in range(15):
        x = random.randint(0, 31)
        y = random.randint(0, 31)
        draw.point((x, y), fill=(100, 180, 220, 180))
    
    img = add_noise(img, 5)
    img.save('client/assets/tiles/water.png')
    print("Created water.png")

def create_sand_tile():
    """Create a sandy beach tile"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Base sand color
    draw.rectangle([0, 0, 31, 31], fill=(238, 203, 173, 255))
    
    # Add sand texture
    for i in range(400):
        x = random.randint(0, 31)
        y = random.randint(0, 31)
        variation = random.randint(-15, 15)
        color = (238 + variation, 203 + variation, 173 + variation)
        color = tuple(max(0, min(255, c)) for c in color)
        draw.point((x, y), fill=(*color, 255))
    
    # Add small shells/stones
    for i in range(5):
        x = random.randint(2, 29)
        y = random.randint(2, 29)
        draw.point((x, y), fill=(255, 240, 220, 255))
    
    img = add_noise(img, 5)
    img.save('client/assets/tiles/sand.png')
    print("Created sand.png")

def create_mud_tile():
    """Create a muddy/swamp tile"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Base mud color
    draw.rectangle([0, 0, 31, 31], fill=(74, 65, 42, 255))
    
    # Add mud texture
    for i in range(300):
        x = random.randint(0, 31)
        y = random.randint(0, 31)
        variation = random.randint(-10, 10)
        color = (74 + variation, 65 + variation, 42 + variation)
        color = tuple(max(0, min(255, c)) for c in color)
        draw.point((x, y), fill=(*color, 255))
    
    # Add wet spots
    for i in range(8):
        x = random.randint(3, 28)
        y = random.randint(3, 28)
        draw.ellipse([x, y, x+4, y+3], fill=(60, 55, 35, 150))
    
    img = add_noise(img, 8)
    img.save('client/assets/tiles/mud.png')
    print("Created mud.png")

# Generate all tiles
print("Generating RuneScape-style terrain tiles...")
create_grass_tile()
create_grass_variant(1)
create_grass_variant(2)
create_grass_variant(3)
create_dirt_tile()
create_path_tile()
create_stone_tile()
create_water_tile()
create_sand_tile()
create_mud_tile()

print("\nAll terrain tiles generated successfully!")
print("Tiles are more detailed with:")
print("- Texture variation and noise")
print("- Multiple grass variants to reduce repetition")
print("- Proper RuneScape-style colors")
print("- Details like grass blades, stones, cracks")