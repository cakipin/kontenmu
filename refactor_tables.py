import os
import re

PAGE_DIR = 'apps/portal-agen/src/pages/'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Remove style={{ fontWeight: 700 }} from any <td>
    content = re.sub(r'style=\{\{\s*fontWeight:\s*700\s*\}\}', '', content)
    # Cleanup empty styles left behind, e.g. <td > or <td className="..." >
    content = re.sub(r'<td\s+>', '<td>', content)
    content = re.sub(r'style=\{\{\s*\}\}', '', content)

    # 2. Add headerAligns to all DataTables automatically based on header names!
    def repl_datatable(match):
        headers_str = match.group(1)
        # extract the array
        headers_list = re.findall(r"'([^']+)'", headers_str)
        aligns = []
        for h in headers_list:
            h_lower = h.lower()
            if h_lower in ['aksi', 'status', 'kelas', 'terbit', 'progress', 'terakhir dibaca', 'thumbnail', 'thumb', 'durasi', 'jatuh tempo', 'teralokasi', 'tersedia', 'terjual', 'deadline agen']:
                aligns.append("'center'")
            elif h_lower in ['nominal', 'total penjualan', 'total lisensi']:
                aligns.append("'right'")
            else:
                aligns.append("'left'")
        
        aligns_str = f"[{', '.join(aligns)}]"
        return f"<DataTable headers={{{headers_str}}}\n        headerAligns={{{aligns_str}}}>"

    # Replace <DataTable headers={['...', '...']}>
    content = re.sub(r'<DataTable\s+headers=\{([^}]+)\}\s*>', repl_datatable, content)

    with open(filepath, 'w') as f:
        f.write(content)

for filename in os.listdir(PAGE_DIR):
    if filename.endswith('.tsx'):
        process_file(os.path.join(PAGE_DIR, filename))

print("Done processing files.")
