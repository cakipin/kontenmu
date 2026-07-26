import os
import re

src_dir = '/Users/cakiphin/projects/kontenmu/apps/portal-agen/src'

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()

            if 'sales-api.1912.workers.dev' in content:
                # Replace backtick strings
                content = re.sub(r"`https://sales-api\.1912\.workers\.dev([^`]*)`", r"`${import.meta.env.VITE_API_URL || 'https://sales-api.1912.workers.dev'}\1`", content)
                # Replace single quote strings
                content = re.sub(r"'https://sales-api\.1912\.workers\.dev([^']*)'", r"`${import.meta.env.VITE_API_URL || 'https://sales-api.1912.workers.dev'}\1`", content)
                
                with open(path, 'w') as f:
                    f.write(content)
                print(f"Updated {path}")
