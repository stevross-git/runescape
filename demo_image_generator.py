#!/usr/bin/env python3
"""
Demo script to show the image generator working
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the generator class
sys.path.append('.')
from tile_image_generator_simple import TileImageGenerator

def demo():
    print("RuneScape Tile Image Generator - Demo")
    print("=" * 40)
    
    generator = TileImageGenerator()
    
    # Demo with grass prompts (which has 9/10 images)
    grass_file = "terrain/grass/prompts.txt"
    
    print(f"\nDemonstrating with: {grass_file}")
    
    # Load prompts
    prompts = generator.load_prompts(grass_file)
    
    if prompts:
        print(f"\nFound {len(prompts)} prompts:")
        for i, prompt_data in enumerate(prompts, 1):
            print(f"  {i:2d}. {prompt_data['style']}")
            print(f"      Prompt: {prompt_data['prompt'][:80]}...")
            print()
        
        # Check existing images
        existing = generator.check_existing_images(grass_file)
        print(f"Existing images: {existing}")
        missing = [i for i in range(1, 11) if i not in existing]
        print(f"Missing images: {missing}")
        
        if missing:
            print(f"\nTo generate missing image #{missing[0]}, the system would:")
            missing_prompt = next(p for p in prompts if p['number'] == missing[0])
            print(f"1. Use prompt: {missing_prompt['prompt']}")
            print(f"2. Generate with DALL-E 3")
            print(f"3. Save as: client/assets/world_builder/terrain/grass/{missing[0]}.png")
    
    print("\nDemo complete! Run 'python tile_image_generator_simple.py' for interactive mode.")

if __name__ == "__main__":
    demo()