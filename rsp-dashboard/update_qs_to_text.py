import pandas as pd
import mysql.connector
import os

# 1. Update the database
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="LenovoLOQ021605Jev",
    database="rsp_db"
)
cursor = db.cursor()

def get_category(title):
    t = title.upper()
    if 'TEACH' in t or 'SPED' in t or 'INSTRUCTOR' in t:
        return 'Teaching'
    if 'PRINCIPAL' in t or 'HEAD' in t or 'SUPERVISOR' in t or 'DIRECTOR' in t:
        return 'School Administration'
    # Default to Non-Teaching for generic admin positions
    return 'Non-Teaching'

df = pd.read_excel(r'C:\Users\Admin\Downloads\CSC deped iligan.xlsx', skiprows=2)

updated = 0

for idx, row in df.iterrows():
    title = str(row.iloc[1]).strip()
    if title == 'nan' or not title or title.upper() == 'POSITION TITLE': continue
    
    edu_text = row.iloc[3]
    train_text = row.iloc[4]
    exp_text = row.iloc[5]
    elig_text = row.iloc[6]
    
    if pd.isna(edu_text):
        edu_text, train_text, exp_text, elig_text = row.iloc[7], row.iloc[8], row.iloc[9], row.iloc[10]
    if pd.isna(edu_text):
        edu_text, train_text, exp_text, elig_text = row.iloc[11], row.iloc[12], row.iloc[13], row.iloc[14]
        
    e = str(edu_text).strip() if not pd.isna(edu_text) else 'None Required'
    t = str(train_text).strip() if not pd.isna(train_text) else 'None Required'
    x = str(exp_text).strip() if not pd.isna(exp_text) else 'None Required'
    el = str(elig_text).strip() if not pd.isna(elig_text) else 'None Required'
    
    cat = get_category(title)
    
    cursor.execute("""
        UPDATE positions 
        SET qsEducation = %s, qsTraining = %s, qsExperience = %s, qsEligibility = %s, category = %s
        WHERE title = %s
    """, (e, t, x, el, cat, title))
    updated += cursor.rowcount

db.commit()
cursor.close()
db.close()
print(f"Updated DB: set raw text QS and category for {updated} positions.")

# 2. Update dashboard.hbs
hbs_path = r'C:\Users\Admin\Desktop\Personnel - RSP\Recruitment-Selection-Process\rsp-dashboard\views\dashboard.hbs'
with open(hbs_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Replace Education Select with Textarea
edu_pattern = re.compile(r'<select class="form-select bg-white bg-opacity-75" name="qsEducation" id="modalPosEdu">.*?</select>', re.DOTALL)
edu_replacement = '<textarea class="form-control bg-white bg-opacity-75" name="qsEducation" id="modalPosEdu" rows="3" placeholder="Enter Education Requirement..."></textarea>'
content = edu_pattern.sub(edu_replacement, content)

# Replace Training Select with Textarea
train_pattern = re.compile(r'<select class="form-select bg-white bg-opacity-75" name="qsTraining" id="modalPosTrain">.*?</select>', re.DOTALL)
train_replacement = '<textarea class="form-control bg-white bg-opacity-75" name="qsTraining" id="modalPosTrain" rows="3" placeholder="Enter Training Requirement..."></textarea>'
content = train_pattern.sub(train_replacement, content)

# Replace Experience Select with Textarea
exp_pattern = re.compile(r'<select class="form-select bg-white bg-opacity-75" name="qsExperience" id="modalPosExp">.*?</select>', re.DOTALL)
exp_replacement = '<textarea class="form-control bg-white bg-opacity-75" name="qsExperience" id="modalPosExp" rows="3" placeholder="Enter Experience Requirement..."></textarea>'
content = exp_pattern.sub(exp_replacement, content)

# Also update Eligibility to textarea just for consistency
elig_pattern = re.compile(r'<input type="text" class="form-control bg-white bg-opacity-75" name="qsEligibility" id="modalPosElig" placeholder="Enter Eligibility requirement...">')
elig_replacement = '<textarea class="form-control bg-white bg-opacity-75" name="qsEligibility" id="modalPosElig" rows="3" placeholder="Enter Eligibility requirement..."></textarea>'
content = elig_pattern.sub(elig_replacement, content)

with open(hbs_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated dashboard.hbs to use textareas for QS.")
