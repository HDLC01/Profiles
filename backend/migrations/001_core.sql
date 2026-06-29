create extension if not exists "pgcrypto";

create table if not exists profiles (
    id            uuid primary key default gen_random_uuid(),
    clerk_user_id text unique not null,
    email         text,
    role          text not null default 'client',
    status        text not null default 'pending',
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create table if not exists skills (
    id       uuid primary key default gen_random_uuid(),
    name     text unique not null,
    active   boolean not null default true,
    ordering int not null default 0
);

create table if not exists software (
    id       uuid primary key default gen_random_uuid(),
    name     text unique not null,
    active   boolean not null default true,
    ordering int not null default 0
);

create table if not exists assessments (
    id       uuid primary key default gen_random_uuid(),
    name     text unique not null,
    active   boolean not null default true,
    ordering int not null default 0
);

create table if not exists candidates (
    id                  uuid primary key default gen_random_uuid(),
    slug                text unique not null,
    full_name           text not null,
    role_title          text not null default 'US Accountant/Bookkeeper',
    about               text,
    experience_label    text,
    price_monthly       int,
    availability        text,
    location            text default 'Philippines',
    credential          text,
    photo_url           text,
    intro_video_url     text,
    resume_url          text,
    resume_is_generated boolean not null default false,
    status              text not null default 'new',
    is_published        boolean not null default false,
    assess_job_id       uuid,
    assess_candidate_id uuid,
    ordering            int not null default 0,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);
create index if not exists idx_candidates_published on candidates (is_published);
create index if not exists idx_candidates_created on candidates (created_at desc);

create table if not exists candidate_skills (
    candidate_id uuid not null references candidates(id) on delete cascade,
    skill_id     uuid not null references skills(id) on delete cascade,
    primary key (candidate_id, skill_id)
);

create table if not exists candidate_software (
    candidate_id uuid not null references candidates(id) on delete cascade,
    software_id  uuid not null references software(id) on delete cascade,
    primary key (candidate_id, software_id)
);

create table if not exists candidate_assessments (
    candidate_id  uuid not null references candidates(id) on delete cascade,
    assessment_id uuid not null references assessments(id) on delete cascade,
    rating        text not null,
    primary key (candidate_id, assessment_id)
);

create table if not exists shortlists (
    clerk_user_id text not null,
    candidate_id  uuid not null references candidates(id) on delete cascade,
    created_at    timestamptz not null default now(),
    primary key (clerk_user_id, candidate_id)
);

create table if not exists events (
    id          bigint generated always as identity primary key,
    actor_email text,
    action      text not null,
    entity_type text,
    entity_id   text,
    detail      jsonb,
    created_at  timestamptz not null default now()
);
