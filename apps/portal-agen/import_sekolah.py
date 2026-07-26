import pandas as pd
import math

df = pd.read_excel('/Users/cakiphin/Downloads/data_2026-01-06_dikdasmen_kontenmu.xlsx')
df = df.dropna(subset=['nama'])

columns = ['nama', 'npsn', 'bentuk_pendidikan', 'status_sekolah', 'alamat_jalan', 'rt', 'rw', 'nama_dusun', 'desa_kelurahan', 'kecamatan', 'kabupaten', 'provinsi', 'lintang', 'bujur', 'nomor_telepon', 'nomor_fax', 'email', 'website', 'akreditasi', 'pd_total', 'ptk_total']

sql_statements = []

def escape_str(val):
    if pd.isna(val):
        return "NULL"
    val = str(val).replace("'", "''")
    return f"'{val}'"

def escape_num(val):
    if pd.isna(val) or math.isnan(val):
        return "NULL"
    return str(int(val))

batch_size = 50
for i in range(0, len(df), batch_size):
    batch = df.iloc[i:i+batch_size]
    values = []
    for _, row in batch.iterrows():
        row_vals = [
            escape_str(row['nama']),
            escape_str(row['npsn']),
            escape_str(row['bentuk_pendidikan']),
            escape_str(row['status_sekolah']),
            escape_str(row['alamat_jalan']),
            escape_str(row['rt']),
            escape_str(row['rw']),
            escape_str(row['nama_dusun']),
            escape_str(row['desa_kelurahan']),
            escape_str(row['kecamatan']),
            escape_str(row['kabupaten']),
            escape_str(row['provinsi']),
            escape_str(row['lintang']),
            escape_str(row['bujur']),
            escape_str(row['nomor_telepon']),
            escape_str(row['nomor_fax']),
            escape_str(row['email']),
            escape_str(row['website']),
            escape_str(row['akreditasi']),
            escape_num(row['pd_total']),
            escape_num(row['ptk_total']),
        ]
        values.append(f"({', '.join(row_vals)})")
    
    stmt = f"INSERT INTO master_data_sekolah ({', '.join(columns)}) VALUES\n" + ",\n".join(values) + ";"
    sql_statements.append(stmt)

with open('import_sekolah.sql', 'w') as f:
    f.write("\n\n".join(sql_statements))

print(f"Generated import_sekolah.sql with {len(df)} rows.")
