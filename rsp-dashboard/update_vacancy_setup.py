import os
import re

dir_path = r'C:\Users\Admin\Desktop\Personnel - RSP\Recruitment-Selection-Process\rsp-dashboard\views'
hbs_path = os.path.join(dir_path, 'dashboard.hbs')

with open(hbs_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the tab text
content = content.replace('<i class="bi bi-diagram-3 me-2"></i> Position Categories</button>', '<i class="bi bi-diagram-3 me-2"></i> Vacancy Setup</button>')

# 2. Extract and replace the tab content
categories_start = content.find('<!-- Categories Tab -->')
categories_end = content.find('        </div>\n    </div>\n</div> <!-- End container-fluid -->')

new_categories_content = '''        <!-- Categories Tab -->
        <div class="tab-pane fade {{#if selectedPosition}}show active{{/if}}" id="categories" role="tabpanel">
            <div class="glass-panel p-4 rounded-4 shadow-sm h-100 position-relative">
                <table class="table table-hover align-middle mb-0 border-light">
                    <thead>
                        <tr>
                            <th class="fw-bold">Position Name</th>
                            <th class="text-center fw-bold">Vacancy</th>
                            <th class="text-center fw-bold">Position Info</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each groupedPositions}}
                            <tr class="table-light">
                                <td colspan="3" class="fw-bold text-primary bg-primary bg-opacity-10 border-0">{{this.categoryName}}</td>
                            </tr>
                            {{#each this.positions}}
                            <tr>
                                <td class="fw-semibold">{{this.title}}</td>
                                <td class="text-center">
                                    <div class="form-check form-switch d-flex justify-content-center">
                                        <input class="form-check-input vacancy-toggle cursor-pointer" type="checkbox" data-id="{{this.id}}" {{#if this.in_vacancy}}checked{{/if}} style="transform: scale(1.3);">
                                    </div>
                                </td>
                                <td class="text-center">
                                    <button class="btn btn-sm btn-outline-primary shadow-sm position-info-btn rounded-pill px-3" 
                                        data-bs-toggle="modal" 
                                        data-bs-target="#positionInfoModal"
                                        data-id="{{this.id}}"
                                        data-title="{{this.title}}"
                                        data-vacancy="{{this.vacancyAnnouncement}}"
                                        data-plantilla="{{this.plantillaItem}}"
                                        data-salary="{{this.salaryGrade}}"
                                        data-edu="{{this.qsEducation}}"
                                        data-train="{{this.qsTraining}}"
                                        data-exp="{{this.qsExperience}}"
                                        data-elig="{{this.qsEligibility}}">
                                        <i class="bi bi-info-circle me-1"></i> Info
                                    </button>
                                </td>
                            </tr>
                            {{/each}}
                        {{/each}}
                    </tbody>
                </table>
            </div>
'''

content = content[:categories_start] + new_categories_content + content[categories_end:]

# 3. Add the modal before the end of <div class="d-print-none">
modal_content = '''    <!-- Position Info Modal -->
    <div class="modal fade glass-modal" id="positionInfoModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header border-bottom border-light border-opacity-25 bg-primary bg-opacity-10 text-primary">
                    <h5 class="modal-title fw-bold"><i class="bi bi-file-earmark-ruled me-2"></i> <span id="positionInfoModalTitle">Position Info</span></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <form id="positionForm">
                        <input type="hidden" name="id" id="modalPosId">
                        
                        <div class="row g-3 mb-4">
                            <div class="col-md-6">
                                <label class="form-label fw-semibold small text-muted">Vacancy Announcement No.</label>
                                <input type="text" class="form-control bg-white bg-opacity-75" name="vacancyAnnouncement" id="modalPosVacancy">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold small text-muted">Plantilla Item/s Number</label>
                                <input type="text" class="form-control bg-white bg-opacity-75" name="plantillaItem" id="modalPosPlantilla">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold small text-muted">Salary Grade and Monthly Salary</label>
                                <input type="text" class="form-control bg-white bg-opacity-75" name="salaryGrade" id="modalPosSalary">
                            </div>
                        </div>

                        <h5 class="fw-bold mb-3 border-bottom pb-2">Qualification Standards</h5>

                        <div class="row g-3 mb-4">
                            <div class="col-md-6">
                                <label class="form-label fw-semibold small text-muted">Education</label>
                                <textarea class="form-control bg-white bg-opacity-75" name="qsEducation" id="modalPosEdu" rows="2"></textarea>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold small text-muted">Training</label>
                                <textarea class="form-control bg-white bg-opacity-75" name="qsTraining" id="modalPosTrain" rows="2"></textarea>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold small text-muted">Experience</label>
                                <textarea class="form-control bg-white bg-opacity-75" name="qsExperience" id="modalPosExp" rows="2"></textarea>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold small text-muted">Eligibility</label>
                                <textarea class="form-control bg-white bg-opacity-75" name="qsEligibility" id="modalPosElig" rows="2"></textarea>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-end mt-4 pt-3 border-top">
                            <button type="submit" class="btn btn-primary px-4 shadow-sm fw-bold" id="savePositionBtn">
                                <i class="bi bi-save me-2"></i> Save Standards
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
'''

content = content.replace('    <!-- Step 2 Summary Modal -->', modal_content + '\n    <!-- Step 2 Summary Modal -->')

# 4. Add JS handlers to the bottom of the script section
js_script = '''
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.vacancy-toggle').forEach(toggle => {
            toggle.addEventListener('change', async function() {
                const id = this.getAttribute('data-id');
                const in_vacancy = this.checked;
                try {
                    const response = await fetch(`/api/positions/${id}/vacancy`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ in_vacancy })
                    });
                    const res = await response.json();
                    if(!res.success) throw new Error('Failed to update vacancy status');
                } catch(e) {
                    console.error(e);
                    alert('Error toggling vacancy');
                    this.checked = !in_vacancy;
                }
            });
        });

        document.querySelectorAll('.position-info-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.getElementById('positionInfoModalTitle').innerText = this.getAttribute('data-title');
                document.getElementById('modalPosId').value = this.getAttribute('data-id');
                document.getElementById('modalPosVacancy').value = this.getAttribute('data-vacancy');
                document.getElementById('modalPosPlantilla').value = this.getAttribute('data-plantilla');
                document.getElementById('modalPosSalary').value = this.getAttribute('data-salary');
                document.getElementById('modalPosEdu').value = this.getAttribute('data-edu');
                document.getElementById('modalPosTrain').value = this.getAttribute('data-train');
                document.getElementById('modalPosExp').value = this.getAttribute('data-exp');
                document.getElementById('modalPosElig').value = this.getAttribute('data-elig');
            });
        });
    });
    </script>
'''

content = content.replace('</body>', js_script + '</body>')

with open(hbs_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated dashboard.hbs with table, modal, and vacancy toggle.")
