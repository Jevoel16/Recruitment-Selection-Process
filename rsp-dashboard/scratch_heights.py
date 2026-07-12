import openpyxl

def check_heights():
    wb = openpyxl.load_workbook(r"C:\Users\Admin\Downloads\ADAS-IER (1).xlsx")
    ws = wb.active
    for i in range(1, 20):
        print(f"Row {i} height: {ws.row_dimensions[i].height}")

check_heights()
