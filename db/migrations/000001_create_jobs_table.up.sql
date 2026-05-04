BEGIN;

CREATE TYPE enum_status AS ENUM (
    'submitted',
    'runnable',
    'running',
    'succeeded',
    'failed'
);

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image TEXT NOT NULL,
    command TEXT NULL,
    env_vars JSONB NULL,
    container_id TEXT NULL,
    status enum_status NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_status ON jobs(status);

COMMIT;