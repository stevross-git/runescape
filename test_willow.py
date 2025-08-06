#!/usr/bin/env python3
"""
Test specific file that was failing
"""

from tile_image_generator_simple import TileImageGenerator

def test_willow():
    generator = TileImageGenerator()
    
    # Test the tree_willow file specifically
    file_path = "trees/tree_willow/prompts.txt"
    
    print(f"Testing: {file_path}")
    prompts = generator.load_prompts(file_path)
    existing = generator.check_existing_images(file_path)
    
    print(f"Prompts loaded: {len(prompts)}")
    print(f"Existing images: {existing}")
    print(f"Missing images: {[i for i in range(1, 11) if i not in existing]}")
    
    if prompts:
        print("\nAll prompts:")
        for prompt_data in prompts:
            print(f"  {prompt_data['number']:2d}. {prompt_data['style']}")
            print(f"      {prompt_data['prompt']}")
            print()

if __name__ == "__main__":
    test_willow()