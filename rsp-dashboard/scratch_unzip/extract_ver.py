import openpyxl

wb = openpyxl.load_workbook(r'C:\Users\Admin\Downloads\DEPED ILIGAN 4 10 2026.xlsx', data_only=True)
sheet = wb['Sheet1']

print('--- COLUMNS ---')
for col in range(1, 15):
    letter = openpyxl.utils.get_column_letter(col)
    dim = sheet.column_dimensions[letter]
    print(f'Col {letter}: {dim.width}')

print('--- ROWS ---')
for row in range(1, 25):
    dim = sheet.row_dimensions[row]
    print(f'Row {row}: {dim.height}')

