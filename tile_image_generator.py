#!/usr/bin/env python3
"""
RuneScape Tile Image Generator
===============================

Interactive Python application for generating tile images using OpenAI DALL-E.
Automatically reads prompt files and generates images with proper naming and folder structure.

Features:
- Browse and select prompt files
- Generate images one-by-one or in batches
- Auto-save with correct naming (1.png, 2.png, etc.)
- Progress tracking and error handling
- Resume interrupted sessions

Usage:
    python tile_image_generator.py
"""

import os
import sys
import time
import json
import requests
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dotenv import load_dotenv

# Try to import tkinter for GUI
try:
    import tkinter as tk
    from tkinter import ttk, filedialog, messagebox, scrolledtext
    GUI_AVAILABLE = True
except ImportError:
    GUI_AVAILABLE = False
    print("⚠️ tkinter not available, running in console mode")

class TileImageGenerator:
    def __init__(self):
        self.api_key = None
        self.base_path = Path("client/assets/world_builder")
        self.current_prompts = []
        self.current_tile_path = None
        self.generated_count = 0
        self.total_prompts = 0
        
        # Load environment variables
        load_dotenv()
        self.api_key = os.getenv('OPENAI_API_KEY')
        
        if not self.api_key:
            print("[ERROR] No OpenAI API key found in .env file!")
            print("Please add OPENAI_API_KEY=your_key_here to your .env file")
            sys.exit(1)
        
        print(f"[OK] Loaded API key: {self.api_key[:10]}...")
        
    def scan_prompt_files(self) -> Dict[str, List[str]]:
        """Scan for all prompts.txt files in the tile structure"""
        prompt_files = {}
        
        if not self.base_path.exists():
            print(f"❌ Base path not found: {self.base_path}")
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
            print(f"❌ Prompt file not found: {full_path}")
            return []
        
        prompts = []
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Parse the prompts (format: "1. Style Name: "Prompt text"")
            lines = content.split('\n')
            current_prompt = None
            current_style = None
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Check if line starts with a number (new prompt)
                if line and line[0].isdigit() and '. ' in line:
                    # Extract style and prompt
                    try:
                        # Split on first colon to get style
                        parts = line.split(': ', 1)
                        if len(parts) == 2:
                            style_part = parts[0]  # "1. Japanese Style (Country)"
                            prompt_part = parts[1].strip('"')  # Remove quotes
                            
                            # Extract just the style name
                            style_name = style_part.split('. ', 1)[1] if '. ' in style_part else style_part
                            
                            prompts.append({
                                'style': style_name,
                                'prompt': prompt_part,
                                'number': len(prompts) + 1
                            })
                    except Exception as e:
                        print(f"⚠️ Error parsing line: {line[:50]}... - {e}")
                        continue
        
        except Exception as e:
            print(f"❌ Error reading prompt file: {e}")
            return []
        
        print(f"📚 Loaded {len(prompts)} prompts from {prompt_file_path}")
        return prompts
    
    def generate_image(self, prompt: str, style: str) -> Optional[bytes]:
        """Generate a single image using OpenAI DALL-E"""
        try:
            # Enhance prompt for better results
            enhanced_prompt = f"{prompt}, transparent background, 16x16 pixel art, top-down view, video game tile, high quality"
            
            print(f"🎨 Generating: {style}")
            print(f"📝 Prompt: {enhanced_prompt[:100]}...")
            
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
                    print("✅ Image generated successfully!")
                    return img_response.content
                else:
                    print(f"❌ Failed to download image: {img_response.status_code}")
                    
            else:
                print(f"❌ DALL-E API error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error generating image: {e}")
            
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
            
            print(f"💾 Saved: {full_path}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving image: {e}")
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

class ConsoleInterface:
    def __init__(self, generator: TileImageGenerator):
        self.generator = generator
    
    def run(self):
        """Run the console interface"""
        print("\n🎨 RuneScape Tile Image Generator")
        print("=" * 50)
        
        while True:
            print("\n📋 Main Menu:")
            print("1. 📁 Browse prompt files")
            print("2. 🎯 Generate from specific file")
            print("3. 🔄 Batch generate all missing images")
            print("4. 📊 Show statistics")
            print("5. ❌ Exit")
            
            choice = input("\nSelect option (1-5): ").strip()
            
            if choice == '1':
                self.browse_files()
            elif choice == '2':
                self.generate_from_file()
            elif choice == '3':
                self.batch_generate()
            elif choice == '4':
                self.show_statistics()
            elif choice == '5':
                print("👋 Goodbye!")
                break
            else:
                print("❌ Invalid choice, please try again")
    
    def browse_files(self):
        """Browse available prompt files"""
        prompt_files = self.generator.scan_prompt_files()
        
        if not prompt_files:
            print("❌ No prompt files found!")
            return
        
        print(f"\n📚 Found {sum(len(files) for files in prompt_files.values())} prompt files:")
        
        for category, files in prompt_files.items():
            print(f"\n📁 {category.upper()} ({len(files)} files):")
            for i, file_path in enumerate(files, 1):
                tile_name = Path(file_path).parent.name
                existing = self.generator.check_existing_images(file_path)
                status = f"({len(existing)}/10 images)" if existing else "(no images)"
                print(f"  {i:2d}. {tile_name} {status}")
    
    def generate_from_file(self):
        """Generate images from a specific prompt file"""
        prompt_files = self.generator.scan_prompt_files()
        
        if not prompt_files:
            print("❌ No prompt files found!")
            return
        
        # Create a flat list of all files
        all_files = []
        for category, files in prompt_files.items():
            for file_path in files:
                all_files.append((category, file_path))
        
        print(f"\n📚 Select prompt file (1-{len(all_files)}):")
        for i, (category, file_path) in enumerate(all_files, 1):
            tile_name = Path(file_path).parent.name
            existing = self.generator.check_existing_images(file_path)
            status = f"({len(existing)}/10)" if existing else "(0/10)"
            print(f"  {i:2d}. [{category}] {tile_name} {status}")
        
        try:
            choice = int(input("\nEnter file number: ").strip())
            if 1 <= choice <= len(all_files):
                category, selected_file = all_files[choice - 1]
                self.generate_images_for_file(selected_file)
            else:
                print("❌ Invalid choice")
        except ValueError:
            print("❌ Please enter a valid number")
    
    def generate_images_for_file(self, file_path: str):
        """Generate images for a specific file"""
        prompts = self.generator.load_prompts(file_path)
        
        if not prompts:
            print("❌ No prompts found in file!")
            return
        
        existing = self.generator.check_existing_images(file_path)
        tile_name = Path(file_path).parent.name
        
        print(f"\n🎯 Generating images for: {tile_name}")
        print(f"📊 Total prompts: {len(prompts)}")
        print(f"✅ Existing images: {existing}")
        
        # Ask which prompts to generate
        print("\n📋 Generation options:")
        print("1. Generate all missing images")
        print("2. Generate specific prompt numbers")
        print("3. Regenerate existing images")
        
        option = input("Choose option (1-3): ").strip()
        
        to_generate = []
        
        if option == '1':
            # Generate missing
            to_generate = [p for p in prompts if p['number'] not in existing]
        elif option == '2':
            # Specific numbers
            numbers_str = input("Enter prompt numbers (e.g., 1,3,5): ").strip()
            try:
                requested = [int(n.strip()) for n in numbers_str.split(',')]
                to_generate = [p for p in prompts if p['number'] in requested]
            except ValueError:
                print("❌ Invalid format")
                return
        elif option == '3':
            # Regenerate existing
            to_generate = [p for p in prompts if p['number'] in existing]
        else:
            print("❌ Invalid option")
            return
        
        if not to_generate:
            print("🎉 Nothing to generate!")
            return
        
        print(f"\n🚀 Will generate {len(to_generate)} images...")
        confirm = input("Continue? (y/N): ").strip().lower()
        
        if confirm != 'y':
            print("❌ Cancelled")
            return
        
        # Generate images
        success_count = 0
        for i, prompt_data in enumerate(to_generate, 1):
            print(f"\n[{i}/{len(to_generate)}] Generating {prompt_data['style']}...")
            
            image_data = self.generator.generate_image(prompt_data['prompt'], prompt_data['style'])
            
            if image_data:
                if self.generator.save_image(image_data, file_path, prompt_data['number']):
                    success_count += 1
                    print(f"✅ Success! ({success_count}/{i})")
                else:
                    print(f"❌ Failed to save image")
            else:
                print(f"❌ Failed to generate image")
            
            # Rate limiting delay
            if i < len(to_generate):
                print("⏱️ Waiting 5 seconds...")
                time.sleep(5)
        
        print(f"\n🎉 Complete! Generated {success_count}/{len(to_generate)} images")
    
    def batch_generate(self):
        """Generate all missing images across all files"""
        prompt_files = self.generator.scan_prompt_files()
        
        if not prompt_files:
            print("❌ No prompt files found!")
            return
        
        # Count missing images
        total_missing = 0
        file_status = []
        
        for category, files in prompt_files.items():
            for file_path in files:
                existing = self.generator.check_existing_images(file_path)
                missing = 10 - len(existing)
                if missing > 0:
                    total_missing += missing
                    file_status.append((file_path, missing))
        
        if total_missing == 0:
            print("🎉 All images already generated!")
            return
        
        print(f"\n📊 Batch Generation Summary:")
        print(f"📁 Files with missing images: {len(file_status)}")
        print(f"🎨 Total images to generate: {total_missing}")
        print(f"⏱️ Estimated time: {total_missing * 6} seconds")
        
        confirm = input(f"\nGenerate {total_missing} images? (y/N): ").strip().lower()
        if confirm != 'y':
            print("❌ Cancelled")
            return
        
        # Start batch generation
        total_success = 0
        for file_idx, (file_path, missing_count) in enumerate(file_status, 1):
            tile_name = Path(file_path).parent.name
            print(f"\n[{file_idx}/{len(file_status)}] Processing {tile_name}...")
            
            prompts = self.generator.load_prompts(file_path)
            existing = self.generator.check_existing_images(file_path)
            to_generate = [p for p in prompts if p['number'] not in existing]
            
            for prompt_data in to_generate:
                print(f"  🎨 {prompt_data['style']}...")
                
                image_data = self.generator.generate_image(prompt_data['prompt'], prompt_data['style'])
                if image_data and self.generator.save_image(image_data, file_path, prompt_data['number']):
                    total_success += 1
                    print(f"  ✅ Success! ({total_success}/{total_missing})")
                
                time.sleep(5)  # Rate limiting
        
        print(f"\n🎉 Batch complete! Generated {total_success}/{total_missing} images")
    
    def show_statistics(self):
        """Show generation statistics"""
        prompt_files = self.generator.scan_prompt_files()
        
        if not prompt_files:
            print("❌ No prompt files found!")
            return
        
        total_files = 0
        total_images = 0
        complete_files = 0
        
        print(f"\n📊 Generation Statistics:")
        print("=" * 50)
        
        for category, files in prompt_files.items():
            category_images = 0
            category_complete = 0
            
            print(f"\n📁 {category.upper()}:")
            
            for file_path in files:
                existing = self.generator.check_existing_images(file_path)
                tile_name = Path(file_path).parent.name
                
                category_images += len(existing)
                total_images += len(existing)
                
                if len(existing) == 10:
                    category_complete += 1
                    complete_files += 1
                
                status = "✅ Complete" if len(existing) == 10 else f"⏳ {len(existing)}/10"
                print(f"  {tile_name:20} {status}")
            
            total_files += len(files)
            print(f"  📊 Category total: {category_images} images, {category_complete}/{len(files)} complete")
        
        print(f"\n🎯 Overall Summary:")
        print(f"📁 Total files: {total_files}")
        print(f"🎨 Total images: {total_images}")
        print(f"✅ Complete files: {complete_files}/{total_files}")
        print(f"📈 Progress: {(complete_files/total_files)*100:.1f}%")

def main():
    """Main entry point"""
    print("🎨 RuneScape Tile Image Generator")
    print("Initializing...")
    
    try:
        generator = TileImageGenerator()
        
        if GUI_AVAILABLE:
            # TODO: Implement GUI interface
            print("GUI mode not implemented yet, using console mode")
            interface = ConsoleInterface(generator)
        else:
            interface = ConsoleInterface(generator)
        
        interface.run()
        
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted by user")
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()