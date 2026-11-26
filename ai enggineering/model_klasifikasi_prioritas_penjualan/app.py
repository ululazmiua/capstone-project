"""
REST API klasifikasi prioritas penjualan produk - Royal PetCare.

Alur: backend (Binta) kirim data batch -> API ini panggil model -> balas apakah
batch itu perlu diprioritaskan untuk dijual.

Model: tuning_classification.joblib (Random Forest hasil GridSearchCV dari Ulul).
Label model: priority_sale_flag (True = prioritas dijual, False = bukan prioritas).
"""
import os

import joblib
import pandas as pd
from flask import Flask, jsonify, request

FOLDER = os.path.dirname(os.path.abspath(__file__))
MODEL_DEFAULT = os.environ.get("MODEL_PATH", os.path.join(FOLDER, "tuning_classification.joblib"))

# Di notebook: pd.get_dummies(..., columns=['category'], drop_first=True)
# Kategori pertama (urut abjad) dibuang sebagai patokan, jadi tidak punya kolom sendiri.
KATEGORI_PATOKAN = "Makanan Basah"

# Urutan kolom persis seperti X_train di notebook (dipakai kalau model tidak menyimpan nama kolomnya)
KOLOM_DEFAULT = [
    "unit_price", "initial_stock", "quantity_sold", "current_stock", "days_until_expiry",
    "category_Makanan Kering", "category_Perawatan", "category_Snack",
    "category_Susu", "category_Vitamin & Suplemen",
]

ANGKA_TIDAK_NEGATIF = ["unit_price", "initial_stock", "quantity_sold", "current_stock"]


def muat_model(path):
    if not os.path.exists(path):
        return None
    return joblib.load(path)


def apakah_angka(nilai):
    return isinstance(nilai, (int, float)) and not isinstance(nilai, bool)


class Penyiap:
    """Mengubah data mentah dari backend menjadi tabel yang sama dengan data latih."""

    def __init__(self, model):
        nama = getattr(model, "feature_names_in_", None)
        self.kolom = list(nama) if nama is not None else KOLOM_DEFAULT
        # kategori_dikenal: huruf kecil -> nama asli
        semua = [KATEGORI_PATOKAN] + [k[len("category_"):] for k in self.kolom
                                      if k.startswith("category_")]
        self.kategori_dikenal = {k.lower(): k for k in semua}

    def daftar_kategori(self):
        return sorted(self.kategori_dikenal.values())

    def cek_item(self, item):
        """Daftar pesan error untuk satu item (kosong kalau semuanya benar)."""
        if not isinstance(item, dict):
            return ["Item harus berupa objek JSON"]

        error = []

        kategori = item.get("category")
        if not isinstance(kategori, str) or not kategori.strip():
            error.append("category wajib diisi (teks)")
        elif kategori.strip().lower() not in self.kategori_dikenal:
            error.append(f"category '{kategori}' tidak dikenal. Pilihan: "
                         + ", ".join(self.daftar_kategori()))

        for kolom in ANGKA_TIDAK_NEGATIF:
            nilai = item.get(kolom)
            if nilai is None:
                error.append(f"{kolom} wajib diisi")
            elif not apakah_angka(nilai):
                error.append(f"{kolom} harus berupa angka")
            elif nilai < 0:
                error.append(f"{kolom} tidak boleh negatif")

        hari = item.get("days_until_expiry")
        if hari is None:
            error.append("days_until_expiry wajib diisi")
        elif not apakah_angka(hari):
            error.append("days_until_expiry harus berupa angka")

        # Pemeriksaan logika stok (hanya kalau angkanya sudah valid)
        if not error:
            if item["quantity_sold"] > item["initial_stock"]:
                error.append("quantity_sold tidak boleh lebih besar dari initial_stock")
            if item["current_stock"] > item["initial_stock"]:
                error.append("current_stock tidak boleh lebih besar dari initial_stock")

        return error

    def buat_tabel(self, items):
        baris = []
        for item in items:
            kategori = self.kategori_dikenal[item["category"].strip().lower()]
            baris.append({
                "unit_price": item["unit_price"],
                "initial_stock": item["initial_stock"],
                "quantity_sold": item["quantity_sold"],
                "current_stock": item["current_stock"],
                "days_until_expiry": item["days_until_expiry"],
                **{k: int(k == "category_" + kategori)
                   for k in self.kolom if k.startswith("category_")},
            })
        return pd.DataFrame(baris, columns=self.kolom)


def create_app(model_path=MODEL_DEFAULT):
    app = Flask(__name__)
    model = muat_model(model_path)
    penyiap = Penyiap(model) if model is not None else None

    @app.post("/api/v1/predict")
    def predict():
        if model is None:
            return jsonify({
                "status": "error",
                "message": "Model belum dimuat. Pastikan file tuning_classification.joblib "
                           "ada di folder yang sama dengan app.py",
            }), 503

        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"status": "error", "message": "Body harus JSON yang valid"}), 400

        items = data.get("items")
        if not isinstance(items, list) or len(items) == 0:
            return jsonify({"status": "error",
                            "message": "Field 'items' wajib berisi minimal 1 data"}), 400

        masalah = []
        for i, item in enumerate(items):
            for pesan in penyiap.cek_item(item):
                masalah.append({"index": i, "message": pesan})
        if masalah:
            return jsonify({"status": "error", "message": "Data tidak valid",
                            "errors": masalah}), 422

        try:
            tabel = penyiap.buat_tabel(items)
            hasil = model.predict(tabel)
            peluang = model.predict_proba(tabel)
            kelas = list(model.classes_)
            kolom_true = kelas.index(True)
        except Exception as e:
            app.logger.exception("Prediksi gagal")
            return jsonify({"status": "error",
                            "message": "Prediksi gagal, cek kecocokan data dengan model",
                            "detail": str(e)}), 500

        results = []
        for i, item in enumerate(items):
            prioritas = bool(hasil[i])
            results.append({
                "product_id": item.get("product_id"),
                "batch_id": item.get("batch_id"),
                "priority_sale_flag": prioritas,
                "priority_label": "prioritas" if prioritas else "bukan_prioritas",
                "probability": round(float(peluang[i][kolom_true]), 4),
            })

        return jsonify({"status": "success", "results": results})

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
