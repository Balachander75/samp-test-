import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/navneet_samp")
cur = conn.cursor()

# Check distinct target_plant values
cur.execute("SELECT target_plant, count(*) FROM create_sample_requests GROUP BY target_plant ORDER BY count(*) DESC;")
print("target_plant distribution in navneet_samp:")
for r in cur.fetchall():
    print(f"  {r[0]!r}: {r[1]} rows")

# Check plants table
cur.execute("SELECT id, code, name FROM plants;")
print("\nPlants table:")
for r in cur.fetchall():
    print(f"  id={r[0]}, code={r[1]!r}, name={r[2]!r}")

cur.close()
conn.close()
