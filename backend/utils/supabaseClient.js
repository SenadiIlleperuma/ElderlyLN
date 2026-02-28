const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("SUPABASE_URL:", supabaseUrl ? "loaded" : "missing");
console.log("SUPABASE_SERVICE_ROLE_KEY:", serviceRoleKey ? "loaded" : "missing");

if (!supabaseUrl) throw new Error("SUPABASE_URL is missing in .env");
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env");

const supabase = createClient(supabaseUrl, serviceRoleKey);

module.exports = { supabase };