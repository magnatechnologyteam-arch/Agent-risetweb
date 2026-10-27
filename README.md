# Kantor Virtual Magna

Kantor 3D untuk memantau sepuluh agent AI yang mengerjakan 30 website bertema MagnaRent (penyewaan perlengkapan event) di bawah Magna Technology. Denahnya mengikuti kantor sungguhan dan MagnaSuperApp. Status tiap agent, papan 30 website, dan log aktivitas dibaca dari satu file data.

Halaman ini adalah alat internal. Ia **tidak diindeks mesin pencari** (meta `noindex`, header `X-Robots-Tag`, dan `robots.txt`).

## Isi halaman

- **Lantai kantor 3D** (Three.js r128, tanpa proses build): putar 360°, zoom, geser, klik karakter untuk melihat tugasnya. Bila WebGL tidak tersedia, halaman otomatis memakai denah 2D sederhana.
- **Waktu nyata WIB**: jam, tanggal, langit, dan lampu mengikuti waktu Asia/Jakarta. Agent yang menganggur mengikuti jadwal harian (lihat di bawah).
- **Status agent yang jujur**: agent yang bekerja, selesai, atau gagal tetap duduk di kursinya di Ruang Intern. Layar monitornya berubah (kode bergulir, centang, atau tanda seru). Hanya agent yang menganggur yang berkeliling (ngopi, ngobrol berpasangan, rapat, main dart, peregangan, dan sebagainya).
- **Papan 30 website** berbentuk dropdown per tahap (Riset, Rancang, Bangun, QA, Pratinjau, Disetujui, Dipantau). Tiap tahap menampilkan jumlah website dan bisa dibuka atau ditutup.
- **Log aktivitas** terbaru.

## Jadwal harian agent (WIB)

| Jam | Kegiatan agent yang menganggur |
|---|---|
| 00.00 sampai 08.00 | Tidur di Kamar Staff (jam tidur dan bangun diacak) |
| 08.00 sampai 09.00 | Siap-siap kerja: ngopi, peregangan, ngobrol, lalu ke meja |
| 09.00 sampai 12.00 | Jam kerja: standby di meja, sesekali istirahat singkat |
| 12.00 sampai 13.00 | Istirahat dan makan siang |
| 13.00 sampai 18.00 | Jam kerja |
| 18.00 sampai 24.00 | Bebas: main game di meja, main dart, ngobrol, santai, main HP |

Agent yang sedang punya tugas (status bekerja, selesai, atau gagal) **tetap di mejanya** di luar jam kerja juga, karena posisinya mengikuti status nyata, bukan jadwal.

## Sepuluh agent

| ID | Peran |
|---|---|
| a01 | Riset Kompetitor |
| a02 | Riset Kata Kunci & Niche |
| a03 | Perancang Struktur |
| a04 | Pembangun Website |
| a05 | Penulis Konten |
| a06 | SEO Teknis |
| a07 | Konversi & UX |
| a08 | Keaslian & Kepatuhan |
| a09 | Pemantau Kinerja |
| a10 | Penilai |

## Apakah butuh database?

**Untuk saat ini tidak.** Seluruh data hanya tiga hal kecil (10 agent, 30 website, beberapa puluh baris log), ditulis oleh satu pihak (agent), dan dibaca banyak orang. Karena itu datanya disimpan di satu berkas, `data/state.json`, di dalam repo:

- tidak ada biaya, kunci rahasia, atau layanan tambahan;
- riwayat perubahan tercatat otomatis oleh git (siapa mengubah apa dan kapan);
- setiap commit memicu Vercel untuk menerbitkan ulang, dan halaman membaca ulang berkasnya tiap 30 detik.

Konsekuensinya: halaman bersifat **hanya baca**, dan pembaruan baru tampil setelah commit diterbitkan (sekitar satu menit). Tombol "Setujui" tidak tampil di versi ini. Persetujuan pratinjau dilakukan dengan mengubah tahap website menjadi `disetujui` lewat commit, sehingga ada jejak jelas siapa yang menyetujui.

**Kapan perlu database:** bila agent menulis status sangat sering (tiap beberapa detik), bila beberapa orang perlu menyetujui langsung dari halaman, atau bila Anda ingin riwayat panjang dan grafik. Saat itu, ganti isi `data-adapter.js` dengan pembaca Supabase (baca publik lewat aturan RLS, tulis hanya dengan kunci khusus). Antarmuka yang dipakai halaman kecil dan dijelaskan di bagian bawah.

## Struktur berkas

```
index.html          halaman dan seluruh logika 3D
data-adapter.js     membaca data/state.json bila halaman dibuka di luar Claude
data/state.json     satu-satunya sumber data (agents, sites, log)
scripts/kv.mjs      skrip untuk memperbarui data/state.json
vendor/three.min.js Three.js r128 (disalin ke repo, tidak memakai CDN)
vercel.json         header noindex dan cache
robots.txt          melarang semua perayap
favicon.svg
```

## Menjalankan di komputer

```bash
npm run dev          # atau: npx serve .
```

Buka alamat yang ditampilkan. Tidak ada langkah build. Font memakai Google Fonts, dan bila tidak termuat, halaman memakai font bawaan.

## Memperbarui data

Dengan skrip (disarankan, karena memvalidasi isian):

```bash
node scripts/kv.mjs status a03 working "Menyusun kerangka Tenda Event" s01
node scripts/kv.mjs status a03 done "Kerangka Tenda Event selesai"
node scripts/kv.mjs site s01 stage rancang
node scripts/kv.mjs site s01 url https://contoh-pratinjau.vercel.app
node scripts/kv.mjs site s01 score 78
node scripts/kv.mjs log a03 "Kerangka Tenda Event selesai"
git add data/state.json && git commit -m "Pembaruan status" && git push
```

Nilai yang sah:

- status agent: `idle`, `working`, `done`, `error`
- tahap website: `riset`, `rancang`, `bangun`, `qa`, `pratinjau`, `disetujui`, `dipantau`
- skor: 0 sampai 100 (jangan diisi bila belum ada penilaian sungguhan)
- `url` harus diawali `https://`

### Bentuk data

```json
{
  "agents": { "a01": { "status": "done", "task": "…", "site": "", "updated": "ISO-8601" } },
  "sites":  { "s01": { "name": "Tenda Event", "niche": "…", "stage": "riset", "url": "https://…", "score": 78 } },
  "log":    [ { "ts": "ISO-8601", "agent": "a01", "text": "…" } ]
}
```

Log diurutkan dari yang terbaru. Bidang tambahan pada website (`kw`, `intent`, `gap`) dari tahap riset boleh dipakai bebas dan diabaikan oleh halaman.

## Menerbitkan ke Vercel

1. Impor repo ini di Vercel (Framework Preset: **Other**, tanpa build command, output directory dikosongkan).
2. Setiap push ke `main` diterbitkan otomatis.
3. Di pengaturan proyek Vercel, aktifkan **Deployment Protection** bila halaman hanya untuk tim, supaya tidak terbuka untuk umum.

## Aturan yang dijaga

- Website yang dibuat para agent tetap **noindex** sampai disetujui manusia.
- Setiap website mencantumkan identitas MagnaRent secara terbuka. Tidak ada halaman kota massal dengan teks yang hanya diganti nama kota, karena berisiko melanggar kebijakan spam Google.
- Skor penilaian hanya diisi dari penilaian nyata, bukan perkiraan.

## Antarmuka data (bila ingin mengganti sumber)

Halaman memanggil `window.claude.use("db")` dan `window.claude.use("user")`. Objek `db` hanya perlu:

- `db.collection(nama).onSnapshot(cb, err)`, dengan `cb({ docs: [{ id, data() }] })`
- `db.collection("log").orderBy("ts", "desc").limit(30).onSnapshot(cb, err)`
- untuk persetujuan: `db.doc("sites/ID").update({...})` dan `db.collection("log").add({...})`

`user.canEdit()` menentukan apakah tombol "Setujui" tampil. Pada `data-adapter.js` nilainya selalu `false`.

## Batasan yang diketahui

- Posisi tangga, garasi, dapur, dan gudang di denah adalah perkiraan dari foto dan screenshot, bukan ukuran asli.
- Zoom dua jari di HP tidak ada (pakai tombol +/−).
- Animasi diuji di browser tanpa GPU; kelancaran di perangkat lemah belum diukur. Kualitas turun otomatis bila perangkat lambat.

## Lisensi

Hak cipta Magna Technology. Three.js berlisensi MIT (lihat `vendor/three.min.js`).
