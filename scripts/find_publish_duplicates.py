from pathlib import Path
import re
from collections import Counter
p = Path('publish_round2_results.txt')
text = p.read_text(encoding='utf-8')
# find the values block
vals = re.findall(r"\((?:'[^']*'|NULL)(?:, (?:'[^']*'|NULL))*\)", text)
rows = []
for v in vals:
    parts = []
    cur = ''
    in_quote = False
    for ch in v[1:-1]:
        if ch == "'":
            in_quote = not in_quote
            cur += ch
        elif ch == ',' and not in_quote:
            parts.append(cur.strip())
            cur = ''
        else:
            cur += ch
    parts.append(cur.strip())
    parts = [p.strip() for p in parts]
    def clean(x):
        if x == 'NULL':
            return None
        if x.startswith("'") and x.endswith("'"):
            return x[1:-1].replace("''", "'")
        return x
    parts = [clean(x) for x in parts]
    if len(parts) >= 7:
        rows.append((parts[0], parts[3], parts[5]))
counts = Counter(rows)
for (name, cat, rank), count in counts.items():
    if count > 1:
        print(count, name, cat, rank)
print('total rows', len(rows))
