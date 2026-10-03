import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/samp_eco_db")
cur = conn.cursor()

cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'create_sample_requests'
    ORDER BY ordinal_position;
""")
cols = cur.fetchall()

print("Non-null count for each column in samp_eco_db.create_sample_requests:")
for col_name, dt in cols:
    cur.execute(f"SELECT COUNT(\"{col_name}\") FROM create_sample_requests WHERE \"{col_name}\" IS NOT NULL AND \"{col_name}\"::text != '';")
    cnt = cur.fetchone()[0]
    print(f"  {col_name:30} ({dt:20}): {cnt} / 2684")

cur.close()
conn.close()
