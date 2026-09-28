import os
from PIL import Image, ImageDraw

def create_pro_motif_unit(height=1000, width=120, stroke=6):
    """
    Generates a pixel-perfect traditional geometric motif unit (lidi).
    Matches the reference: Large hollow diamonds at ends, technical middle section.
    """
    # Use white background, 1000px height for high precision
    img = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(img)
    
    cx = width // 2
    
    def draw_hollow_diamond(x, y, size, s):
        half = size // 2
        # Outer
        draw.polygon([
            (x, y - half), (x + half, y), (x, y + half), (x - half, y)
        ], fill='black')
        # Inner (white)
        inner_half = half - s
        if inner_half > 0:
            draw.polygon([
                (x, y - inner_half), (x + inner_half, y), (x, y + inner_half), (x - inner_half, y)
            ], fill='white')

    def draw_solid_block(x, y, w, h):
        draw.rectangle([x - w//2, y - h//2, x + w//2, y + h//2], fill='black')

    # 1. Top Section
    draw_hollow_diamond(cx, 80, 70, stroke)
    draw_solid_block(cx, 130, stroke, 40)

    # 2. Middle Repeating Section (Technical and Geometric)
    start_y = 180
    end_y = 820
    step = 50
    for y in range(start_y, end_y, step):
        # Center block
        draw_solid_block(cx, y, 24, 24)
        # Vertical connector
        if y + step < end_y:
            draw_solid_block(cx, y + step//2, stroke, step - 24)
        
        # Horizontal "wings"
        draw_solid_block(cx - 30, y, 20, stroke)
        draw_solid_block(cx + 30, y, 20, stroke)

    # 3. Bottom Section
    draw_solid_block(cx, 870, stroke, 40)
    draw_hollow_diamond(cx, 920, 70, stroke)
    
    return img

def generate_pro_set(count=12, output_folder='geometric_motif_pro'):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    height, width = 1000, 120
    slices_paths = []
    
    print(f"[*] Generating {count} high-precision motifs...")
    for i in range(count):
        motif = create_pro_motif_unit(height, width)
        filename = f"motif_lidi_{i+1:02d}.png"
        path = os.path.join(output_folder, filename)
        motif.save(path)
        slices_paths.append(path)
        
    # Combine for preview
    preview = Image.new('RGB', (width * count, height), 'white')
    for i, path in enumerate(slices_paths):
        img_slice = Image.open(path)
        preview.paste(img_slice, (i * width, 0))
    
    preview_path = os.path.join(output_folder, "full_motif_preview.png")
    preview.save(preview_path)
    print(f"[+] Successfully generated. Preview: {preview_path}")

if __name__ == "__main__":
    generate_pro_set()
