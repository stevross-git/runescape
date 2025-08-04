from PIL import Image
import os

def make_white_transparent(image_path):
    """Convert white backgrounds to transparent in an image"""
    try:
        # Open the image
        img = Image.open(image_path)
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Get image data
        data = img.getdata()
        
        # Create new data with white pixels made transparent
        new_data = []
        for item in data:
            # If pixel is white or near-white, make it transparent
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0))  # Transparent
            else:
                new_data.append(item)  # Keep original
        
        # Create new image with transparent background
        img.putdata(new_data)
        
        # Save the image
        img.save(image_path, 'PNG')
        print(f"Fixed transparency for: {os.path.basename(image_path)}")
        
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

def fix_all_building_images():
    """Fix transparency for all building images"""
    buildings_dir = 'client/assets/buildings'
    
    if not os.path.exists(buildings_dir):
        print(f"Buildings directory not found: {buildings_dir}")
        return
    
    print("Fixing transparency for building images...")
    
    for filename in os.listdir(buildings_dir):
        if filename.endswith('.png'):
            image_path = os.path.join(buildings_dir, filename)
            make_white_transparent(image_path)
    
    print("Done! All building images should now have transparent backgrounds.")
    print("Refresh your browser to see the changes.")

if __name__ == "__main__":
    fix_all_building_images()