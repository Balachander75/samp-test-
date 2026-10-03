import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/samp_eco_db")
cur = conn.cursor()
cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
""")
tables = [r[0] for r in cur.fetchall()]
print("Tables in samp_eco_db:", tables)
for t in tables:
    cur.execute(f'SELECT COUNT(*) FROM "{t}";')
    cnt = cur.fetchone()[0]
    print(f"\nTable {t} ({cnt} rows):")
    cur.execute(f"""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '{t}' 
        ORDER BY ordinal_position;
    """)
    for col, dt in cur.fetchall():
        print(f"   - {col} ({dt})")
cur.close()
conn.close()
