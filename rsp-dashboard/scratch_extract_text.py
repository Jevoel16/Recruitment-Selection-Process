import os
import re

drawings_dir = r"C:\Users\Admin\Desktop\Personnel - RSP\Recruitment-Selection-Process\rsp-dashboard\scratch_unzip\xl\drawings"
for f in os.listdir(drawings_dir):
    path = os.path.join(drawings_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
        # Find all <a:t>...</a:t> blocks which contain text
        texts = re.findall(r'<a:t>(.*?)</a:t>', content)
        if texts:
            print(f"--- {f} ---")
            print(" ".join(texts))
