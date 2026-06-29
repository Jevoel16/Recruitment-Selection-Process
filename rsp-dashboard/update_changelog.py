import datetime
import re

changelog_path = 'CHANGELOG.md'
with open(changelog_path, 'r', encoding='utf-8') as f:
    content = f.read()

now = datetime.datetime.now()
timestamp = now.strftime('%Y-%m-%d %H:%M')
version_str = now.strftime('v0.6.0-Alpha+%Y%m%d%H%M')

new_entry = f"""## {timestamp} ({version_str})
### ADDED
- Dynamic Plantilla setup with auto-generating fields corresponding to Vacancy Counts.
- Implemented elegant two-column layout for Plantilla Item list rendering in the Position Info Modal.
- Added 17 new official positions mapped directly from standard CSC Excel sheets.
- Extracted Plantilla data to its own responsive `col-12` container to prevent modal layout breaking.

### CHANGED
- Transformed Qualification Standards (Education, Training, Experience, Eligibility) from dropdowns into fully editable, multi-line raw text fields in the Position Info Modal.
- Formatted new Position titles to Title Case natively, preserving uppercase for internal parentheticals (e.g., `(CT)`) and Roman Numerals.
- Rewrote the database seeding logic (`seed_positions.js`) to dynamically embed all 72 full position profiles, categories, and raw text-based Qualification Standards directly into the `npm run dev` and `npm run prod` initialization cycle.

### FIXED
- Removed problematic W3C XML Schema linkages (`xmlns="http://www.w3.org/TR/REC-html40"`) from backend `.xls` exporters, permanently eliminating the issue of Microsoft Excel hanging or crashing when intranet devices attempt to open exported documents offline.

"""

new_content = content.replace('# Changelog\n', f'# Changelog\n\n{new_entry}')

with open(changelog_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Updated CHANGELOG.md')
