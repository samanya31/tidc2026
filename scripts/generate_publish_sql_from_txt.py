from pathlib import Path
import re

def quote_sql(value):
    if value is None or value == '':
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"

input_file = Path('ROUND2_PARTICIPANTS_TEXT.txt')
output_file = Path('publish_round2_results.txt')
text = input_file.read_text(encoding='utf-8', errors='ignore')
lines = [line for line in text.splitlines() if line.strip()]
header_idx = None
for i, line in enumerate(lines):
    if 'SN' in line and 'BACE' in line and 'Category' in line and 'Qualified for Round' in line:
        header_idx = i
        break
if header_idx is None:
    raise SystemExit('Header row not found')

header = lines[header_idx].split('\t')
header = [h.strip() for h in header]
num_cols = len(header)
rows = []
for line in lines[header_idx + 1:]:
    parts = line.split('\t')
    parts = [p.strip() for p in parts]
    if len(parts) < num_cols:
        parts += [''] * (num_cols - len(parts))
    if len(parts) > num_cols:
        parts = parts[:num_cols]

    row = dict(zip(header, parts))
    name = row.get('Name of Devotee', '')
    bace = row.get('BACE', '')
    mobile = row.get('Mob No', '')
    category = row.get('Category', '')
    rank = row.get('Rank', '')
    qualified = row.get('Qualified for Round – 2', '')

    if not name or not category:
        continue
    q = str(qualified).strip().lower()
    if q not in ('yes', 'y', 'true', '1'):
        continue
    try:
        rnk = int(re.sub(r'[^0-9]', '', rank)) if rank else None
    except ValueError:
        rnk = None

    rows.append({
        'name': name,
        'bace': bace,
        'mobile': mobile,
        'category': category,
        'rank': rnk,
        'qualified': q,
    })

# Exclude garbage bottom rows that are not actual entries
exclude_names = {
    'nadia dram', 'tukalbad', 'keshab chabara', 'ndia bhajan  subal',
    'aaksha poem dance', 'jaspal', 'sunny mansi kartal  dance  ekchakra'
}
rows = [r for r in rows if r['name'].strip().lower() not in exclude_names]

# Deduplicate same student/category for Round 2, keeping the best rank when duplicates exist.
unique_rows = {}
for row in rows:
    key = (row['name'].strip().lower(), row['category'].strip().lower())
    existing = unique_rows.get(key)
    if existing is None:
        unique_rows[key] = row
        continue
    if row['rank'] is None:
        continue
    if existing['rank'] is None or row['rank'] < existing['rank']:
        unique_rows[key] = row
rows = list(unique_rows.values())

values = []
for row in rows:
    values.append('  (' + ', '.join([
        quote_sql(row['name']),
        quote_sql(row['bace']),
        quote_sql(row['mobile']),
        quote_sql(row['category']),
        'NULL',
        str(row['rank']) if row['rank'] is not None else 'NULL',
        "'yes'"
    ]) + ')')

sql = 'WITH new_rows(student_name, bace, mobile, category, marks, rnk, qualified_flag) AS (\n'
sql += 'VALUES\n'
sql += ',\n'.join(values)
sql += '\n)\n'
sql += "INSERT INTO tidc_results (registration_id, student_name, bace, category, round, status)\n"
sql += "SELECT\n  r.id,\n  n.student_name,\n  n.bace,\n  n.category,\n  'Round 2' AS round,\n  CASE\n    WHEN n.rnk = 1 THEN 'Winner'\n    WHEN n.rnk = 2 THEN 'Runner-up'\n    WHEN n.rnk >= 3 THEN 'Qualified'\n    ELSE 'Qualified'\n  END AS status\n"
sql += "FROM new_rows n\nLEFT JOIN tidc_registrations r\n  ON (trim(lower(r.full_name)) = trim(lower(n.student_name)))\n     OR (r.mobile_number IS NOT NULL AND r.mobile_number = n.mobile)\n"
sql += "WHERE lower(n.qualified_flag) = 'yes'\n  AND NOT EXISTS (\n    SELECT 1 FROM tidc_results t\n    WHERE (\n      r.id IS NOT NULL\n      AND t.registration_id = r.id\n      AND t.category = n.category\n      AND t.round = 'Round 2'\n    ) OR (\n      r.id IS NULL\n      AND t.student_name = n.student_name\n      AND t.category = n.category\n      AND t.round = 'Round 2'\n    )\n  );\n"

output_file.write_text(sql, encoding='utf-8')
print(f'Wrote {len(rows)} rows to {output_file}')
