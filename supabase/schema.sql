-- Run this once in Supabase → SQL Editor

create table if not exists tickets (
  id bigserial primary key,
  ticket_id text unique not null,
  customer_name text not null,
  customer_email text not null,
  subject text not null,
  description text not null,
  status text not null default 'Open'
    check (status in ('Open', 'In Progress', 'Closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notes (
  id bigserial primary key,
  ticket_id text not null references tickets(ticket_id) on delete cascade,
  note_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_tickets_status on tickets(status);
create index if not exists idx_tickets_created_at on tickets(created_at desc);
create index if not exists idx_notes_ticket_id on notes(ticket_id);
