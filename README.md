# DiTenun

Repository proyek berbasis Django dengan editor visual berbasis Next.js yang dipakai untuk membuat dan memodifikasi motif tenun.

## Arsitektur saat ini

- Backend: Django + MySQL
- Editor UI: Next.js di folder editor-ui
- Docker Compose menyiapkan backend, editor, dan database secara terintegrasi

## Prasyarat

- Docker Desktop
- Docker Compose
- Python 3.9 (jika ingin menjalankan secara lokal tanpa Docker)
- Node.js 20+ (untuk editor UI lokal)

## Jalankan dengan Docker

```bash
docker compose up --build
```

Setelah container berjalan:

- Website utama: http://localhost:8000
- Editor UI: http://localhost:3000

## Jalankan secara lokal (tanpa Docker)

### Backend Django

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_accounts
python manage.py seed_characteristics
python manage.py seed_colors
python manage.py runserver
```

### Editor UI

```bash
cd editor-ui
npm install
npm run dev
```

## Catatan penting

- Database default untuk Docker diatur melalui service MySQL dengan nama database GenerateMotif.
- File start_all.bat masih dapat dipakai untuk menjalankan backend dan editor secara manual pada mesin Windows.
- Beberapa fitur generator motif masih bergantung pada pustaka OpenCV, NumPy, Pillow, dan pymoo.

