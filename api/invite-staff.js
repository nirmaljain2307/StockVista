// StockVista — /api/invite-staff.js
// Lets the owner invite someone who hasn't signed up yet, instead of
// requiring them to register on their own first. Uses Supabase's admin
// inviteUserByEmail — creates the auth account and emails them a link to
// set their own password (owner never sees or sets it, matching the
// "everyone gets their own login" principle already in place).

import { createClient } from '@supabase/supabase-js';

const VALID_ROLES = ['owner', 'research_analyst', 'finance', 'hr', 'marketing', 'compliance_officer', 'customer_support'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, role, invitedByEmail } = req.body || {};
  if (!email || !role) {
    return res.status(400).json({ error: 'email and role are required' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Check if this email already has an account — if so, just assign the
    // role instead of sending a duplicate invite.
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .ilike('email', email.trim())
      .maybeSingle();

    if (existing) {
      const { error: updateErr } = await supabaseAdmin
        .from('users')
        .update({ staff_role: role })
        .eq('id', existing.id);
      if (updateErr) return res.status(500).json({ error: updateErr.message });
      return res.status(200).json({ success: true, alreadyExisted: true, userId: existing.id });
    }

    // 2. New account — invite them (creates the auth user + sends the email)
    const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim(), {
      data: { invited_by: invitedByEmail || null, invited_role: role },
    });

    if (inviteErr) {
      return res.status(500).json({ error: inviteErr.message });
    }

    const newUserId = inviteData?.user?.id;
    if (!newUserId) {
      return res.status(500).json({ error: 'Invite succeeded but no user id was returned.' });
    }

    // 3. Create their row in the public users table with the role already set,
    // so it's ready the moment they accept the invite and set a password.
    const { error: upsertErr } = await supabaseAdmin
      .from('users')
      .upsert([{ id: newUserId, email: email.trim(), staff_role: role }], { onConflict: 'id' });

    if (upsertErr) {
      return res.status(500).json({ error: 'Invite sent but could not set role: ' + upsertErr.message });
    }

    return res.status(200).json({ success: true, alreadyExisted: false, userId: newUserId });
  } catch (err) {
    console.error('invite-staff error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
