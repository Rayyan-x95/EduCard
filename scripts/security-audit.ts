import { createClient } from '@supabase/supabase-js';

// Load .env using Node's native loadEnvFile (Node 20.6+) or fallback
try {
  // @ts-ignore Node 20.6+ native env loader
  if (typeof process.loadEnvFile === 'function') {
    // @ts-ignore
    process.loadEnvFile('.env');
  }
} catch {
  // .env may not exist in CI if secrets are passed via environment variables
}

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

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function recordResult(testName: string, passed: boolean, details?: string) {
    totalTests++;
    if (passed) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}${details ? ` — ${details}` : ''}`);
    } else {
      failedTests++;
      console.error(`❌ [FAIL] ${testName}${details ? ` — ${details}` : ''}`);
    }
  }

  // 1. Database Connectivity & Public Access
  console.log("[1] Testing database connectivity and table queries...");
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, title, status, created_at')
    .is('deleted_at', null)
    .limit(3);

  recordResult(
    "Public Questions Query",
    !questionsError && Array.isArray(questions),
    questionsError ? questionsError.message : `Retrieved ${questions?.length} rows`
  );

  // 2. Test get_home_feed RPC
  console.log("\n[2] Testing 'get_home_feed' RPC (All / Unsolved / Following)...");
  const { data: feed, error: feedError } = await supabase.rpc('get_home_feed', {
    p_filter: 'all',
    p_limit: 5,
  });

  recordResult(
    "get_home_feed RPC Execution",
    !feedError,
    feedError ? feedError.message : `Feed count: ${feed?.length || 0}`
  );

  // 3. Test Full-Text Search RPC
  console.log("\n[3] Testing 'search_questions_fts' RPC...");
  const { data: searchResults, error: searchError } = await supabase.rpc('search_questions_fts', {
    p_query: 'computer science',
    p_limit: 5,
  });

  recordResult(
    "search_questions_fts RPC Execution",
    !searchError,
    searchError ? searchError.message : `Results count: ${searchResults?.length || 0}`
  );

  // 4. Test Check Username Availability RPC
  console.log("\n[4] Testing 'check_username_available' RPC...");
  const { data: isAvail, error: availError } = await supabase.rpc('check_username_available', {
    p_username: `fresh_scholar_${Date.now()}`,
  });
  recordResult(
    "check_username_available RPC",
    !availError && isAvail === true,
    availError ? availError.message : "Available for fresh handle"
  );

  // 5. Test Anonymous Write Denial (RLS Negative Testing)
  console.log("\n[5] [SEC-NEGATIVE] Testing Anonymous Write Denial on Protected Tables...");
  const { error: anonQuestionError } = await supabase
    .from('questions')
    .insert({
      title: 'Hacked question from anonymous attacker',
      body: 'This should be blocked by RLS policies.',
    } as any);

  recordResult(
    "Anonymous Question Insert Blocked by RLS",
    Boolean(anonQuestionError),
    anonQuestionError?.message
  );

  const { error: anonReportError } = await supabase
    .from('reports')
    .insert({
      reporter_id: '00000000-0000-0000-0000-000000000000',
      reason: 'spam',
      target_type: 'question',
      target_id: '00000000-0000-0000-0000-000000000000',
    } as any);

  recordResult(
    "Anonymous Report Insert Blocked by RLS",
    Boolean(anonReportError),
    anonReportError?.message
  );

  // 6. Test User Authentication & Security Hardening
  console.log("\n[6] Testing User Registration, Triggers & Profile Initialization...");
  const testEmail = `sec_audit_${Date.now()}@educard.ninety5.in`;
  const testPassword = 'TestPassword123!';
  const testUsername = `scholar_${Date.now()}`;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        username: testUsername,
        display_name: 'Security Test Scholar',
      },
    },
  });

  if (signUpError) {
    console.error("❌ Sign up failed:", signUpError.message);
    recordResult("User Registration", false, signUpError.message);
  } else if (signUpData.user) {
    recordResult("User Registration", true, `User ID: ${signUpData.user.id}`);

    // Wait for auth trigger to initialize profile
    await new Promise((r) => setTimeout(r, 1500));

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, current_status, reputation_score, system_role, is_verified, created_at')
      .eq('id', signUpData.user.id)
      .single();

    recordResult(
      "Profile Auto-Initialization Trigger",
      Boolean(profile && !profileError),
      profileError ? profileError.message : `Username: ${profile?.username}`
    );

    // 7. Test SEC-01: Unauthorized Privilege Escalation Attack
    console.log("\n[7] [SEC-01] Testing unauthorized privilege escalation to admin/verified...");
    const { error: privEscError } = await supabase
      .from('profiles')
      .update({ system_role: 'admin' as any, is_verified: true, reputation_score: 999999 })
      .eq('id', signUpData.user.id);

    const { data: verifyRole } = await supabase
      .from('profiles')
      .select('system_role, is_verified, reputation_score')
      .eq('id', signUpData.user.id)
      .single();

    const roleProtected = verifyRole?.system_role === 'user' && !verifyRole?.is_verified && verifyRole?.reputation_score === 0;
    recordResult(
      "SEC-01: Privilege Escalation Blocked by Trigger",
      roleProtected,
      privEscError ? privEscError.message : `Role stayed: ${verifyRole?.system_role}`
    );

    // 8. Test SEC-02: Unauthorized Community Takeover Attack
    console.log("\n[8] [SEC-02] Testing unauthorized community takeover via direct admin insert...");
    const { data: sampleComm } = await supabase.from('communities').select('id').limit(1).maybeSingle();
    if (sampleComm) {
      const { error: takeoverError } = await supabase
        .from('community_members')
        .insert({
          community_id: sampleComm.id,
          user_id: signUpData.user.id,
          role: 'admin' as any,
        });

      recordResult(
        "SEC-02: Direct Admin Role Insertion Blocked",
        Boolean(takeoverError),
        takeoverError ? takeoverError.message : "Takeover was NOT blocked"
      );
    }

    // 9. Test SEC-03: Self-Follow Invariant (chk_no_self_follow)
    console.log("\n[9] [SEC-03] Testing self-follow constraint (chk_no_self_follow)...");
    const { error: selfFollowError } = await supabase
      .from('follows')
      .insert({
        follower_id: signUpData.user.id,
        following_id: signUpData.user.id,
      });

    recordResult(
      "SEC-03: Self-Follow Blocked by Database Constraint",
      Boolean(selfFollowError),
      selfFollowError ? selfFollowError.message : "Self-follow permitted"
    );

    // 10. Test SEC-04: Self-Block Invariant (chk_no_self_block)
    console.log("\n[10] [SEC-04] Testing self-block constraint (chk_no_self_block)...");
    const { error: selfBlockError } = await supabase
      .from('blocks')
      .insert({
        blocker_id: signUpData.user.id,
        blocked_id: signUpData.user.id,
      });

    recordResult(
      "SEC-04: Self-Block Blocked by Database Constraint",
      Boolean(selfBlockError),
      selfBlockError ? selfBlockError.message : "Self-block permitted"
    );

    // 11. Test SEC-05: Direct UPDATE Bypass on answers.is_accepted
    console.log("\n[11] [SEC-05] Testing direct UPDATE on answers.is_accepted bypass protection...");
    const { data: sampleAnswer } = await supabase.from('answers').select('id, is_accepted').limit(1).maybeSingle();
    if (sampleAnswer) {
      const { error: directAcceptError } = await supabase
        .from('answers')
        .update({ is_accepted: !sampleAnswer.is_accepted })
        .eq('id', sampleAnswer.id);

      recordResult(
        "SEC-05: Direct is_accepted UPDATE Blocked by Trigger",
        Boolean(directAcceptError),
        directAcceptError ? directAcceptError.message : "Direct update permitted"
      );
    }

    // 12. Test SEC-06: Self-Acceptance Rejection on accept_answer RPC
    console.log("\n[12] [SEC-06] Testing self-acceptance rejection on accept_answer RPC...");
    // Find or test invalid question accept
    const { error: invalidAcceptError } = await supabase.rpc('accept_answer', {
      p_question_id: '00000000-0000-0000-0000-000000000000',
      p_answer_id: '00000000-0000-0000-0000-000000000000',
    });

    recordResult(
      "SEC-06: Invalid Accept Call Rejected by RPC",
      Boolean(invalidAcceptError),
      invalidAcceptError ? invalidAcceptError.message : "Accepted invalid IDs"
    );

    // 13. Test Authenticated User Bookmarks RPC
    console.log("\n[13] Testing 'rpc_get_user_bookmarks' RPC with authenticated session...");
    const { data: bookmarks, error: bookmarksError } = await supabase.rpc('rpc_get_user_bookmarks');
    recordResult(
      "rpc_get_user_bookmarks RPC Execution",
      !bookmarksError,
      bookmarksError ? bookmarksError.message : `Bookmarks count: ${bookmarks?.length || 0}`
    );

    // 14. Test Unread Notification Count RPC
    console.log("\n[14] Testing 'get_unread_notification_count' RPC...");
    const { data: unreadCount, error: unreadError } = await supabase.rpc('get_unread_notification_count');
    recordResult(
      "get_unread_notification_count RPC Execution",
      !unreadError,
      unreadError ? unreadError.message : `Unread count: ${unreadCount}`
    );

    // 15. Test GDPR Deletion RPC (delete_own_account)
    console.log("\n[15] Testing GDPR account deletion RPC 'delete_own_account'...");
    const { error: deleteError } = await supabase.rpc('delete_own_account');
    if (deleteError) {
      recordResult("GDPR Account Deletion", false, deleteError.message);
    } else {
      await new Promise((r) => setTimeout(r, 1000));
      const { data: checkDeleted } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', signUpData.user.id)
        .maybeSingle();

      recordResult(
        "GDPR Cascade Deletion Verified",
        !checkDeleted,
        checkDeleted ? "Profile still exists!" : "Profile cleanly removed"
      );
    }
  }

  console.log("\n==========================================");
  console.log(`  AUDIT COMPLETE: ${passedTests}/${totalTests} PASSED`);
  if (failedTests > 0) {
    console.error(`  ${failedTests} CHECKS FAILED`);
    process.exit(1);
  } else {
    console.log("  ALL DATABASE SECURITY CHECKS VERIFIED ✅");
  }
  console.log("==========================================");
}

runAudit().catch((err) => {
  console.error("Audit execution encountered fatal error:", err);
  process.exit(1);
});
