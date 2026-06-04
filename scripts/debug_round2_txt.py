from pathlib import Path
p = Path('ROUND2_PARTICIPANTS_TEXT.txt')
text = p.read_text(encoding='utf-8', errors='ignore')
lines = [line for line in text.splitlines() if line.strip()]
for i, line in enumerate(lines[:40], 1):
    print(i, repr(line))
