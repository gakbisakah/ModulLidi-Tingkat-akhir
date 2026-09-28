# Solusi: Menyimpan Hasil Pewarnaan Otomatis ke Database

## Masalah yang Ditemukan
Hasil pewarnaan otomatis (automatic coloring) hanya tersimpan di:
- ✗ File sistem: `static/ColoringFile/output/`
- ✗ Cache Django (bersifat temporer)
- ✗ Session (hilang saat user logout)  

**Hasil pewarnaan TIDAK disimpan ke database.**

## Solusi yang Diimplementasikan

### 1. Fungsi Baru: `save_colored_result_to_db()`
**Lokasi:** `Website/views.py` (sebelum `coloring_view`)

```python
def save_colored_result_to_db(task_result, selected_motif_id, selected_ulos_type, user):
    """Menyimpan hasil pewarnaan otomatis ke database"""
```

**Fungsi ini:**
- Menerima hasil pewarnaan dari cache (task_result)
- Mengekstrak informasi: URL gambar, warna yang digunakan, analisis skema warna, score optimasi
- **Membuat record baru di tabel `MotifForm1`** dengan:
  - `imgBefore`: Gambar asli
  - `imgAfter`: Gambar hasil pewarnaan
  - `urutanLidi`: Kode warna yang digunakan (dipisahkan comma)
  - `jenisGenerate`: "automatic_coloring" (tipe khusus untuk membedakan dari manual)
  - `jenisKain`: Jenis Ulos yang dipilih
  - `jenisProduk`: JSON dengan analisis warna dan score
  - `user`: Username yang melakukan pewarnaan

### 2. Update: `coloring_view()` 
**Lokasi:** `Website/views.py` line ~1945

**Perubahan:**
- Menyimpan metadata pewarnaan di cache dengan key `{task_id}_metadata`
- Metadata berisi:
  - `selected_motif_id`: ID motif yang digunakan
  - `selected_ulos_type`: Jenis Ulos (Batak, Timor, dll)
  - `user`: Username yang melakukan aksi

```python
cache.set(f"{task_id}_metadata", {
    'selected_motif_id': selected_motif_id,
    'selected_ulos_type': selected_ulos_type,
    'user': request.user.username if request.user.is_authenticated else "admin"
}, timeout=3600)
```

### 3. Update: `get_progress_view()`
**Lokasi:** `Website/views.py` line ~2020

**Perubahan:**
- Mengambil metadata dari cache
- **Otomatis menyimpan hasil ke database** saat status = 'Completed'
- Mengembalikan `database_id` di response JSON

```python
metadata = cache.get(f"{task_id}_metadata")
if metadata:
    motif_db_id = save_colored_result_to_db(
        task_result, 
        metadata.get('selected_motif_id'),
        metadata.get('selected_ulos_type'),
        metadata.get('user')
    )
    task_result['database_id'] = motif_db_id
```

## Cara Kerja Alur Pewarnaan Otomatis

```
1. User memilih jenis Ulos, motif, dan warna
   ↓
2. coloring_view() dikirim request
   - Simpan metadata ke cache dengan task_id
   ↓
3. main_coloring_process() berjalan di thread terpisah
   - Proses pewarnaan
   - Simpan hasil ke cache task_result
   ↓
4. Frontend polling ke get_progress_view(task_id)
   - Mengambil task_result dari cache
   - Menemukan status = 'Completed'
   - Ambil metadata dari cache
   - SIMPAN KE DATABASE via save_colored_result_to_db()
   ↓
5. Database MotifForm1 sekarang berisi hasil pewarnaan!
```

## Database Schema di MotifForm1

Hasil pewarnaan disimpan dengan struktur:

```
MotifForm1
├── imgBefore: "/static/img/motifs/batak/motif_1.png"
├── imgAfter: "/static/ColoringFile/output/colored_ulos_batak.png"
├── urutanLidi: "K1,K2,K5,K3" (kode warna yang digunakan)
├── jenisGenerate: "automatic_coloring"
├── jmlBaris: "Batak" (jenis Ulos)
├── user: "admin"
├── jenisKain: "Batak"
├── jenisProduk: '{"scheme_type": "...", "scores": {...}}'
└── time: AUTO_NOW_ADD
```

## Penjelasan Field:

| Field | Isi | Contoh |
|-------|-----|--------|
| `imgBefore` | Gambar motif asli | `/static/img/motifs/batak/motif_1.png` |
| `imgAfter` | Gambar hasil pewarnaan | `/static/ColoringFile/output/colored_ulos_batak.png` |
| `urutanLidi` | Daftar kode warna yang digunakan | `K1,K2,K5,K3` |
| `jenisGenerate` | **"automatic_coloring"** | untuk membedakan dari manual |
| `jmlBaris` | Jenis Ulos yang digunakan | `Batak`, `Timor`, dll |
| `jenisKain` | Jenis Ulos (duplikat) | `Batak` |
| `jenisProduk` | JSON: analisis warna & score | `{"scheme_type": "monochromatic", "scores": {...}}` |

## Keuntungan Solusi Ini

✅ Hasil pewarnaan **otomatis tersimpan ke database**  
✅ User bisa **melihat riwayat pewarnaan** mereka  
✅ Admin bisa **menganalisis pewarnaan mana yang paling sering digunakan**  
✅ Data **tidak hilang** saat cache expired  
✅ Kompatibel dengan **fungsi download/export yang sudah ada**  
✅ Field `jenisGenerate="automatic_coloring"` memudahkan **membedakan tipe motif**

## Testing

Untuk memastikan bekerja dengan baik:

```python
# Query hasil pewarnaan otomatis
from Website.models import MotifForm1

colored_results = MotifForm1.objects.filter(jenisGenerate="automatic_coloring")
print(f"Total pewarnaan otomatis: {colored_results.count()}")

for result in colored_results:
    print(f"ID: {result.id}, User: {result.user}, Ulos: {result.jenisKain}")
    print(f"Warna: {result.urutanLidi}")
    print(f"Analisis: {result.jenisProduk}\n")
```

## Catatan Penting

1. **Cache Dependency**: Solusi ini bergantung pada cache Django. Pastikan cache sudah dikonfigurasi di `settings.py`
2. **Metadata Cleanup**: Metadata akan otomatis dihapus setelah 1 jam (timeout=3600)
3. **File Path**: Pastikan path gambar benar, sesuaikan dengan struktur `MEDIA_ROOT` dan `STATIC_ROOT` di settings
