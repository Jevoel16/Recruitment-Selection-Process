import openpyxl

wb = openpyxl.load_workbook(r'C:\Users\Admin\Downloads\DEPED ILIGAN 4 10 2026.xlsx', data_only=True)
sheet = wb['Sheet1']

print('--- MERGED CELLS ---')
for merged_range in sheet.merged_cells.ranges:
    print(merged_range)

print('--- CELL CONTENT AND FONTS (Rows 1-20, Cols A-N) ---')
for row in range(1, 21):
    for col in range(1, 15):
        cell = sheet.cell(row=row, column=col)
        if cell.value is not None:
            font_info = ""
            if cell.font:
                font_info = f"[Font: {cell.font.name}, Size: {cell.font.size}, Bold: {cell.font.bold}, Italic: {cell.font.italic}]"
            print(f'{cell.coordinate}: {repr(cell.value)} {font_info}')
