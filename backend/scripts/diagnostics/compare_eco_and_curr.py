import psycopg2
import json

conn_eco = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/samp_eco_db")
conn_curr = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/navneet_samp")
cur_eco = conn_eco.cursor()
cur_curr = conn_curr.cursor()

cur_eco.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'create_sample_requests' ORDER BY ordinal_position")
cols = [r[0] for r in cur_eco.fetchall()]

cur_eco.execute("SELECT * FROM create_sample_requests ORDER BY id")
eco_rows = {r[0]: dict(zip(cols, r)) for r in cur_eco.fetchall()}

cur_curr.execute("SELECT * FROM create_sample_requests WHERE id <= 2687 ORDER BY id")
curr_rows = {r[0]: dict(zip(cols, r)) for r in cur_curr.fetchall()}

differences_per_col = {c: 0 for c in cols}
sample_diffs = {c: [] for c in cols}

for id, eco_r in eco_rows.items():
    curr_r = curr_rows.get(id)
    if not curr_r:
        continue
    for c in cols:
        v_eco = eco_r[c]
        v_curr = curr_r[c]
        if v_eco != v_curr:
            differences_per_col[c] += 1
            if len(sample_diffs[c]) < 5:
                sample_diffs[c].append((id, v_eco, v_curr))

print("Differences per column between samp_eco_db and navneet_samp:")
for c, cnt in differences_per_col.items():
    if cnt > 0:
        print(f"  - {c}: {cnt} rows differ")
        for s in sample_diffs[c][:3]:
            print(f"      ID {s[0]}: eco={s[1]!r} vs curr={s[2]!r}")

cur_eco.close()
cur_curr.close()
conn_eco.close()
conn_curr.close()
