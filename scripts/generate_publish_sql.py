"""
Generate a SQL script to publish Round 2 results from an Excel file.

Usage:
  python scripts/generate_publish_sql.py input.xlsx output.txt

If no args are given, defaults are:
  input: round2_participants.xlsx
  output: publish_round2_results.txt

The Excel is expected to have columns containing (case-insensitive):
  name (student full name), bace (center), mobile (phone), category, rank, qualified

Status mapping by rank:
  1 -> 'Winner'
  2 -> 'Runner-up'
  >=3 -> 'Qualified'

The produced SQL will: attempt to join `tidc_registrations` on `full_name` or `mobile_number`,
and insert into `tidc_results`, avoiding duplicates for same registration/name + category + round.
"""
import sys
import re
from pathlib import Path
import pandas as pd
import html

INPUT_DEFAULT = 'round2_participants.xlsx'
OUTPUT_DEFAULT = 'publish_round2_results.txt'

def find_column(df, candidates):
    cols = {c.lower(): c for c in df.columns}
    for cand in candidates:
        for k,v in cols.items():
            if cand in k:
                return v
    return None

def quote_sql(s):
    if s is None or (isinstance(s,float) and pd.isna(s)):
        return 'NULL'
    # Convert to str and escape single quotes
    t = str(s).strip()
    t = t.replace("'","''")
    return f"'{t}'"


def main():
    inpath = sys.argv[1] if len(sys.argv) > 1 else INPUT_DEFAULT
    outpath = sys.argv[2] if len(sys.argv) > 2 else OUTPUT_DEFAULT

    input_path = Path(inpath)
    if input_path.suffix.lower() == '.txt':
        text = input_path.read_text(encoding='utf-8', errors='ignore')
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        header_idx = None
        for i, line in enumerate(lines):
            if 'SN' in line and 'BACE' in line and 'Category' in line:
                header_idx = i
                break
        if header_idx is None:
            print('Header row not found in TXT file')
            return
        rows = []
        for line in lines[header_idx:]:
            parts = re.split(r'\t+', line)
            if len(parts) == 1:
                parts = re.split(r'\s{2,}', line)
            rows.append([p.strip() for p in parts])
        df = pd.DataFrame(rows[1:], columns=[h.strip() for h in rows[0]])
    else:
        df = pd.read_excel(inpath)
    if df.shape[0] == 0:
        print('No rows found in input file')
        return

    # find columns
    name_col = find_column(df, ['name','full_name','devotee','student'])
    bace_col = find_column(df, ['bace','base','center'])
    mobile_col = find_column(df, ['mobile','mob','phone'])
    category_col = find_column(df, ['category','cat'])
    rank_col = find_column(df, ['rank'])
    marks_col = find_column(df, ['mark','score'])
    qualified_col = find_column(df, ['qualified','qualify','qualified for','qualified_flag'])

    if not name_col or not category_col:
        print('Required columns not found. Need at least Name and Category columns.')
        print('Detected columns:', list(df.columns))
        return

    rows = []
    for _, r in df.iterrows():
        name = r.get(name_col)
        if pd.isna(name):
            continue
        bace = r.get(bace_col) if bace_col else ''
        mobile = r.get(mobile_col) if mobile_col else ''
        category = r.get(category_col)
        rank = r.get(rank_col) if rank_col else None
        marks = r.get(marks_col) if marks_col else None
        qualified = r.get(qualified_col) if qualified_col else 'yes'

        # normalize qualified
        q = str(qualified).strip().lower() if not pd.isna(qualified) else 'yes'
        if q not in ('yes','y','true','1'):
            continue

        # determine rank integer if possible
        rnk = None
        try:
            if not pd.isna(rank):
                rnk = int(rank)
        except Exception:
            rnk = None

        rows.append({
            'student_name': str(name).strip(),
            'bace': '' if pd.isna(bace) else str(bace).strip(),
            'mobile': '' if pd.isna(mobile) else str(mobile).strip(),
            'category': str(category).strip(),
            'marks': None if pd.isna(marks) else marks,
            'rnk': rnk,
            'qualified_flag': 'yes'
        })

    if len(rows) == 0:
        print('No qualified rows to insert')
        return

    # Build VALUES lines
    values_lines = []
    for r in rows:
        vals = (
            quote_sql(r['student_name']),
            quote_sql(r['bace']),
            quote_sql(r['mobile']),
            quote_sql(r['category']),
            'NULL' if r['marks'] is None else str(r['marks']),
            'NULL' if r['rnk'] is None else str(r['rnk']),
            quote_sql(r['qualified_flag'])
        )
        values_lines.append('  (' + ', '.join(vals) + ')')

    values_block = ',\n'.join(values_lines)

    sql = f"""
WITH new_rows(student_name, bace, mobile, category, marks, rnk, qualified_flag) AS (
{values_block}
)
INSERT INTO tidc_results (registration_id, student_name, bace, category, round, status)
SELECT
  r.id,
  n.student_name,
  n.bace,
  n.category,
  'Round 2' AS round,
  CASE
    WHEN n.rnk = 1 THEN 'Winner'
    WHEN n.rnk = 2 THEN 'Runner-up'
    WHEN n.rnk >= 3 THEN 'Qualified'
    ELSE 'Qualified'
  END AS status
FROM new_rows n
LEFT JOIN tidc_registrations r
  ON (trim(lower(r.full_name)) = trim(lower(n.student_name)))
     OR (r.mobile_number IS NOT NULL AND r.mobile_number = n.mobile)
WHERE lower(n.qualified_flag) = 'yes'
  AND NOT EXISTS (
    SELECT 1 FROM tidc_results t
    WHERE (
      r.id IS NOT NULL
      AND t.registration_id = r.id
      AND t.category = n.category
      AND t.round = 'Round 2'
    ) OR (
      r.id IS NULL
      AND t.student_name = n.student_name
      AND t.category = n.category
      AND t.round = 'Round 2'
    )
  );
"""

    with open(outpath, 'w', encoding='utf-8') as f:
        f.write(sql)

    print(f'Wrote SQL for {len(rows)} rows to {outpath}')

if __name__ == '__main__':
    main()
