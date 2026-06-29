import os

dir_path = r'C:\Users\Admin\Desktop\Personnel - RSP\Recruitment-Selection-Process\rsp-dashboard'
hbs_path = os.path.join(dir_path, 'views', 'index.hbs')

with open(hbs_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get_lines(start, end):
    return ''.join(lines[start-1:end])

partials_dir = os.path.join(dir_path, 'views', 'partials')
os.makedirs(partials_dir, exist_ok=True)

files = {
    'step1.hbs': get_lines(6, 107),
    'step2.hbs': get_lines(108, 199),
    'step3.hbs': get_lines(200, 294),
    'step4.hbs': get_lines(295, 388),
    'step5.hbs': get_lines(389, 453),
    'index_modals.hbs': get_lines(454, 1537)
}

for filename, content in files.items():
    filepath = os.path.join(partials_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Wrote {filename}')

new_index = '{{> header}}\n\n<div class=\"glass-panel p-4 mb-0 shadow-sm rounded-4 d-print-none\">\n    <!-- Tab Content -->\n    {{> step1}}\n    {{> step2}}\n    {{> step3}}\n    {{> step4}}\n    {{> step5}}\n</div>\n\n{{> index_modals}}\n\n<script src=\"/js/requirements.js\"></script>\n<script src=\"/js/qualifications.js\"></script>\n<script src=\"/js/scores.js\"></script>\n<script src=\"/js/assignment.js\"></script>\n<script src=\"/js/applicantDetails.js\"></script>\n<script src=\"/js/documents.js\"></script>\n<script src=\"/js/assessment.js\"></script>\n' + get_lines(1538, len(lines))

with open(hbs_path, 'w', encoding='utf-8') as f:
    f.write(new_index)
print('Updated index.hbs')
