import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { NEXT_PUBLIC_SUPABASE_URL:url, SUPABASE_SERVICE_ROLE_KEY:key, INITIAL_ADMIN_EMAIL:email, INITIAL_ADMIN_PASSWORD:password }=process.env;
if(!url||!key||!email||!password)throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD.");
if(password.length<6)throw new Error("INITIAL_ADMIN_PASSWORD must contain at least 6 characters.");
const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data,error}=await supabase.auth.admin.createUser({email,password,email_confirm:true});
if(error)throw error;
const username=email.split("@")[0].toUpperCase().replace(/[^A-Z0-9-]/g,"-");
const {error:profileError}=await supabase.from("profiles").insert({auth_user_id:data.user.id,username,name:"MODERATOR",whatsapp_number:process.env.INITIAL_ADMIN_WHATSAPP??"9999999999",role:"admin",must_change_password:true});
if(profileError){await supabase.auth.admin.deleteUser(data.user.id);throw profileError}
console.log(`Initial admin created for ${email}. The account must change its password on first login.`);
