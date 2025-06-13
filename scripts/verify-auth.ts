import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";

const SUPABASE_URL = "https://aqweyygjshulavavmiyx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxd2V5eWdqc2h1bGF2YXZtaXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTk5NzIsImV4cCI6MjA2NTIzNTk3Mn0.kff4HJExYCnPDNv-LxxO7qj6mY54H_2HCyJaFXcjkEY";

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogin(email: string, password: string) {
  console.log(`🔑 Testing login for ${email}...`);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("❌ Login failed:", error.message);
      return;
    }

    console.log("✅ Login successful");
    console.log("User:", data.user);
    console.log("Session:", data.session);

    // Check user role
    const role = data.user.user_metadata?.role;
    console.log("Role:", role);

    // Check if user exists in appropriate table
    if (role === "admin") {
      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (adminError) {
        console.log("❌ Admin record not found:", adminError.message);
      } else {
        console.log("✅ Admin record found:", admin);
      }
    } else if (role === "client") {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", data.user.id)
        .single();

      if (clientError) {
        console.log("❌ Client record not found:", clientError.message);
      } else {
        console.log("✅ Client record found:", client);
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Test admin login
testLogin("admin@saintrix.com", "admin123");

// Test client login
testLogin("client@saintrix.com", "client123");
