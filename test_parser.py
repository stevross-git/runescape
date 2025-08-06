#!/usr/bin/env python3
"""
Test the updated prompt parser
"""

from tile_image_generator_simple import TileImageGenerator

def test_parsing():
    generator = TileImageGenerator()
    
    print("Testing tree_willow (short format):")
    prompts = generator.load_prompts("trees/tree_willow/prompts.txt")
    
    if prompts:
        print(f"SUCCESS: Loaded {len(prompts)} prompts")
        for i, prompt_data in enumerate(prompts[:3], 1):  # Show first 3
            print(f"  {i}. {prompt_data['style']}: {prompt_data['prompt'][:60]}...")
    else:
        print("FAILED: No prompts loaded")
    
    print("\nTesting rock_iron (long format):")
    prompts2 = generator.load_prompts("rocks/rock_iron/prompts.txt")
    
    if prompts2:
        print(f"SUCCESS: Loaded {len(prompts2)} prompts")
        for i, prompt_data in enumerate(prompts2[:3], 1):  # Show first 3
            print(f"  {i}. {prompt_data['style']}: {prompt_data['prompt'][:60]}...")
    else:
        print("FAILED: No prompts loaded")

if __name__ == "__main__":
    test_parsing()