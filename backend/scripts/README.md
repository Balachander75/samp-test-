# Backend Scripts Directory

This directory contains migration utilities and verification tools for database schemas and historical data.

## Directory Structure

### `migrations/`
Structural schema migration scripts and verification tools:
- **`fix_plant_1508.py`**: Fixes historical plant assignments for plant 1508 records.
- **`migrate_feasibility_approver.py`**: Adds/updates approver tracking fields on feasibility requests.
- **`migrate_feasibility_creator.py`**: Migrates creator identity metadata for feasibility requests.
- **`migrate_feasibility_sampling_status.py`**: Updates status enumeration values for sampling workflows.
- **`migrate_feasibility_v2.py`**: Schema upgrades for feasibility requests v2 model.
- **`migrate_reference_data.py`**: Seeds customer and plant reference master data into `navneet_samp`.
- **`migrate_remove_feasibility_plant.py`**: Removes obsolete plant constraints from feasibility table.
- **`sync_from_samp_eco.py`**: Historical batch sync from legacy `samp_eco_db` into `navneet_samp`.
- **`verify_and_finalize_tables.py`**: Verification checks and trigger application for timestamps and foreign keys.
