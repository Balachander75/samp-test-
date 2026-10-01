import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/samp_eco_db")
cur = conn.cursor()

tables = ['create_sample_requests', 'product_characteristics', 'product_details']

for t in tables:
    print(f"\nIndexes on {t}:")
    cur.execute("""
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = %s;
    """, (t,))
    for idx in cur.fetchall():
        print(f"  - {idx[0]}: {idx[1]}")

cur.close()
conn.close()
