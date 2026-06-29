import os

dir_path = r'C:\Users\Admin\Desktop\Personnel - RSP\Recruitment-Selection-Process\rsp-dashboard\views'
hbs_path = os.path.join(dir_path, 'dashboard.hbs')

with open(hbs_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace textarea with dynamic container
old_html = '''                        <div class="mb-4">
                            <label class="form-label fw-bold">Plantilla Item/s Number</label>
                            <textarea class="form-control" name="plantillaItem" id="plantillaItemNumbers" rows="3" placeholder="Enter plantilla item numbers here..."></textarea>
                        </div>'''

new_html = '''                        <div class="mb-4">
                            <label class="form-label fw-bold">Plantilla Item/s Number</label>
                            <div id="plantillaItemsContainer" class="d-flex flex-column gap-2">
                                <!-- Dynamic inputs will be inserted here -->
                            </div>
                        </div>'''

content = content.replace(old_html, new_html)

# 2. Update Javascript for rendering and handling
# A helper function `renderPlantillaInputs(count, existing = [])`
# Event listener on `.plantilla-setup-btn` to call renderPlantillaInputs
# Event listener on `#plantillaVacancyCount` to call renderPlantillaInputs
# Submit handler to collect inputs `.plantilla-item-input` and join by comma

old_js_start = '''        document.querySelectorAll('.plantilla-setup-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.getElementById('plantillaModalTitle').innerText = this.getAttribute('data-title');
                document.getElementById('plantillaPosId').value = this.getAttribute('data-id');
                document.getElementById('plantillaVacancyCount').value = this.getAttribute('data-count') || 1;
                document.getElementById('plantillaItemNumbers').value = this.getAttribute('data-plantilla');
            });
        });'''

new_js_start = '''
        function renderPlantillaInputs(count, existingValues = []) {
            const container = document.getElementById('plantillaItemsContainer');
            container.innerHTML = '';
            for(let i = 0; i < count; i++) {
                const val = existingValues[i] ? existingValues[i].trim() : '';
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-control plantilla-item-input';
                input.placeholder = `Plantilla Number ${i + 1}`;
                input.value = val;
                container.appendChild(input);
            }
        }

        const vacCountInput = document.getElementById('plantillaVacancyCount');
        if (vacCountInput) {
            vacCountInput.addEventListener('input', function() {
                const count = parseInt(this.value) || 1;
                // Preserve current inputs before re-rendering
                const currentInputs = Array.from(document.querySelectorAll('.plantilla-item-input')).map(inp => inp.value);
                renderPlantillaInputs(count, currentInputs);
            });
        }

        document.querySelectorAll('.plantilla-setup-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.getElementById('plantillaModalTitle').innerText = this.getAttribute('data-title');
                document.getElementById('plantillaPosId').value = this.getAttribute('data-id');
                
                const count = parseInt(this.getAttribute('data-count')) || 1;
                document.getElementById('plantillaVacancyCount').value = count;
                
                const plantillaStr = this.getAttribute('data-plantilla') || '';
                const existingValues = plantillaStr.split(',').map(s => s.trim()).filter(s => s);
                
                renderPlantillaInputs(count, existingValues);
            });
        });'''

content = content.replace(old_js_start, new_js_start)

# 3. Update the submit handler
old_submit = '''                const id = document.getElementById('plantillaPosId').value;
                const vacancyCount = document.getElementById('plantillaVacancyCount').value;
                const plantillaItem = document.getElementById('plantillaItemNumbers').value;'''

new_submit = '''                const id = document.getElementById('plantillaPosId').value;
                const vacancyCount = document.getElementById('plantillaVacancyCount').value;
                
                const inputs = Array.from(document.querySelectorAll('.plantilla-item-input'));
                const plantillaItem = inputs.map(inp => inp.value.trim()).filter(v => v !== '').join(', ');'''

content = content.replace(old_submit, new_submit)

# Info modal already uses input #modalPosPlantilla and gets its value from `data-plantilla` of the position-info-btn
# The update route already sets plantillaItem in the database.
# We also need to update the `position-info-btn`'s `data-plantilla` attribute in the dashboard if it was changed!
# Wait, currently the save handler only updates `plantilla-btn-{id}` data attributes. It should also update the `info-btn` if possible, but that requires selecting the info btn.
# Let's add that. The info button doesn't have an ID. We can select it via `button[data-bs-target="#positionInfoModal"][data-id="{id}"]`

info_btn_update = '''                        // update the button data attributes in UI
                        const pBtn = document.getElementById('plantilla-btn-' + id);
                        if(pBtn) {
                            pBtn.setAttribute('data-count', vacancyCount);
                            pBtn.setAttribute('data-plantilla', plantillaItem);
                        }
                        
                        const infoBtn = document.querySelector(`button.position-info-btn[data-id="${id}"]`);
                        if(infoBtn) {
                            infoBtn.setAttribute('data-plantilla', plantillaItem);
                        }'''

old_pbtn_update = '''                        // update the button data attributes in UI
                        const pBtn = document.getElementById('plantilla-btn-' + id);
                        if(pBtn) {
                            pBtn.setAttribute('data-count', vacancyCount);
                            pBtn.setAttribute('data-plantilla', plantillaItem);
                        }'''

content = content.replace(old_pbtn_update, info_btn_update)

with open(hbs_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated dashboard.hbs with dynamic Plantilla input fields.")
