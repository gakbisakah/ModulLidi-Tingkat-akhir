# 📚 Panduan Mempelajari Source Code DiTenun-App

## 🎯 Gambaran Umum Proyek

**Nama Proyek**: DiTenun-App  
**Jenis**: Web Application untuk Generator Motif Tenun Tradisional  
**Tim Pengembang**:

- 11S20014 Lusye Triksi Pasaribu
- 11S20019 Hedrin S. Sitorus
- 11S20047 Greyssenly Ester Lya Simanjuntak

**Teknologi Utama**:

- Django 4.1.1 (Python Web Framework)
- Python 3.9.8
- Pillow 9.2.0 (Image Processing)
- OpenCV (Computer Vision)
- ACO-Pants (Ant Colony Optimization)

---

## 🏗️ Struktur Proyek

```
DiTenun-app/
├── Website/                 # Main Django Application
│   ├── models.py           # Database Models
│   ├── views.py            # View/Logic (2255 baris!)
│   ├── urls.py             # URL Routing
│   ├── settings.py         # Django Configuration
│   ├── CreateImageModule.py # Modul pembuat gambar motif
│   ├── MotifModule.py      # Modul handling motif
│   ├── Function.py         # Fungsi-fungsi algoritma pencarian
│   ├── ProcessImage.py     # Image processing utilities
│   ├── Coloring.py         # Modul pewarnaan motif
│   ├── SaveModule.py       # Modul penyimpanan data
│   ├── CheckModule.py      # Validasi/Check logic
│   ├── deleteModule.py     # Modul penghapusan
│   ├── zipModule.py        # Modul kompres/ZIP
│   ├── management/         # Django management commands
│   ├── migrations/         # Database migrations
│   └── templates/          # HTML Templates
├── templates/              # Global templates
│   ├── home.html          # Halaman generator motif
│   ├── login.html         # Halaman login
│   ├── pewarnaan.html     # Halaman pewarnaan
│   ├── gabung-motif.html  # Halaman gabung motif
│   └── ... (18 template lainnya)
├── static/                # CSS, JS, Images
│   ├── style.css
│   ├── pewarnaan.js
│   ├── script.js
│   └── css/, img/, video/
├── media/                 # Generated images & user uploads
│   ├── motif_awal/
│   ├── slices/
│   ├── grids/
│   ├── colored_motifs/
│   ├── combined_motifs/
│   └── uploads/
├── manage.py             # Django entry point
├── requirements.txt      # Dependencies
├── db.sqlite3           # Database
├── Dockerfile           # Docker configuration
└── docker-compose.yml   # Docker compose setup
```

---

## 📊 Database Models

### 1. **Motif**

```python
- user: Nama pengguna yang membuat motif
- raw_url: URL gambar original
- edit_url: URL gambar setelah edit
- Urutan: Urutan lidi
- jenis: Jenis motif/generator yang digunakan
- jmlBaris: Jumlah baris motif
- time: Timestamp pembuatan
```

### 2. **MotifForm1** (Model Utama)

```python
- imgBefore: Gambar sebelum proses
- imgAfter: Gambar setelah proses
- urutanLidi: Urutan lidi (array)
- jenisGenerate: Jenis algoritma (Tabu, Greedy, Random, ACO)
- jmlBaris: Jumlah baris
- user: Username pembuat
- time: Timestamp
- slice: Hasil slice gambar
- coloredImage: Gambar setelah pewarnaan
- jenisKain: Jenis kain/fabric
- jenisProduk: Jenis produk
```

### 3. **UlosColorThread**

```python
- CODE: Kode warna (Primary Key)
- hsv: Format HSV dari warna
- Method: get_hex_color() → Konversi HSV ke HEX (#RRGGBB)
```

### 4. **UlosCharacteristic**

```python
- NAME: Nama karakteristik (Primary Key)
- garis: Tipe garis/line pattern
- pola: Pattern/motif
- warna_dominasi: Warna dominan
- warna_aksen: Warna aksen
- kontras_warna: Kontras warna
```

---

## 🔄 Alur Kerja Aplikasi

### **1. User Flow**

```
Login/Register
    ↓
Pilih Mode Generator (home.html)
    ├─ Upload Gambar Motif
    ├─ Atur Parameter:
    │  ├─ Nama motif
    │  ├─ Jumlah baris
    │  ├─ Inisiasi baris
    │  └─ Mode (1=Tabu, 2=Greedy, 3=Random, 4=ACO)
    ↓
Process Motif (CreateImageModule.py)
    ├─ Baca gambar → cv2.imread()
    ├─ Slice gambar menjadi 8 bagian
    ├─ Resize jika mode ACO
    ├─ Convert ke array
    ↓
Jalankan Algoritma (Function.py)
    ├─ Tabu Search
    ├─ Greedy Search
    ├─ Random Search
    ├─ ACO (Ant Colony Optimization)
    ↓
Generate Output Image
    ├─ Create image dari hasil array
    ├─ Save ke media/
    ├─ Create grid visualization (MotifModule.py)
    ↓
Pewarnaan (Coloring.py)
    ├─ Terapkan color scheme
    ├─ Generate colored motif
    ↓
Simpan ke Database (SaveModule.py)
    └─ Save MotifForm1 record
        ↓
    Hasil tersedia di halaman List
```

---

## 🔧 Modul-Modul Utama

### **Website/Function.py** - Algoritma Pencarian Motif

**Fungsi Utama:**

- `SkorPertama(arr1, arr2)`: Menghitung skor kemiripan motif
- `SkorRasio(arr1, arr2)`: Menghitung rasio lidi 1 vs 2
- `densityPixel(arr4)`: Menghitung density pixel
- `TabuSearch(arr_start, jml_iterasi)`: Implementasi Tabu Search
- `GreedySearch(arr_start)`: Implementasi Greedy Search
- `RandomSearch(arr_start, jml_iterasi)`: Random Search
- `ACO(array, jml_iterasi)`: Ant Colony Optimization menggunakan ACO-Pants

**Konsep:**

- Motif tenun direpresentasikan sebagai array: 1 (benang lidi) atau 2 (benang pakan)
- Algoritma mencari urutan optimal dengan scoring function
- Tabu Search: Menggunakan tabu list untuk hindari solusi sebelumnya
- ACO: Menggunakan artificial ants untuk menemukan solusi optimal

---

### **Website/CreateImageModule.py** - Generator Gambar Motif

**Class: CreateImageMotif**

**Method Utama:**

1. **`imageOriginal()`**
   - Baca gambar input dengan cv2.imread()
   - Resize jika mode ACO (4x amplifikasi)
   - Slice menjadi 8 bagian horizontal
   - Save slice ke folder `media/motif_awal/slices/`

2. **`imageGenerate()`**
   - Generate gambar motif dari urutan lidi
   - Gunakan ProcessImage.CreateImage()
   - Save ke `media/Hasil/`

3. **`imageGrid()`**
   - Create grid visualization untuk lihat pattern
   - Save dengan suffix `_grid`

4. **`process()`**
   - Main orchestration method
   - Menggabungkan semua step di atas
   - Return hasil dalam dictionary

---

### **Website/MotifModule.py** - Handling Motif

**Class: Motif**

1. **`UrutanLidi()`**
   - Baca image height
   - Generate array urutan dari 1 sampai height
   - Return sebagai string

2. **`GridLidi()`**
   - Ambil gambar original
   - Resize 10x untuk lihat pattern jelas
   - Draw grid lines setiap 10 pixel
   - Save hasil grid

---

### **Website/ProcessImage.py** - Image Processing

**Fungsi:**

- `ScaleImage()`: Resize gambar
- `ProcesImage()`: Proses general gambar
- `SeparateImage()`: Pisahkan channel RGB
- `ConvertRGB()`: Konversi format warna
- `ConvertArrayImage()`: Image → numpy array
- `ConvertLiditoArray()`: Urutan lidi → array
- `CreateImage()`: Array → Image

---

### **Website/Coloring.py** - Pewarnaan Motif

**Fungsi:**

- `main_coloring_process()`: Main coloring orchestration
- `get_color_scheme_preview()`: Preview skema warna
- `get_similar_colors_suggestion()`: Saran warna similar

**Input**:

- Motif image + HSV color codes dari UlosColorThread
- Jenis kain (jenisKain)

**Output**:

- Colored motif image
- Color mapping metadata

---

### **Website/SaveModule.py** - Penyimpanan Data

**Fungsi:**

- Save MotifForm1 ke database
- Store image paths
- Store metadata (user, algorithm type, parameters)
- Track timestamp & session

---

### **Website/views.py** - View/Controller Layer (2255 Baris!)

**URL Endpoints Utama:**

| Route               | Fungsi                  | Method   |
| ------------------- | ----------------------- | -------- |
| `/generator/`       | Halaman generator motif | GET/POST |
| `/home/`            | Home page               | GET      |
| `/Monitoring`       | Admin monitoring        | GET      |
| `/save`             | Save motif ke DB        | POST     |
| `/gabungkan-motif/` | Combine multiple motifs | GET/POST |
| `/ubah_warna/`      | Change color of motif   | GET/POST |
| `/download/`        | Download motif          | GET/POST |
| `/list`             | List semua motif        | GET      |
| `/list/<id>`        | Detail motif            | GET      |
| `/search`           | Search motif            | GET/POST |
| `/delete/`          | Delete motif            | POST     |
| `/update/<id>`      | Update motif            | GET/POST |
| `/login/`           | User login              | GET/POST |
| `/register/`        | User registration       | GET/POST |
| `/help/...`         | Help pages              | GET      |

**View Functions Penting:**

1. **`image(request)`** - Generator utama
2. **`save(request)`** - Save motif generate
3. **`gabungkan_motif(request)`** - Combine motifs
4. **`ubah_warna(request)`** - Color modification
5. **`PostImage(request)`** - Handle image upload
6. **`download(request)`** - Export motif
7. **`search(request)`** - Search functionality
8. **`LoginPage(request)`** - Authentication
9. **`regenerate_motif(request)`** - Regenerate existing motif

---

## 📁 Directory Mapping

### **media/** - Generated Files Storage

```
media/
├── motif_awal/slices/          # Original image slices
├── Hasil/                       # Generated motif results
│   ├── <uuid>_grid/            # Grid visualization
│   └── <uuid>/
├── colored_motifs/              # Colored version
├── combined_motifs/             # Combined multiple motifs
├── grids/                       # Grid images
├── slices/                      # Slice images
├── uploads/                     # User uploads
└── zips/                        # Zip archives for download
```

### **templates/** - HTML Templates

```
templates/
├── home.html                # Generator interface
├── login.html              # Login form
├── signup.html             # Registration form
├── ListMotif.html          # List all motifs
├── lihatMotif.html         # View single motif
├── pewarnaan.html          # Coloring interface
├── gabung-motif.html       # Combine motifs interface
├── download.html           # Download page
├── search.html             # Search interface
├── motif_gabungan_colored_preview.html  # Preview combined colored
├── ubah-warna.html         # Color change interface
├── help*.html              # Help pages
├── error.html              # Error page
├── footer.html             # Footer component
├── header.html             # Header component
└── img/                    # Template images
```

---

## 🎨 Fitur Utama

### **1. Generator Motif (4 Algoritma)**

```
Input:
- Gambar motif initial
- Jumlah baris (rows)
- Initial row setup
- Algorithm type

Proses:
- Slice image → 8 sections
- Run algorithm (Tabu/Greedy/Random/ACO)
- Generate optimal thread sequence
- Create output image

Output:
- Generated motif image
- Grid visualization
- Thread sequence (urutanLidi)
```

### **2. Pewarnaan Motif**

```
Input:
- Motif image
- Color scheme (HSV values)
- Fabric type

Output:
- Colored motif image
- Color preview
```

### **3. Gabung Motif**

```
Input:
- Multiple motif selections

Output:
- Combined motif image
- Single colored version
```

### **4. Search & Filter**

- Search by user name
- Filter by thread count
- Filter by time created
- Full text search

### **5. User Management**

- Login/Registration
- Admin monitoring
- User tracking
- Session management

---

## 🚀 Alur Eksekusi Utama

### **Ketika User Generate Motif:**

```python
1. Request masuk ke views.image() atau views.generator()

2. Get parameters dari POST:
   - namaMotif, jmlBaris, Baris, mode, username

3. Upload file:
   - Save ke temporary location
   - Get file path

4. Create instance CreateImageMotif:
   CreateImageMotif(
       fullpath=file_path,
       namaMotif=namaMotif,
       jmlBaris=jmlBaris,
       Baris=Baris,
       mode=mode,  # 1=Tabu, 2=Greedy, 3=Random, 4=ACO
       username=username,
       sessionName=session_id
   )

5. Process gambar:
   obj.imageOriginal()  # Slice image jadi 8 bagian

6. Loop setiap slice:
   a. Convert image → pixel array
   b. Run algorithm sesuai mode:
      - Tabu Search
      - Greedy Search
      - Random Search
      - ACO
   c. Get optimal urutan lidi (thread sequence)
   d. Generate image dari urutan tersebut
   e. Save image dengan timestamp/uuid

7. Generate grid visualization

8. Save ke database (MotifForm1):
   - Store all paths
   - Store metadata
   - Store algorithm type used

9. Return hasil ke template untuk display
```

---

## 🔍 Pola Coding

### **1. Module Pattern**

Setiap modul adalah class dengan related methods:

```python
class ProcessImage:
    def __init__(self, image_path):
        self.image_path = image_path

    def process(self):
        # Do something
        return result
```

### **2. Error Handling**

Try-catch untuk file operations & image processing:

```python
try:
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Image tidak bisa dibaca")
except Exception as e:
    print(f"Error: {e}")
```

### **3. File Path Handling**

Mix antara os.path dan string manipulation:

```python
folderUser = os.path.join("media", "motif_awal", "slices")
os.makedirs(folderUser, exist_ok=True)
```

### **4. Database Pattern**

Direct model operations:

```python
MotifForm1.objects.create(
    imgBefore=img_before,
    imgAfter=img_after,
    user=username,
    time=datetime.now()
)
```

---

## 💡 Key Technologies Explained

### **OpenCV (cv2)**

- Image reading: `cv2.imread(path, 1)` → BGR format
- Image operations: resize, crop, slice
- Used dalam CreateImageModule.py untuk slice gambar

### **PIL (Pillow)**

- Image.open() untuk baca PNG/JPG
- ImageDraw untuk draw grid lines
- Image.resize() dengan resampling options
- Used dalam MotifModule.py untuk grid creation

### **NumPy**

- Array operations untuk motif sequences
- Matrix calculations
- Type: np.ndarray

### **ACO-Pants**

- Library untuk Ant Colony Optimization
- Digunakan ketika user pilih mode=4
- Mencari optimal thread sequence

### **Django ORM**

- Database access: Model.objects.all(), .filter(), .create()
- Query optimization penting untuk large dataset
- Session management untuk tracking active users

---

## ⚙️ Environment & Setup

### **Requirements:**

```
Django==4.1.1
Pillow==9.2.0
opencv-python
numpy
ACO-Pants==0.5.2
mysqlclient==2.2.1
requests==2.32.2
pymoo==0.6.1
scikit-image
openai
reportlab
```

### **Database:**

- SQLite (development): db.sqlite3
- MySQL (production): mysqlclient configured in settings

### **Running:**

```bash
python manage.py runserver
# Access at http://127.0.0.1:8000/
```

---

## 📝 Catatan Penting

1. **views.py sangat besar** (2255 baris) - coba dipecah ke multiple files
2. **Image processing boros memori** - consider caching/optimization
3. **Algorithm performance** - ACO bisa lambat, add progress tracking
4. **Security** - Django CSRF protection sudah ada, tapi validate uploads
5. **Database** - Pastikan indexing untuk query performance
6. **File management** - Clean up old files di media/ folder

---

## 🎓 Urutan Belajar yang Disarankan

1. **Pahami struktur project** (folder, files)
2. **Pelajari models.py** (data structure)
3. **Pelajari Function.py** (algoritma inti)
4. **Pelajari CreateImageModule.py** (image processing flow)
5. **Pelajari views.py** (request handling)
6. **Pelajari templates/** (UI layer)
7. **Trace one complete flow** (dari upload sampai hasil)
8. **Eksperimen dengan modification** (ubah parameter, algorithm)

---

## 🔗 Hubungan Antar Module

```
USER INPUT (templates/home.html)
    ↓
views.image() [GET form]
    ↓ [POST]
views.PostImage() [file upload]
    ↓
CreateImageModule.CreateImageMotif
    ↓
ProcessImage [image conversions]
    ↓
Function.py [algorithm: Tabu/Greedy/Random/ACO]
    ↓
CreateImageModule [image generation]
    ↓
Coloring.py [apply colors]
    ↓
SaveModule [store to DB]
    ↓
models.MotifForm1 [database]
    ↓
views.download() [export results]
```

---

**Last Updated**: January 2026  
**Dokumentasi dibuat untuk memudahkan pembelajaran source code DiTenun-App**
