#!/usr/bin/env python3
"""
RuneScape Tile Image Generator - Simple Version
================================================

Interactive Python application for generating tile images using OpenAI DALL-E.
Automatically reads prompt files and generates images with proper naming and folder structure.

Features:
- Browse and select prompt files
- Generate images one-by-one or in batches
- Auto-save with correct naming (1.png, 2.png, etc.)
- Progress tracking and error handling

Usage:
    python tile_image_generator_simple.py
"""

import os
import sys
import time
import json
import requests
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dotenv import load_dotenv

class TileImageGenerator:
    def __init__(self):
        self.api_key = None
        self.base_path = Path("client/assets/world_builder")
        
        # Load environment variables - prioritize .env file over system environment
        env_path = Path('.env')
        print(f"Looking for .env file at: {env_path.absolute()}")
        
        if env_path.exists():
            print("Found .env file, loading with override=True...")
            load_dotenv(env_path, override=True)  # This will override system env vars
        else:
            print("No .env file found, trying default load_dotenv()...")
            load_dotenv()
        
        self.api_key = os.getenv('OPENAI_API_KEY')
        
        if not self.api_key:
            print("ERROR: No OpenAI API key found in .env file!")
            print("Please add OPENAI_API_KEY=your_key_here to your .env file")
            print(f"Current working directory: {os.getcwd()}")
            sys.exit(1)
        
        print(f"OK: Loaded API key: {self.api_key[:10]}...")
        
        # Verify the key format
        if not self.api_key.startswith('sk-'):
            print("WARNING: API key doesn't start with 'sk-', this might be incorrect")
        
        if len(self.api_key) < 20:
            print("WARNING: API key seems too short, this might be incorrect")
        
    def scan_prompt_files(self) -> Dict[str, List[str]]:
        """Scan for all prompts.txt files in the tile structure"""
        prompt_files = {}
        
        if not self.base_path.exists():
            print(f"ERROR: Base path not found: {self.base_path}")
            return prompt_files
            
        # Walk through all directories
        for category_dir in self.base_path.iterdir():
            if category_dir.is_dir() and not category_dir.name.startswith('.'):
                category_files = []
                
                for tile_dir in category_dir.iterdir():
                    if tile_dir.is_dir():
                        prompt_file = tile_dir / "prompts.txt"
                        if prompt_file.exists():
                            category_files.append(str(prompt_file.relative_to(self.base_path)))
                
                if category_files:
                    prompt_files[category_dir.name] = sorted(category_files)
        
        return prompt_files
    
    def load_prompts(self, prompt_file_path: str) -> List[Dict[str, str]]:
        """Load and parse prompts from a file"""
        full_path = self.base_path / prompt_file_path
        
        if not full_path.exists():
            print(f"ERROR: Prompt file not found: {full_path}")
            return []
        
        prompts = []
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Parse prompts - handle both long and short formats
            lines = content.split('\n')
            current_style = None
            current_number = None
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Check if line starts with a number
                if line and line[0].isdigit() and '. ' in line and ':' in line:
                    try:
                        # Split on first colon - handle case where there might be nothing after colon
                        colon_parts = line.split(': ', 1)
                        before_colon = colon_parts[0]
                        after_colon = colon_parts[1] if len(colon_parts) > 1 else ""
                        
                        # Extract number and style from before colon
                        if '. ' in before_colon:
                            number_str, style_name = before_colon.split('. ', 1)
                            current_number = int(number_str)
                            current_style = style_name
                            
                            # Check if this is a short format (prompt on same line)
                            if after_colon and after_colon.strip():
                                # Short format - prompt is right after colon
                                prompts.append({
                                    'style': current_style,
                                    'prompt': after_colon.strip(),
                                    'number': current_number
                                })
                                current_style = None
                                current_number = None
                            # else: Long format - prompt will be on next line in quotes
                            
                    except Exception as e:
                        print(f"WARNING: Error parsing line: {line[:50]}... - {e}")
                        continue
                
                # Check if line is a quoted prompt (long format)
                elif line.startswith('"') and line.endswith('"') and current_style and current_number:
                    prompt_text = line[1:-1]  # Remove quotes
                    prompts.append({
                        'style': current_style,
                        'prompt': prompt_text,
                        'number': current_number
                    })
                    current_style = None
                    current_number = None
        
        except Exception as e:
            print(f"ERROR: Error reading prompt file: {e}")
            return []
        
        print(f"INFO: Loaded {len(prompts)} prompts from {prompt_file_path}")
        return prompts
    
    def generate_image(self, prompt: str, style: str) -> Optional[bytes]:
        """Generate a single image using OpenAI DALL-E"""
        try:
            # Enhance prompt for better results
            enhanced_prompt = f"{prompt}, transparent background, 16x16 pixel art, top-down view, video game tile, high quality"
            
            print(f"GENERATING: {style}")
            print(f"PROMPT: {enhanced_prompt[:100]}...")
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'model': 'dall-e-3',
                'prompt': enhanced_prompt,
                'size': '1024x1024',
                'quality': 'standard',
                'n': 1
            }
            
            response = requests.post(
                'https://api.openai.com/v1/images/generations',
                headers=headers,
                json=data,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                image_url = result['data'][0]['url']
                
                # Download the image
                img_response = requests.get(image_url, timeout=30)
                if img_response.status_code == 200:
                    print("SUCCESS: Image generated successfully!")
                    return img_response.content
                else:
                    print(f"ERROR: Failed to download image: {img_response.status_code}")
                    
            else:
                print(f"ERROR: DALL-E API error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"ERROR: Error generating image: {e}")
            
        return None
    
    def save_image(self, image_data: bytes, tile_path: str, image_number: int) -> bool:
        """Save image to the correct location with proper naming"""
        try:
            # Get the directory containing the prompts.txt file
            prompt_file_path = self.base_path / tile_path
            tile_dir = prompt_file_path.parent
            
            # Create the filename (1.png, 2.png, etc.)
            filename = f"{image_number}.png"
            full_path = tile_dir / filename
            
            # Ensure directory exists
            tile_dir.mkdir(parents=True, exist_ok=True)
            
            # Save the image
            with open(full_path, 'wb') as f:
                f.write(image_data)
            
            print(f"SAVED: {full_path}")
            return True
            
        except Exception as e:
            print(f"ERROR: Error saving image: {e}")
            return False
    
    def check_existing_images(self, tile_path: str) -> List[int]:
        """Check which images already exist for a tile"""
        prompt_file_path = self.base_path / tile_path
        tile_dir = prompt_file_path.parent
        
        existing = []
        for i in range(1, 11):  # Check for 1.png through 10.png
            if (tile_dir / f"{i}.png").exists():
                existing.append(i)
        
        return existing

def main():
    """Simple interactive mode"""
    print("RuneScape Tile Image Generator")
    print("=" * 40)
    
    try:
        generator = TileImageGenerator()
        
        # Scan for available prompt files
        prompt_files = generator.scan_prompt_files()
        
        if not prompt_files:
            print("ERROR: No prompt files found!")
            return
        
        # Create a flat list of all files
        all_files = []
        for category, files in prompt_files.items():
            for file_path in files:
                all_files.append((category, file_path))
        
        print(f"\nFound {len(all_files)} prompt files:")
        
        # Display all files
        for i, (category, file_path) in enumerate(all_files, 1):
            tile_name = Path(file_path).parent.name
            existing = generator.check_existing_images(file_path)
            status = f"({len(existing)}/10)" if existing else "(0/10)"
            print(f"  {i:2d}. [{category}] {tile_name} {status}")
        
        # Get user selection
        while True:
            try:
                choice = input(f"\nSelect file number (1-{len(all_files)}) or 'q' to quit: ").strip()
                
                if choice.lower() == 'q':
                    print("Goodbye!")
                    return
                
                choice_num = int(choice)
                if 1 <= choice_num <= len(all_files):
                    category, selected_file = all_files[choice_num - 1]
                    break
                else:
                    print("ERROR: Invalid choice")
            except ValueError:
                print("ERROR: Please enter a valid number")
        
        # Load prompts for selected file
        prompts = generator.load_prompts(selected_file)
        
        if not prompts:
            print("ERROR: No prompts found in file!")
            return
        
        existing = generator.check_existing_images(selected_file)
        tile_name = Path(selected_file).parent.name
        
        print(f"\nGenerating images for: {tile_name}")
        print(f"Total prompts: {len(prompts)}")
        print(f"Existing images: {existing}")
        
        # Show generation options
        print("\nGeneration options:")
        print("1. Generate all missing images")
        print("2. Generate specific prompt numbers")
        print("3. Show prompts and exit")
        
        option = input("Choose option (1-3): ").strip()
        
        if option == '3':
            print(f"\nPrompts for {tile_name}:")
            for i, prompt_data in enumerate(prompts, 1):
                print(f"  {i:2d}. {prompt_data['style']}")
                print(f"      {prompt_data['prompt'][:80]}...")
            return
        
        to_generate = []
        
        if option == '1':
            # Generate missing
            to_generate = [p for p in prompts if p['number'] not in existing]
        elif option == '2':
            # Specific numbers
            print("Available prompts:")
            for prompt_data in prompts:
                status = "EXISTS" if prompt_data['number'] in existing else "MISSING"
                print(f"  {prompt_data['number']:2d}. {prompt_data['style']} ({status})")
            
            numbers_str = input("Enter prompt numbers (e.g., 1,3,5): ").strip()
            try:
                requested = [int(n.strip()) for n in numbers_str.split(',') if n.strip()]
                to_generate = [p for p in prompts if p['number'] in requested]
            except ValueError:
                print("ERROR: Invalid format")
                return
        else:
            print("ERROR: Invalid option")
            return
        
        if not to_generate:
            print("INFO: Nothing to generate!")
            return
        
        print(f"\nWill generate {len(to_generate)} images...")
        for prompt_data in to_generate:
            print(f"  {prompt_data['number']}. {prompt_data['style']}")
        
        confirm = input("Continue? (y/N): ").strip().lower()
        
        if confirm != 'y':
            print("Cancelled")
            return
        
        # Generate images
        success_count = 0
        for i, prompt_data in enumerate(to_generate, 1):
            print(f"\n[{i}/{len(to_generate)}] Generating {prompt_data['style']}...")
            
            image_data = generator.generate_image(prompt_data['prompt'], prompt_data['style'])
            
            if image_data:
                if generator.save_image(image_data, selected_file, prompt_data['number']):
                    success_count += 1
                    print(f"SUCCESS: Completed {success_count}/{i}")
                else:
                    print("ERROR: Failed to save image")
            else:
                print("ERROR: Failed to generate image")
            
            # Rate limiting delay
            if i < len(to_generate):
                print("Waiting 5 seconds...")
                time.sleep(5)
        
        print(f"\nCOMPLETE: Generated {success_count}/{len(to_generate)} images")
        
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"\nFATAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()