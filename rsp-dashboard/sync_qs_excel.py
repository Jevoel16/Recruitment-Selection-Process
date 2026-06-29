import pandas as pd
import mysql.connector
import re

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="LenovoLOQ021605Jev",
    database="rsp_db"
)
cursor = db.cursor()

def parse_education(text):
    if not isinstance(text, str): return ''
    t = text.lower()
    
    if 'read and write' in t or 'must be able to read' in t: return '1'
    if 'elementary' in t: return '2'
    if 'junior high' in t: return '3'
    if 'senior high' in t: return '4'
    if 'two years' in t or 'two-year' in t or '2 years' in t: return '5'
    if 'bachelor' in t: return '6'
    
    if "master's degree" in t or "masteral" in t: return '21'
    if 'doctorate' in t or 'phd' in t or 'ed.d' in t: return '31'
    
    if 'none' not in t and t.strip() != '':
        return '6'
        
    return ''

def parse_training(text):
    if not isinstance(text, str): return ''
    t = text.lower()
    if 'none' in t: return '1'
    match = re.search(r'(\d+)\s*hours?', t)
    if match:
        hours = int(match.group(1))
        level = (hours // 8) + 1
        return str(min(level, 42))
    return '1'

def parse_experience(text):
    if not isinstance(text, str): return ''
    t = text.lower()
    if 'none' in t: return '1'
    
    years_match = re.search(r'(\d+)\s*years?', t)
    if years_match:
        years = int(years_match.group(1))
        level = (years * 2) + 1
        return str(min(level, 21))
        
    mo_match = re.search(r'(\d+)\s*months?', t)
    if mo_match:
        months = int(mo_match.group(1))
        if months < 6: return '1'
        if months >= 6 and months < 12: return '2'
        if months >= 12 and months < 18: return '3'
        
    return '1'

df = pd.read_excel(r'C:\Users\Admin\Downloads\CSC deped iligan.xlsx', skiprows=2)

added_count = 0
updated_count = 0

for idx, row in df.iterrows():
    title = str(row.iloc[1]).strip()
    if title == 'nan' or not title or title.upper() == 'POSITION TITLE': continue
    
    sg = str(row.iloc[2]).strip()
    if sg == 'nan': sg = ''
    
    edu_text = row.iloc[3]
    train_text = row.iloc[4]
    exp_text = row.iloc[5]
    elig_text = row.iloc[6]
    
    if pd.isna(edu_text):
        edu_text, train_text, exp_text, elig_text = row.iloc[7], row.iloc[8], row.iloc[9], row.iloc[10]
        
    if pd.isna(edu_text):
        edu_text, train_text, exp_text, elig_text = row.iloc[11], row.iloc[12], row.iloc[13], row.iloc[14]
        
    edu_level = parse_education(edu_text)
    train_level = parse_training(train_text)
    exp_level = parse_experience(exp_text)
    eligibility = str(elig_text).strip() if not pd.isna(elig_text) else ''
    if eligibility == 'nan': eligibility = ''
    
    if sg.endswith('.0'): sg = sg[:-2]

    cursor.execute("SELECT id FROM positions WHERE title = %s", (title,))
    result = cursor.fetchone()
    
    if result:
        update_query = """
        UPDATE positions 
        SET qsEducation = %s, qsTraining = %s, qsExperience = %s, qsEligibility = %s, salaryGrade = %s
        WHERE id = %s
        """
        cursor.execute(update_query, (edu_level, train_level, exp_level, eligibility, sg, result[0]))
        updated_count += 1
    else:
        insert_query = """
        INSERT INTO positions (title, category, in_vacancy, qsEducation, qsTraining, qsExperience, qsEligibility, salaryGrade)
        VALUES (%s, 'General', 0, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (title, edu_level, train_level, exp_level, eligibility, sg))
        added_count += 1

db.commit()
cursor.close()
db.close()
print(f"Added {added_count} new positions, updated {updated_count} existing positions.")
