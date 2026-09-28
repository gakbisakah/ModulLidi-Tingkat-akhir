import os
import json
import shutil
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Website.settings')
django.setup()

from Website.models import MotifForm1

def register_motif():
    user = 'riskia'
    session = 'geometric_pro'
    base_media = os.path.join('media', user)
    if not os.path.exists(base_media):
        os.makedirs(base_media)
        
    slice_dir = os.path.join('media', 'motif_awal', 'slices')
    if not os.path.exists(slice_dir):
        os.makedirs(slice_dir)
        
    pro_dir = 'geometric_motif_pro'
    files = sorted([f for f in os.listdir(pro_dir) if f.startswith('motif_lidi_')])
    
    relative_slices = []
    for f in files:
        src = os.path.join(pro_dir, f)
        dst_name = f"pro_{f}"
        dst = os.path.join(slice_dir, dst_name)
        shutil.copy(src, dst)
        relative_slices.append(f"motif_awal/slices/{dst_name}")
        
    preview_src = os.path.join(pro_dir, "full_motif_preview.png")
    preview_dst_name = "pro_preview.png"
    preview_dst = os.path.join(base_media, preview_dst_name)
    shutil.copy(preview_src, preview_dst)
    
    urutan = ",".join([f"LIDI_{i+1}" for i in range(len(files))])
    
    motif = MotifForm1.objects.create(
        user=user,
        imgBefore=f"/media/{user}/{preview_dst_name}",
        imgAfter=f"/media/{user}/{preview_dst_name}",
        urutanLidi=urutan,
        slice=json.dumps(relative_slices)
    )
    print(f"CREATED_ID:{motif.id}")

if __name__ == "__main__":
    register_motif()
