import psycopg2

conn_eco = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/samp_eco_db")
cur = conn_eco.cursor()

cur.execute("""
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'create_sample_requests' 
    ORDER BY ordinal_position
""")
cols = [r[0] for r in cur.fetchall()]

sample_ids = [4, 10, 100, 494, 1000, 1500, 2000, 2680]
cur.execute(f"SELECT * FROM create_sample_requests WHERE id IN ({','.join(map(str, sample_ids))}) ORDER BY id")
rows = cur.fetchall()

for r in rows:
    d = dict(zip(cols, r))
    print(f"--- ID {d['id']} ({d['sr_number']}) ---")
    for k, v in d.items():
        if v is not None and v != "":
            print(f"   {k}: {v}")

cur.close()
conn_eco.close()
