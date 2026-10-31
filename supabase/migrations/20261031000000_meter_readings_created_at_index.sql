-- Speeds up the dashboard's main query:
--   select ... from meter_readings order by created_at desc
-- Lets Postgres read rows in index order instead of sorting the whole table.
--
-- Note: CREATE INDEX CONCURRENTLY cannot run inside a transaction block, so if
-- you paste this into the SQL editor, run it on its own. For a table this small
-- a plain CREATE INDEX is also fine and avoids that restriction.

create index concurrently if not exists meter_readings_created_at_desc_idx
  on public.meter_readings (created_at desc);

analyze public.meter_readings;
