import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/navneet_samp")
cur = conn.cursor()
cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
""")
tables = [r[0] for r in cur.fetchall()]
print("Tables in navneet_samp:", tables)

for t in tables:
    cur.execute(f"SELECT COUNT(*) FROM \"{t}\";")
    cnt = cur.fetchone()[0]
    print(f"  - {t}: {cnt} rows")

cur.close()
conn.close()
