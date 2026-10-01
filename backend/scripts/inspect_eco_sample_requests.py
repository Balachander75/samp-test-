import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/samp_eco_db")
cur = conn.cursor()

print("--- Inspecting date columns in samp_eco_db.create_sample_requests ---")
cur.execute("""
    SELECT 
        COUNT(*) as total,
        COUNT(date_request_created) as has_date_created,
        COUNT(sample_required_date) as has_sample_required_date,
        COUNT(target_artwork_date_creative) as has_creative_date,
        COUNT(target_artwork_date_studio) as has_studio_date,
        COUNT(created_at) as has_created_at
    FROM create_sample_requests;
""")
print("Counts:", cur.fetchone())

cur.execute("""
    SELECT id, sr_number, year, program_year, date_request_created, sample_required_date, 
           target_artwork_date_creative, target_artwork_date_studio, created_at
    FROM create_sample_requests
    ORDER BY id ASC
    LIMIT 10;
""")
print("\nFirst 10 rows in samp_eco_db:")
for r in cur.fetchall():
    print(r)

cur.execute("""
    SELECT id, sr_number, year, program_year, date_request_created, sample_required_date, 
           target_artwork_date_creative, target_artwork_date_studio, created_at
    FROM create_sample_requests
    WHERE sample_required_date IS NOT NULL
    LIMIT 10;
""")
print("\nRows with sample_required_date NOT NULL in samp_eco_db:")
rows_with_req = cur.fetchall()
print(f"Found {len(rows_with_req)} rows with non-null sample_required_date")
for r in rows_with_req:
    print(r)

print("\n--- Checking product_details for date-related characteristics ---")
cur.execute("""
    SELECT DISTINCT characteristic_name 
    FROM product_details 
    WHERE characteristic_name ILIKE '%date%' OR characteristic_name ILIKE '%req%' OR characteristic_name ILIKE '%time%'
    LIMIT 30;
""")
print("Date/Req characteristics:", cur.fetchall())

cur.close()
conn.close()
