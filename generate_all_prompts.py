#!/usr/bin/env python3
"""
Master Script to Generate All Tile Prompts
Creates prompts.txt files for every tile type with 10 style variations
"""

import os

# Define all tile categories and their types
TILE_STRUCTURE = {
    'terrain': ['grass', 'dirt', 'stone', 'cobblestone', 'water', 'sand', 'mud', 'snow', 'ice', 'lava'],
    'shops': ['bank', 'general_store', 'magic_shop', 'weapon_shop', 'armor_shop', 'food_shop', 'rune_shop', 'archery_shop'],
    'buildings': ['house', 'house_small', 'house_large', 'castle', 'tower_wizard', 'church', 'inn', 'windmill', 'lighthouse', 'tent', 'hut'],
    'trees': ['tree_normal', 'tree_oak', 'tree_willow', 'tree_maple', 'tree_yew', 'tree_magic', 'tree_palm', 'tree_dead', 'tree_pine', 'bush'],
    'rocks': ['rock_copper', 'rock_tin', 'rock_iron', 'rock_coal', 'rock_gold', 'rock_mithril', 'rock_adamant', 'rock_rune', 'rock_silver', 'rock_gem'],
    'utilities': ['furnace', 'anvil', 'altar', 'spinning_wheel', 'pottery_wheel', 'loom', 'cooking_range', 'well', 'chest'],
    'decorations': ['fence_wood', 'fence_stone', 'gate_wood', 'gate_metal', 'statue', 'bridge', 'lamp_post', 'fountain', 'flower_bed'],
    'special': ['fishing_spot', 'portal', 'teleport_pad', 'quest_marker', 'spawn_point']
}

# Style templates (3 countries, 2 games, 3 movies, 2 TV shows)
STYLE_TEMPLATES = [
    # Countries (3)
    "{country1_name} Style (Country):\n\"{tile_name} with {country1_description}, {country1_aesthetic}, 16x16 pixel art, top-down view, {category} game tile\"",
    "{country2_name} Style (Country):\n\"{tile_name} with {country2_description}, {country2_aesthetic}, 16x16 pixel art, {category} asset tile\"", 
    "{country3_name} Style (Country):\n\"{tile_name} with {country3_description}, {country3_aesthetic}, 16x16 pixel art, traditional game tile\"",
    
    # Games (2)
    "{game1_name} Style (Game):\n\"{tile_name} in {game1_description}, {game1_aesthetic}, 16x16 pixel art, {category} game tile\"",
    "{game2_name} Style (Game):\n\"{tile_name} with {game2_description}, {game2_aesthetic}, 16x16 pixel art, video game tile\"",
    
    # Movies (3)
    "{movie1_name} Style (Movie):\n\"{tile_name} inspired by {movie1_description}, {movie1_aesthetic}, 16x16 pixel art, cinematic {category} tile\"",
    "{movie2_name} Style (Movie):\n\"{tile_name} from {movie2_description}, {movie2_aesthetic}, 16x16 pixel art, film-inspired tile\"",
    "{movie3_name} Style (Movie):\n\"{tile_name} with {movie3_description}, {movie3_aesthetic}, 16x16 pixel art, movie-style tile\"",
    
    # TV Shows (2)
    "{tv1_name} Style (TV):\n\"{tile_name} from {tv1_description}, {tv1_aesthetic}, 16x16 pixel art, television series tile\"",
    "{tv2_name} Style (TV):\n\"{tile_name} inspired by {tv2_description}, {tv2_aesthetic}, 16x16 pixel art, TV show style tile\""
]

# Specific style data for different tile types
TILE_STYLES = {
    'terrain': {
        # Grass styles already created manually
        'default': {
            'country1_name': 'Japanese', 'country1_description': 'zen garden patterns', 'country1_aesthetic': 'traditional Japanese art style',
            'country2_name': 'Irish', 'country2_description': 'emerald green hues', 'country2_aesthetic': 'Celtic mysticism',
            'country3_name': 'Mexican', 'country3_description': 'desert grass textures', 'country3_aesthetic': 'southwestern style',
            'game1_name': 'Minecraft', 'game1_description': 'blocky pixel design', 'game1_aesthetic': 'sandbox game style',
            'game2_name': 'Animal Crossing', 'game2_description': 'cute cartoon design', 'game2_aesthetic': 'Nintendo cozy style',
            'movie1_name': 'Avatar', 'movie1_description': 'Pandora alien world', 'movie1_aesthetic': 'bioluminescent sci-fi',
            'movie2_name': 'Lord of the Rings', 'movie2_description': 'Middle-earth landscapes', 'movie2_aesthetic': 'epic fantasy',
            'movie3_name': 'Studio Ghibli', 'movie3_description': 'magical realism', 'movie3_aesthetic': 'anime movie magic',
            'tv1_name': 'Game of Thrones', 'tv1_description': 'Westeros terrain', 'tv1_aesthetic': 'HBO medieval fantasy',
            'tv2_name': 'Adventure Time', 'tv2_description': 'Land of Ooo', 'tv2_aesthetic': 'Cartoon Network whimsy'
        }
    },
    'buildings': {
        'default': {
            'country1_name': 'Japanese', 'country1_description': 'traditional architecture', 'country1_aesthetic': 'zen temple style',
            'country2_name': 'German', 'country2_description': 'half-timbered design', 'country2_aesthetic': 'Bavarian cottage style',
            'country3_name': 'Arabian', 'country3_description': 'desert palace architecture', 'country3_aesthetic': 'Middle Eastern style',
            'game1_name': 'Minecraft', 'game1_description': 'blocky construction', 'game1_aesthetic': 'cubic building style',
            'game2_name': 'SimCity', 'game2_description': 'urban planning design', 'game2_aesthetic': 'city simulation style',
            'movie1_name': 'Disney', 'movie1_description': 'fairy tale castle', 'movie1_aesthetic': 'animated movie magic',
            'movie2_name': 'Lord of the Rings', 'movie2_description': 'epic fantasy architecture', 'movie2_aesthetic': 'Tolkien grandeur',
            'movie3_name': 'Harry Potter', 'movie3_description': 'magical architecture', 'movie3_aesthetic': 'wizarding world style',
            'tv1_name': 'Game of Thrones', 'tv1_description': 'medieval fortress', 'tv1_aesthetic': 'HBO epic drama',
            'tv2_name': 'The Simpsons', 'tv2_description': 'cartoon suburban home', 'tv2_aesthetic': 'animated sitcom style'
        }
    }
    # Add more specific styles as needed
}

def create_prompts_file(category, tile_type):
    """Create a prompts.txt file for a specific tile type"""
    
    # Get style data (use default if specific not available)
    style_data = TILE_STYLES.get(category, {}).get(tile_type, 
                                 TILE_STYLES.get(category, {}).get('default', 
                                 TILE_STYLES['terrain']['default']))
    
    # Format tile name for display
    display_name = tile_type.replace('_', ' ').title()
    
    # Create the prompts content
    content = f"{display_name.upper()} TILE PROMPTS - 10 Style Variations\n\n"
    
    for i, template in enumerate(STYLE_TEMPLATES, 1):
        # Add category and tile_name to style_data
        format_data = {**style_data, 'category': category, 'tile_name': display_name}
        
        prompt = template.format(**format_data)
        content += f"{i}. {prompt}\n\n"
    
    # Create directory path
    dir_path = f"client/assets/world_builder/{category}/{tile_type}"
    
    # Write the file
    file_path = f"{dir_path}/prompts.txt"
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Created: {file_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to create {file_path}: {e}")
        return False

def main():
    """Generate all prompt files"""
    print("🎨 Generating All Tile Prompts...")
    print("=" * 50)
    
    total_created = 0
    total_failed = 0
    
    for category, tile_types in TILE_STRUCTURE.items():
        print(f"\n📁 Processing {category.upper()} category:")
        
        for tile_type in tile_types:
            if create_prompts_file(category, tile_type):
                total_created += 1
            else:
                total_failed += 1
    
    print(f"\n🎯 Summary:")
    print(f"✅ Created: {total_created} prompt files")
    print(f"❌ Failed: {total_failed} prompt files")
    print(f"📊 Total tiles: {sum(len(types) for types in TILE_STRUCTURE.values())}")
    
    if total_failed == 0:
        print("\n🚀 All prompt files generated successfully!")
        print("You can now use these prompts with DALL-E or other AI image generators")
        print("Each tile type has 10 different style variations to choose from")

if __name__ == "__main__":
    main()