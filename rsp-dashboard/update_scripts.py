import os

dir_path = r'C:\Users\Admin\Desktop\Personnel - RSP\Recruitment-Selection-Process\rsp-dashboard\views'

for filename in ['add-applicant.hbs', 'dashboard.hbs']:
    path = os.path.join(dir_path, filename)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    scripts = '''<script src="/js/requirements.js"></script>
<script src="/js/qualifications.js"></script>
<script src="/js/scores.js"></script>
<script src="/js/assignment.js"></script>
<script src="/js/applicantDetails.js"></script>
<script src="/js/documents.js"></script>
<script src="/js/assessment.js"></script>
<script src="/js/main.js"></script>'''

    content = content.replace('<script src="/js/main.js"></script>', scripts)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
