from PIL import Image, ImageDraw
import os

def create_hd_motif(size=128):
    # Create image with transparency
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Coordinates for diamond (rhombus)
    # Touching edges
    center = size // 2
    points = [
        (center, 0),          # Top
        (size - 1, center),   # Right
        (center, size - 1),   # Bottom
        (0, center)           # Left
    ]
    
    # Fill diamond with black
    draw.polygon(points, fill=(0, 0, 0, 255))
    
    # Draw white cross in center
    # Cross thickness: 1/8 of size
    thickness = size // 8
    half_thick = thickness // 2
    
    # Vertical bar
    draw.rectangle([center - half_thick, center - thickness*2, center + half_thick, center + thickness*2], fill=(255, 255, 255, 255))
    # Horizontal bar
    draw.rectangle([center - thickness*2, center - half_thick, center + thickness*2, center + half_thick], fill=(255, 255, 255, 255))
    
    return img

output_dir = r"c:\Users\Lenovo\Downloads\TA-Ditenun15\DiTenun-TA15\editor-ui\public\assets\hd_motifs"
os.makedirs(output_dir, exist_ok=True)

# Generate 16 separate motif layers
# They overlap slightly, so let's say they share the edge pixel
motif = create_hd_motif(128)

for i in range(1, 17):
    filename = f"Motif_HD_{i:02d}.png"
    filepath = os.path.join(output_dir, filename)
    motif.save(filepath)

# Create a combined continuous preview
# 16 motifs side-by-side with 1-pixel overlap
canvas_width = 128 + (127 * 15)
canvas = Image.new('RGBA', (canvas_width, 128), (255, 255, 255, 255)) # White background as requested

for i in range(16):
    # Paste overlapping by 1 pixel if they were designed to share edges
    # For a diamond to chain, the right point of one should overlap with left point of next
    x_pos = i * 127
    canvas.alpha_composite(motif, (x_pos, 0))

canvas.save(os.path.join(output_dir, "Motif_HD_Chain_Preview.png"))
print(f"Successfully generated 16 HD motifs and a combined chain preview at {output_dir}")
