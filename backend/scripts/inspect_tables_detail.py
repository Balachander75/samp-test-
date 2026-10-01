import psycopg2
import json

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/samp_eco_db")
cur = conn.cursor()

tables = ['create_sample_requests', 'product_characteristics', 'product_details']

for t in tables:
    print(f"\n=================== TABLE: {t} ===================")
    cur.execute("""
        SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s
        ORDER BY ordinal_position;
    """, (t,))
    cols = cur.fetchall()
    for col in cols:
        print(f"  {col[0]}: {col[1]} (len={col[2]}, nullable={col[3]}, default={col[4]})")
    
    # Check primary key and foreign keys
    cur.execute("""
        SELECT conname, pg_get_constraintdef(c.oid)
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE conrelid = %s::regclass;
    """, (f'"{t}"',))
    constraints = cur.fetchall()
    print("  Constraints:")
    for c in constraints:
        print(f"    - {c[0]}: {c[1]}")

    # Sample row
    cur.execute(f'SELECT * FROM "{t}" LIMIT 1;')
    row = cur.fetchone()
    col_names = [desc[0] for desc in cur.description]
    sample = dict(zip(col_names, [str(v) if v is not None else None for v in row]))
    print(f"  Sample row: {json.dumps(sample, indent=4)}")

cur.close()
conn.close()
