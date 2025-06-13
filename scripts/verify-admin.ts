import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://aqweyygjshulavavmiyx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxd2V5eWdqc2h1bGF2YXZtaXl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY1OTk3MiwiZXhwIjoyMDY1MjM1OTcyfQ.ngAQE2HX2tWsUZs7ZzOu7Cj33knkJUt4vkvQco3RFK0"
);

async function verifyAdmin() {
  console.log("Verifying admin user...");

  // Try to sign in as admin
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: "admin@saintrix.com",
      password: "AdminTest123!",
    });

  if (signInError) {
    console.error("Error signing in as admin:", signInError);
    return;
  }

  console.log("Successfully signed in as admin:", signInData);

  // Verify role metadata
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error getting user data:", userError);
    return;
  }

  console.log("User metadata:", user?.user_metadata);
  console.log("Is admin?", user?.user_metadata?.role === "admin");

  // Sign out
  await supabase.auth.signOut();
  console.log("Signed out");
}

verifyAdmin().catch(console.error);
