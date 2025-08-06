@echo off
echo Creating folder structure for world builder tiles...

REM Create main category folders
mkdir "client\assets\world_builder\terrain" 2>nul
mkdir "client\assets\world_builder\shops" 2>nul
mkdir "client\assets\world_builder\buildings" 2>nul
mkdir "client\assets\world_builder\trees" 2>nul
mkdir "client\assets\world_builder\rocks" 2>nul
mkdir "client\assets\world_builder\utilities" 2>nul
mkdir "client\assets\world_builder\decorations" 2>nul
mkdir "client\assets\world_builder\special" 2>nul

REM Create terrain subfolders
for %%t in (grass dirt stone cobblestone water sand mud snow ice lava) do (
    mkdir "client\assets\world_builder\terrain\%%t" 2>nul
)

REM Create shops subfolders
for %%t in (bank general_store magic_shop weapon_shop armor_shop food_shop rune_shop archery_shop) do (
    mkdir "client\assets\world_builder\shops\%%t" 2>nul
)

REM Create buildings subfolders
for %%t in (house house_small house_large castle tower_wizard church inn windmill lighthouse tent hut) do (
    mkdir "client\assets\world_builder\buildings\%%t" 2>nul
)

REM Create trees subfolders
for %%t in (tree_normal tree_oak tree_willow tree_maple tree_yew tree_magic tree_palm tree_dead tree_pine bush) do (
    mkdir "client\assets\world_builder\trees\%%t" 2>nul
)

REM Create rocks subfolders
for %%t in (rock_copper rock_tin rock_iron rock_coal rock_gold rock_mithril rock_adamant rock_rune rock_silver rock_gem) do (
    mkdir "client\assets\world_builder\rocks\%%t" 2>nul
)

REM Create utilities subfolders
for %%t in (furnace anvil altar spinning_wheel pottery_wheel loom cooking_range well chest) do (
    mkdir "client\assets\world_builder\utilities\%%t" 2>nul
)

REM Create decorations subfolders
for %%t in (fence_wood fence_stone gate_wood gate_metal statue bridge lamp_post fountain flower_bed) do (
    mkdir "client\assets\world_builder\decorations\%%t" 2>nul
)

REM Create special subfolders
for %%t in (fishing_spot portal teleport_pad quest_marker spawn_point) do (
    mkdir "client\assets\world_builder\special\%%t" 2>nul
)

echo.
echo Folder structure created!
echo.
echo Now you can organize your tile images:
echo 1. Move grass.png to terrain\grass\1.png
echo 2. Move grass2.png to terrain\grass\2.png
echo 3. And so on for each tile type...
echo.
echo Example move commands:
echo move "client\assets\world_builder\grass.png" "client\assets\world_builder\terrain\grass\1.png"
echo move "client\assets\world_builder\grass2.png" "client\assets\world_builder\terrain\grass\2.png"
echo.
pause