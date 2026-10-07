# Database Queries & Schema (`db/`)

This directory contains the complete database setup for **Navneet SAMP ERP** (PostgreSQL 14+).

## Files

- **`schema.sql`**: Full DDL schema — tables (`users`, `plants`, `customers`, `create_sample_requests`, `sample_request_types`, `product_characteristics`, `product_details`, `design_requests`, `design_request_activity_logs`, `feasibility_requests`, `feasibility_activity_logs`, `feasibility_reference_images`, `program_requests`, `program_material_specifications`, `program_activity_logs`, `refresh_tokens`, `login_audit_logs`), sequences, triggers, constraints, and indexes.
- **`seed_data.sql`**: Full seed & master data queries — manufacturing plants, admin user, 199 corporate customers, and packaging product characteristics catalog.

## Quick Setup Instructions

```bash
# 1. Create database
createdb -U postgres -h localhost navneet_samp

# 2. Run schema queries
psql -U postgres -h localhost -d navneet_samp -f db/schema.sql

# 3. Seed master data
psql -U postgres -h localhost -d navneet_samp -f db/seed_data.sql
```
