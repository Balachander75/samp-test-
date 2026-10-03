# Backend Scripts Directory

This directory contains utility scripts for database migrations, historical data synchronization, and schema/table inspections.

## Directory Structure

### 1. `migrations/`
One-time and structural schema migration scripts.
- **`fix_plant_1508.py`**: Fixes historical plant assignments for plant 1508 records.
- **`migrate_feasibility_approver.py`**: Adds/updates approver tracking fields on feasibility requests.
- **`migrate_feasibility_creator.py`**: Migrates creator identity metadata for feasibility requests.
- **`migrate_feasibility_sampling_status.py`**: Updates status enumeration values for sampling workflows.
- **`migrate_feasibility_v2.py`**: Schema upgrades for feasibility requests v2 model.
- **`migrate_reference_data.py`**: Seeds customer and plant reference master data into `navneet_samp`.
- **`migrate_remove_feasibility_plant.py`**: Removes obsolete plant constraints from feasibility table.
- **`sync_from_samp_eco.py`**: Historical batch sync from legacy `samp_eco_db` into `navneet_samp`.
- **`verify_and_finalize_tables.py`**: Verification checks and trigger application for timestamps and foreign keys.

### 2. `diagnostics/`
Ad-hoc database inspection and integrity verification scripts.
- **`check_eco_nulls.py`**: Counts non-null values across columns.
- **`compare_eco_and_curr.py`**: Compares record counts between source and target databases.
- **`inspect_eco_detail.py`**: Inspects individual record details.
- **`inspect_eco_exact_records.py`**: Queries specific raw records for verification.
- **`inspect_eco_sample_requests.py`**: Checks column structures and sample request fields.
- **`inspect_indexes.py`**: Prints all indexes on core sample request tables.
- **`inspect_navneet_samp.py`**: Quick connection and table check on the `navneet_samp` database.
- **`inspect_plants.py`**: Checks plant reference master entries.
- **`inspect_samp_eco.py`**: Quick connection check on legacy `samp_eco_db`.
- **`inspect_tables_detail.py`**: Dumps schema metadata for core operational tables.

> [!NOTE]
> Scripts in `diagnostics/` and `migrations/sync_from_samp_eco.py` contain connection strings referencing `samp_eco_db` or local PostgreSQL instances. Always check connection parameters and run against test databases before running migrations against production environments.
