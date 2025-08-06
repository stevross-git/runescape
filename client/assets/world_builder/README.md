# World Builder Tile Organization Guide

## 📁 Folder Structure

The world builder now uses an organized folder structure for tile images:

```
assets/world_builder/
├── terrain/
│   ├── grass/
│   │   ├── 1.png
│   │   ├── 2.png
│   │   ├── 3.png
│   │   └── ...up to 10.png
│   ├── dirt/
│   │   ├── 1.png
│   │   ├── 2.png
│   │   └── ...
│   ├── stone/
│   ├── water/
│   └── ...
├── shops/
│   ├── bank/
│   │   ├── 1.png
│   │   ├── 2.png
│   │   └── ...
│   ├── general_store/
│   └── ...
├── buildings/
│   ├── house/
│   ├── castle/
│   └── ...
├── trees/
│   ├── tree_oak/
│   ├── tree_willow/
│   └── ...
├── rocks/
│   ├── rock_iron/
│   ├── rock_gold/
│   └── ...
├── utilities/
│   ├── furnace/
│   ├── anvil/
│   └── ...
├── decorations/
│   ├── fence_wood/
│   ├── statue/
│   └── ...
└── special/
    ├── fishing_spot/
    ├── portal/
    └── ...
```

## 🎨 Categories

### Terrain
Basic ground tiles: grass, dirt, stone, cobblestone, water, sand, mud, snow, ice, lava

### Shops
Commercial buildings: bank, general_store, magic_shop, weapon_shop, armor_shop, food_shop, rune_shop, archery_shop

### Buildings
Residential and special structures: house, house_small, house_large, castle, tower_wizard, church, inn, windmill, lighthouse, tent, hut

### Trees
Vegetation: tree_normal, tree_oak, tree_willow, tree_maple, tree_yew, tree_magic, tree_palm, tree_dead, tree_pine, bush

### Rocks
Mining resources: rock_copper, rock_tin, rock_iron, rock_coal, rock_gold, rock_mithril, rock_adamant, rock_rune, rock_silver, rock_gem

### Utilities
Crafting stations: furnace, anvil, altar, spinning_wheel, pottery_wheel, loom, cooking_range, well, chest

### Decorations
Environmental objects: fence_wood, fence_stone, gate_wood, gate_metal, statue, bridge, lamp_post, fountain, flower_bed

### Special
Interactive elements: fishing_spot, portal, teleport_pad, quest_marker, spawn_point

## 📝 Adding New Tiles

1. Choose the appropriate category folder
2. Create a new folder with the tile name
3. Add numbered PNG files (1.png, 2.png, etc.)
4. Up to 10 variants per tile are supported

## 🔄 Backward Compatibility

The system will automatically check the old location (`assets/world_builder/tilename.png`) if no organized images are found, ensuring existing tiles continue to work.

## 💡 Best Practices

- Keep images at consistent sizes (16x16 or 32x32 recommended)
- Use transparent backgrounds for objects
- Number variants logically (1 = most common, higher = rarer)
- Group similar tiles in the same category