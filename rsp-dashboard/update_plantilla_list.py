import os

dir_path = r'C:\Users\Admin\Desktop\Personnel - RSP\Recruitment-Selection-Process\rsp-dashboard\views'
hbs_path = os.path.join(dir_path, 'dashboard.hbs')

with open(hbs_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the input field in the modal with a container and hidden input
old_html = '''                            <div class="col-md-6">
                                <label class="form-label fw-semibold small text-muted">Plantilla Item/s Number</label>
                                <input type="text" class="form-control bg-light text-muted" name="plantillaItem" id="modalPosPlantilla" readonly>
                            </div>'''

new_html = '''                            <div class="col-md-6">
                                <label class="form-label fw-semibold small text-muted">Plantilla Item/s Number</label>
                                <input type="hidden" name="plantillaItem" id="modalPosPlantillaHidden">
                                <div id="modalPosPlantillaList" class="bg-light text-muted rounded p-2 border" style="min-height: 38px;">
                                    <!-- Populated by JS -->
                                </div>
                            </div>'''

content = content.replace(old_html, new_html)

# 2. Update the Javascript logic that populates this
old_js = "document.getElementById('modalPosPlantilla').value = this.getAttribute('data-plantilla');"

new_js = '''                const plantillaStr = this.getAttribute('data-plantilla') || '';
                const pHidden = document.getElementById('modalPosPlantillaHidden');
                if(pHidden) pHidden.value = plantillaStr;
                
                const pList = document.getElementById('modalPosPlantillaList');
                if(pList) {
                    pList.innerHTML = '';
                    const items = plantillaStr.split(',').map(s => s.trim()).filter(s => s);
                    if (items.length > 0) {
                        const ul = document.createElement('ul');
                        ul.className = 'mb-0 ps-3';
                        ul.style.columnCount = '2';
                        ul.style.columnGap = '0.5rem';
                        ul.style.fontSize = '0.75rem';
                        items.forEach(item => {
                            const li = document.createElement('li');
                            li.textContent = item;
                            ul.appendChild(li);
                        });
                        pList.appendChild(ul);
                    } else {
                        pList.innerHTML = '<span class="fst-italic" style="font-size: 0.75rem;">None</span>';
                    }
                }'''

content = content.replace(old_js, new_js)

with open(hbs_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated dashboard.hbs to show Plantilla Items as a 2-column bulleted list.")
