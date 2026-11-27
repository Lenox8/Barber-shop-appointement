-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  username text NOT NULL,
  password text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  contato text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role USER-DEFINED NOT NULL DEFAULT 'user'::user_role,
  email text NOT NULL UNIQUE,
  timezone character varying DEFAULT 'Africa/Maputo'::character varying,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.stylist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cut_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stylist_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reservas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scheduled_at timestamp with time zone NOT NULL,
  cut_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  barber_id uuid,
  status_att USER-DEFINED DEFAULT 'pending'::status,
  CONSTRAINT reservas_pkey PRIMARY KEY (id),
  CONSTRAINT user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT cut_fkey FOREIGN KEY (cut_id) REFERENCES public.stylist(id)
);
CREATE TABLE public.outbox_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type character varying NOT NULL CHECK (event_type::text <> ''::text),
  payload jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  published_at timestamp with time zone,
  CONSTRAINT outbox_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  title character varying NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.barbers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  CONSTRAINT barbers_pkey PRIMARY KEY (id)
);