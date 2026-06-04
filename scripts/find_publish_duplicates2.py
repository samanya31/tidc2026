from pathlib import Path
from collections import Counter
import re
p = Path('publish_round2_results.txt')
rows = []
with p.open(encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line.startswith('('):
            continue
        # split top-level commas
        parts = []
        cur = ''
        in_quote = False
        for ch in line[1:-1]:
            if ch == "'":
                in_quote = not in_quote
                cur += ch
            elif ch == ',' and not in_quote:
                parts.append(cur.strip())
                cur = ''
            else:
                cur += ch
        parts.append(cur.strip())
        def clean(x):
            if x == 'NULL':
                return None
            if x.startswith("'") and x.endswith("'"):
                return x[1:-1].replace("''", "'")
            return x
        parts = [clean(p) for p in parts]
        if len(parts) >= 7:
            rows.append((parts[0], parts[3], parts[5]))
counts = Counter(rows)
for (name, cat, rank), cnt in counts.items():
    if cnt > 1:
        print(cnt, name, cat, rank)
print('total rows', len(rows))
