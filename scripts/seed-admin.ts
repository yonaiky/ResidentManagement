/**
 * Bootstrap first admin user.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret ADMIN_USERNAME=admin npx tsx scripts/seed-admin.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const email = process.env.ADMIN_EMAIL ?? '';
const password = process.env.ADMIN_PASSWORD ?? '';
const username = process.env.ADMIN_USERNAME || 'admin';

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function main() {
  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const prisma = new PrismaClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (error || !data.user) {
    console.error('Failed to create auth user:', error?.message);
    process.exit(1);
  }

  await prisma.profile.upsert({
    where: { id: data.user.id },
    create: {
      id: data.user.id,
      username,
      email,
      role: 'admin',
      isActive: true,
    },
    update: {
      username,
      email,
      role: 'admin',
      isActive: true,
    },
  });

  console.log('Admin created:', { id: data.user.id, email, username });
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
