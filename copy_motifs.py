import os
import shutil

def move_motifs():
    src_dir = 'geometric_motif_pro'
    dst_dir = os.path.join('static', 'img', 'motifs', 'geometric')
    
    if not os.path.exists(dst_dir):
        os.makedirs(dst_dir)
        print(f"Created directory: {dst_dir}")
        
    if not os.path.exists(src_dir):
        print(f"Source directory {src_dir} not found.")
        return

    files = [f for f in os.listdir(src_dir) if f.startswith('motif_lidi_')]
    for f in files:
        src_path = os.path.join(src_dir, f)
        dst_path = os.path.join(dst_dir, f)
        shutil.copy2(src_path, dst_path)
        print(f"Copied {f} to {dst_dir}")

if __name__ == "__main__":
    move_motifs()
