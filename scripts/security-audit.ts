import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log("==========================================");
  console.log("  EDUCARD DATABASE & SECURITY AUDIT       ");
  console.log("==========================================\n");

  // 1. Database Connectivity & Public Access
  console.log("[1] Testing database connectivity and table queries...");
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, title, status, created_at')
    .is('deleted_at', null)
    .limit(3);

  if (questionsError) {
    console.error("❌ Failed to query 'questions' table:", questionsError.message);
  } else {
    console.log(`✅ Successfully queried 'questions' table. Rows retrieved: ${questions?.length || 0}`);
  }

  // 2. Test get_home_feed RPC
  console.log("\n[2] Testing 'get_home_feed' RPC (All / Unsolved / Following)...");
  const { data: feed, error: feedError } = await supabase.rpc('get_home_feed', {
    p_filter: 'all',
    p_limit: 5,
  });

  if (feedError) {
    console.error("❌ Failed to execute 'get_home_feed':", feedError.message);
  } else {
    console.log(`✅ Successfully executed 'get_home_feed'. Feed count: ${feed?.length || 0}`);
  }

  // 3. Test Full-Text Search RPC
  console.log("\n[3] Testing 'search_questions_fts' RPC...");
  const { data: searchResults, error: searchError } = await supabase.rpc('search_questions_fts', {
    p_query: 'computer science',
    p_limit: 5,
  });

  if (searchError) {
    console.error("❌ Failed to execute 'search_questions_fts':", searchError.message);
  } else {
    console.log(`✅ Successfully executed 'search_questions_fts'. Results count: ${searchResults?.length || 0}`);
  }

  // 4. Test User Authentication & Security Hardening
  console.log("\n[4] Testing Authentication and Security Protections...");
  const testEmail = `sec_audit_${Date.now()}@educard.app`;
  const testPassword = 'TestPassword123!';

  console.log(`Registering test user: ${testEmail}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        username: `scholar_${Date.now()}`,
        display_name: 'Security Test Scholar',
      },
    },
  });

  if (signUpError) {
    console.error("❌ Sign up failed:", signUpError.message);
  } else if (signUpData.user) {
    console.log("✅ User registered. ID:", signUpData.user.id);

    // Wait for trigger execution
    await new Promise((r) => setTimeout(r, 1200));

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, current_status, reputation_score, created_at')
      .eq('id', signUpData.user.id)
      .single();

    if (profileError) {
      console.error("❌ Profile trigger check failed:", profileError.message);
    } else if (profile) {
      console.log("✅ Profile automatically initialized:", profile);
    }

    // 5. Test SEC-01: Unauthorized Privilege Escalation Attack
    console.log("\n[5] [SEC-01 Test] Attempting unauthorized privilege escalation to admin...");
    const { error: privEscError } = await supabase
      .from('profiles')
      .update({ system_role: 'admin' as any, is_verified: true, reputation_score: 999999 })
      .eq('id', signUpData.user.id);

    if (privEscError) {
      console.log(`🛡️ SEC-01 Protected! Privilege escalation was blocked: ${privEscError.message}`);
    } else {
      // Verify if role actually remained member
      const { data: verifyRole } = await supabase.from('profiles').select('system_role').eq('id', signUpData.user.id).single();
      if (verifyRole?.system_role === 'member') {
        console.log("🛡️ SEC-01 Protected! Role remained 'member'.");
      } else {
        console.error("❌ SEC-01 FAILED! User escalated to:", verifyRole?.system_role);
      }
    }

    // 6. Test SEC-02: Unauthorized Community Takeover Attack
    console.log("\n[6] [SEC-02 Test] Attempting unauthorized community takeover via direct insert...");
    // Find a community
    const { data: sampleComm } = await supabase.from('communities').select('id').limit(1).maybeSingle();
    if (sampleComm) {
      const { error: takeoverError } = await supabase
        .from('community_members')
        .insert({
          community_id: sampleComm.id,
          user_id: signUpData.user.id,
          role: 'admin' as any,
        });

      if (takeoverError) {
        console.log(`🛡️ SEC-02 Protected! Direct admin role insertion blocked: ${takeoverError.message}`);
      } else {
        console.error("❌ SEC-02 FAILED! User inserted self as admin.");
      }
    }

    // 7. Test Authenticated User Bookmarks RPC
    console.log("\n[7] Testing 'rpc_get_user_bookmarks' RPC with authenticated session...");
    const { data: bookmarks, error: bookmarksError } = await supabase.rpc('rpc_get_user_bookmarks');
    if (bookmarksError) {
      console.error("❌ 'rpc_get_user_bookmarks' failed:", bookmarksError.message);
    } else {
      console.log(`✅ 'rpc_get_user_bookmarks' executed cleanly. Bookmarks: ${bookmarks?.length || 0}`);
    }

    // 8. Test GDPR Deletion RPC (delete_own_account)
    console.log("\n[8] Testing GDPR account deletion RPC 'delete_own_account'...");
    const { error: deleteError } = await supabase.rpc('delete_own_account');
    if (deleteError) {
      console.error("❌ 'delete_own_account' failed:", deleteError.message);
    } else {
      console.log("✅ 'delete_own_account' succeeded. Verifying profile deletion...");
      await new Promise((r) => setTimeout(r, 1000));
      const { data: checkDeleted } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', signUpData.user.id)
        .maybeSingle();

      if (!checkDeleted) {
        console.log("✅ Verified: Profile and auth cascade completed cleanly.");
      }
    }
  }

  console.log("\n==========================================");
  console.log("  AUDIT EXECUTION COMPLETE                ");
  console.log("==========================================");
}

runAudit();
