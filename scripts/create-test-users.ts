import { createClient } from "@supabase/supabase-js";

// Use service role key for admin operations
const supabaseAdmin = createClient(
  "https://aqweyygjshulavavmiyx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxd2V5eWdqc2h1bGF2YXZtaXl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY1OTk3MiwiZXhwIjoyMDY1MjM1OTcyfQ.ngAQE2HX2tWsUZs7ZzOu7Cj33knkJUt4vkvQco3RFK0",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function createTestUsers() {
  console.log("Creating test users...");

  // Create admin user with auto-confirm
  const { data: adminData, error: adminError } =
    await supabaseAdmin.auth.admin.createUser({
      email: "admin@saintrix.com",
      password: "AdminTest123!",
      email_confirm: true,
      user_metadata: {
        role: "admin",
      },
    });

  if (adminError) {
    console.error("Error creating admin user:", adminError);
  } else {
    console.log("Admin user created:", adminData);
  }

  // Create client user
  const { data: clientData, error: clientError } =
    await supabaseAdmin.auth.admin.createUser({
      email: "client2@saintest.com",
      password: "ClientTest123!",
      email_confirm: true,
      user_metadata: {
        role: "client",
      },
    });

  if (clientError) {
    console.error("Error creating client user:", clientError);
  } else {
    console.log("Client user created:", clientData);
  }
}

createTestUsers().catch(console.error);
