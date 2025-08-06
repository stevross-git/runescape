#!/usr/bin/env python3
"""
Test a single image generation to make sure it works
"""

from tile_image_generator_simple import TileImageGenerator

def test_single_generation():
    print("Testing Single Image Generation...")
    print("=" * 40)
    
    generator = TileImageGenerator()
    
    # Test with a simple prompt
    test_prompt = "Simple grass texture, green color, 16x16 pixel art"
    test_style = "Test Style"
    
    print(f"Testing generation with prompt: {test_prompt}")
    
    # Generate one test image
    image_data = generator.generate_image(test_prompt, test_style)
    
    if image_data:
        print(f"SUCCESS: Generated {len(image_data)} bytes of image data")
        print("Image generation is working!")
        
        # Save to a test location
        test_path = "test_image.png"
        try:
            with open(test_path, 'wb') as f:
                f.write(image_data)
            print(f"Saved test image to: {test_path}")
        except Exception as e:
            print(f"Error saving test image: {e}")
    else:
        print("FAILED: Could not generate image")

if __name__ == "__main__":
    test_single_generation()