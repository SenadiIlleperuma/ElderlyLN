const { createClient } = require("@supabase/supabase-js");
// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log the status of the environment variables
console.log("SUPABASE_URL:", supabaseUrl ? "loaded" : "missing");
console.log("SUPABASE_SERVICE_ROLE_KEY:", serviceRoleKey ? "loaded" : "missing");

// Check if the environment variables are loaded correctly
if (!supabaseUrl) throw new Error("SUPABASE_URL is missing in .env");
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env");

const supabase = createClient(supabaseUrl, serviceRoleKey);

module.exports = { supabase };