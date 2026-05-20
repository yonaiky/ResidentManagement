-- Técnico de demostración (ejecutar en Supabase SQL Editor o: npm run seed:demo-technician con SERVICE_ROLE_KEY)
-- Credenciales: tecnico.demo@residencial.test / DemoTecnico2026!

DO $$
DECLARE
  tech_id uuid := gen_random_uuid();
  admin_id uuid;
  demo_email text := 'tecnico.demo@residencial.test';
  ticket_num text := 'TKT-' || to_char(NOW(), 'YYYY') || '-DEMO1';
  new_ticket_id int;
BEGIN
  SELECT id INTO admin_id FROM "Profile" WHERE role = 'admin' LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No hay usuario admin en Profile';
  END IF;

  DELETE FROM "TicketStatusHistory" WHERE "ticketId" IN (
    SELECT id FROM "MaintenanceTicket" WHERE "ticketNumber" LIKE '%-DEMO%'
  );
  DELETE FROM "TicketComment" WHERE "ticketId" IN (
    SELECT id FROM "MaintenanceTicket" WHERE "ticketNumber" LIKE '%-DEMO%'
  );
  DELETE FROM "MaintenanceTicket" WHERE "ticketNumber" LIKE '%-DEMO%';
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = demo_email);
  DELETE FROM auth.users WHERE email = demo_email;
  DELETE FROM "Profile" WHERE email = demo_email;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    tech_id,
    'authenticated',
    'authenticated',
    demo_email,
    crypt('DemoTecnico2026!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"tecnico_demo"}'::jsonb,
    NOW(), NOW(), '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    tech_id,
    tech_id,
    tech_id::text,
    jsonb_build_object('sub', tech_id::text, 'email', demo_email, 'email_verified', true),
    'email',
    NOW(), NOW(), NOW()
  );

  INSERT INTO "Profile" (id, username, email, role, "isActive", "createdAt", "updatedAt")
  VALUES (tech_id, 'tecnico_demo', demo_email, 'technician', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    role = 'technician',
    username = 'tecnico_demo',
    email = demo_email,
    "isActive" = true,
    "updatedAt" = NOW();

  INSERT INTO "MaintenanceTicket" (
    "ticketNumber", title, description, category, priority, status, location,
    "residentId", "createdById", "assignedToId", "slaDueAt", "slaBreached", "createdAt", "updatedAt"
  ) VALUES (
    ticket_num,
    'Fuga de agua en apto 3B (demo)',
    'Ticket de demostración para el técnico. Revisar conexión bajo lavamanos.',
    'plumbing', 'high', 'assigned', 'Torre A — Apto 3B',
    NULL, admin_id, tech_id, NOW() + interval '24 hours', false, NOW(), NOW()
  ) RETURNING id INTO new_ticket_id;

  INSERT INTO "TicketStatusHistory" ("ticketId", "fromStatus", "toStatus", "changedById", note)
  VALUES (new_ticket_id, NULL, 'open', admin_id, 'Ticket demo creado');

  INSERT INTO "TicketStatusHistory" ("ticketId", "fromStatus", "toStatus", "changedById", note)
  VALUES (new_ticket_id, 'open', 'assigned', admin_id, 'Asignado al técnico demo');
END $$;
