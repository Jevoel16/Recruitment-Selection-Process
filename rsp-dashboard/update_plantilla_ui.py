import os

dir_path = r'C:\Users\Admin\Desktop\Personnel - RSP\Recruitment-Selection-Process\rsp-dashboard\views'
hbs_path = os.path.join(dir_path, 'dashboard.hbs')

with open(hbs_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Table Headers
content = content.replace(
    '<th class="text-center fw-bold">Vacancy</th>\n                            <th class="text-center fw-bold">Position Info</th>',
    '<th class="text-center fw-bold">Vacancy</th>\n                            <th class="text-center fw-bold">Plantilla</th>\n                            <th class="text-center fw-bold">Position Info</th>'
)

# 2. Update colspan
content = content.replace(
    '<td colspan="3" class="fw-bold text-primary bg-primary bg-opacity-10 border-0">{{this.categoryName}}</td>',
    '<td colspan="4" class="fw-bold text-primary bg-primary bg-opacity-10 border-0">{{this.categoryName}}</td>'
)

# 3. Add Plantilla <td> inside the loop
old_td = '''                                <td class="text-center">
                                    <div class="form-check form-switch d-flex justify-content-center">
                                        <input class="form-check-input vacancy-toggle cursor-pointer" type="checkbox" data-id="{{this.id}}" {{#if this.in_vacancy}}checked{{/if}} style="transform: scale(1.3);">
                                    </div>
                                </td>
                                <td class="text-center">'''

new_td = '''                                <td class="text-center">
                                    <div class="form-check form-switch d-flex justify-content-center">
                                        <input class="form-check-input vacancy-toggle cursor-pointer" type="checkbox" data-id="{{this.id}}" {{#if this.in_vacancy}}checked{{/if}} style="transform: scale(1.3);">
                                    </div>
                                </td>
                                <td class="text-center">
                                    <button class="btn btn-sm btn-outline-success shadow-sm plantilla-setup-btn rounded-pill px-3" 
                                        data-bs-toggle="modal" 
                                        data-bs-target="#plantillaModal"
                                        data-id="{{this.id}}"
                                        data-title="{{this.title}}"
                                        data-count="{{this.vacancyCount}}"
                                        data-plantilla="{{this.plantillaItem}}"
                                        id="plantilla-btn-{{this.id}}"
                                        {{#unless this.in_vacancy}}disabled{{/unless}}>
                                        <i class="bi bi-list-ol me-1"></i> Setup
                                    </button>
                                </td>
                                <td class="text-center">'''

content = content.replace(old_td, new_td)

# 4. Add the Plantilla Modal
modal_html = '''    <!-- Plantilla Setup Modal -->
    <div class="modal fade glass-modal" id="plantillaModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header border-bottom border-light border-opacity-25 bg-success bg-opacity-10 text-success">
                    <h5 class="modal-title fw-bold"><i class="bi bi-list-ol me-2"></i> Plantilla Setup: <span id="plantillaModalTitle"></span></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <form id="plantillaForm">
                        <input type="hidden" name="id" id="plantillaPosId">
                        
                        <div class="mb-4">
                            <label class="form-label fw-bold">How many vacancy in this position?</label>
                            <input type="number" class="form-control form-control-lg text-center fw-bold fs-3" name="vacancyCount" id="plantillaVacancyCount" min="1" required>
                        </div>
                        
                        <div class="mb-4">
                            <label class="form-label fw-bold">Plantilla Item/s Number</label>
                            <textarea class="form-control" name="plantillaItem" id="plantillaItemNumbers" rows="3" placeholder="Enter plantilla item numbers here..."></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-success w-100 fw-bold shadow-sm" id="savePlantillaBtn">
                            <i class="bi bi-save me-2"></i> Save Plantilla
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    
'''
content = content.replace('    <!-- Position Info Modal -->', modal_html + '    <!-- Position Info Modal -->')

# 5. Add JS logic
js_additions = '''
        document.querySelectorAll('.vacancy-toggle').forEach(toggle => {
            toggle.addEventListener('change', async function() {
                const id = this.getAttribute('data-id');
                const in_vacancy = this.checked;
                
                // Toggle the button state immediately
                const pBtn = document.getElementById('plantilla-btn-' + id);
                if(pBtn) {
                    pBtn.disabled = !in_vacancy;
                }

                try {
                    const response = await fetch(`/api/positions/${id}/vacancy`, {
'''

content = content.replace('''        document.querySelectorAll('.vacancy-toggle').forEach(toggle => {
            toggle.addEventListener('change', async function() {
                const id = this.getAttribute('data-id');
                const in_vacancy = this.checked;
                try {
                    const response = await fetch(`/api/positions/${id}/vacancy`, {''', js_additions)

js_additions_2 = '''
        document.querySelectorAll('.plantilla-setup-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.getElementById('plantillaModalTitle').innerText = this.getAttribute('data-title');
                document.getElementById('plantillaPosId').value = this.getAttribute('data-id');
                document.getElementById('plantillaVacancyCount').value = this.getAttribute('data-count') || 1;
                document.getElementById('plantillaItemNumbers').value = this.getAttribute('data-plantilla');
            });
        });

        const plantillaForm = document.getElementById('plantillaForm');
        if(plantillaForm) {
            plantillaForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const btn = document.getElementById('savePlantillaBtn');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Saving...';
                btn.disabled = true;

                const id = document.getElementById('plantillaPosId').value;
                const vacancyCount = document.getElementById('plantillaVacancyCount').value;
                const plantillaItem = document.getElementById('plantillaItemNumbers').value;

                try {
                    const response = await fetch(`/api/positions/${id}/plantilla`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ vacancyCount, plantillaItem })
                    });
                    const res = await response.json();
                    if(res.success) {
                        btn.classList.replace('btn-success', 'btn-primary');
                        btn.innerHTML = '<i class="bi bi-check-lg me-2"></i> Saved';
                        
                        // update the button data attributes in UI
                        const pBtn = document.getElementById('plantilla-btn-' + id);
                        if(pBtn) {
                            pBtn.setAttribute('data-count', vacancyCount);
                            pBtn.setAttribute('data-plantilla', plantillaItem);
                        }
                        
                        setTimeout(() => {
                            bootstrap.Modal.getInstance(document.getElementById('plantillaModal')).hide();
                            btn.classList.replace('btn-primary', 'btn-success');
                            btn.innerHTML = originalText;
                            btn.disabled = false;
                        }, 1000);
                    }
                } catch(err) {
                    console.error(err);
                    alert('Error saving plantilla');
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            });
        }
'''

content = content.replace('    function filterVacancyTable() {', js_additions_2 + '\n    function filterVacancyTable() {')


with open(hbs_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated dashboard.hbs with Plantilla Setup button and modal.")
