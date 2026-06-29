import os
import re

dir_path = r'C:\Users\Admin\Desktop\Personnel - RSP\Recruitment-Selection-Process\rsp-dashboard\views'
partials_path = os.path.join(dir_path, 'partials', 'index_modals.hbs')
hbs_path = os.path.join(dir_path, 'dashboard.hbs')

with open(partials_path, 'r', encoding='utf-8') as f:
    modals = f.read()

def extract_options(select_id):
    start_tag = f'id="{select_id}"'
    start_idx = modals.find(start_tag)
    if start_idx == -1: return ""
    start_options = modals.find('<option', start_idx)
    end_options = modals.find('</select>', start_options)
    options = modals[start_options:end_options]
    return options

edu_opts = extract_options('standardEduLevel')
train_opts = extract_options('standardTrainLevel')
exp_opts = extract_options('standardExpLevel')

# Now modify dashboard.hbs
with open(hbs_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Salary Grade text field with two fields (Salary Grade, Monthly Salary)
old_salary_html = '''                            <div class="col-md-6">
                                <label class="form-label fw-semibold small text-muted">Salary Grade and Monthly Salary</label>
                                <input type="text" class="form-control bg-white bg-opacity-75" name="salaryGrade" id="modalPosSalary">
                            </div>'''

new_salary_html = '''                            <div class="col-md-3">
                                <label class="form-label fw-semibold small text-muted">Salary Grade</label>
                                <input type="text" class="form-control bg-white bg-opacity-75" name="salaryGrade" id="modalPosSalaryGrade">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label fw-semibold small text-muted">Monthly Salary</label>
                                <input type="text" class="form-control bg-white bg-opacity-75" name="monthlySalary" id="modalPosMonthlySalary">
                            </div>'''

content = content.replace(old_salary_html, new_salary_html)

# Replace QS Textareas with Selects containing options
old_qs_html = '''                        <div class="row g-3 mb-4">
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
                        </div>'''

new_qs_html = f'''                        <div class="row g-3 mb-4">
                            <div class="col-md-6">
                                <label class="form-label fw-semibold small text-muted">Education</label>
                                <select class="form-select bg-white bg-opacity-75" name="qsEducation" id="modalPosEdu">
                                    <option value="">Select Education Requirement...</option>
{edu_opts}
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold small text-muted">Training</label>
                                <select class="form-select bg-white bg-opacity-75" name="qsTraining" id="modalPosTrain">
                                    <option value="">Select Training Requirement...</option>
{train_opts}
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold small text-muted">Experience</label>
                                <select class="form-select bg-white bg-opacity-75" name="qsExperience" id="modalPosExp">
                                    <option value="">Select Experience Requirement...</option>
{exp_opts}
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold small text-muted">Eligibility</label>
                                <input type="text" class="form-control bg-white bg-opacity-75" name="qsEligibility" id="modalPosElig" placeholder="Enter Eligibility requirement...">
                            </div>
                        </div>'''

content = content.replace(old_qs_html, new_qs_html)

# Update the JS assigning data attributes
old_js = '''                document.getElementById('modalPosSalary').value = this.getAttribute('data-salary');
                document.getElementById('modalPosEdu').value = this.getAttribute('data-edu');'''
new_js = '''                document.getElementById('modalPosSalaryGrade').value = this.getAttribute('data-salary');
                document.getElementById('modalPosMonthlySalary').value = this.getAttribute('data-monthly');
                document.getElementById('modalPosEdu').value = this.getAttribute('data-edu');'''

content = content.replace(old_js, new_js)

# Update the button data attributes in the table loop
old_btn = '''                                        data-plantilla="{{this.plantillaItem}}"
                                        data-salary="{{this.salaryGrade}}"
                                        data-edu="{{this.qsEducation}}"'''
new_btn = '''                                        data-plantilla="{{this.plantillaItem}}"
                                        data-salary="{{this.salaryGrade}}"
                                        data-monthly="{{this.monthlySalary}}"
                                        data-edu="{{this.qsEducation}}"'''

content = content.replace(old_btn, new_btn)

# Ensure "selected" in options from index_modals doesn't mess up dynamically setting value via JS
# (The JS assigning `.value` to select will override any `selected` attribute anyway, so it's fine).

with open(hbs_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated dashboard.hbs with new separated salary fields and dropdowns for QS.")
