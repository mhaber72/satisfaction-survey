import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { action, ...params } = await req.json();

    // Check if this is a bootstrap (no users exist yet)
    const authHeader = req.headers.get("Authorization");
    const isBootstrap = action === "create_user" && !authHeader;

    if (isBootstrap) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
      if (existingUsers?.users?.length > 0) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_ANON_KEY")!
      ).auth.getUser(token);

      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "create_user") {
      const { email, password, full_name, role, cargo, language, user_themes, user_clients } = params;
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (createError) throw createError;

      const userId = newUser.user.id;

      // Update profile with cargo and language
      const profileUpdate: any = { full_name, cargo: cargo || '' };
      if (language) profileUpdate.language = language;
      await supabaseAdmin.from("profiles").update(profileUpdate).eq("user_id", userId);

      // Set role
      if (role === "admin") {
        await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
        // Remove default 'user' role
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", "user");
      } else if (role === "superuser") {
        await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "superuser" }, { onConflict: "user_id,role" });
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", "user");
      }
      // else keep default 'user' role

      // Set user themes
      if (user_themes?.length) {
        await supabaseAdmin.from("user_themes").insert(
          user_themes.map((t: string) => ({ user_id: userId, theme_key: t }))
        );
      }

      // Set user clients
      if (user_clients?.length) {
        await supabaseAdmin.from("user_clients").insert(
          user_clients.map((c: string) => ({ user_id: userId, client_name: c }))
        );
      }

      return new Response(JSON.stringify({ user: newUser.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_user") {
      const { user_id, email, password, full_name, role, cargo, language, user_themes, user_clients } = params;
      
      const updateData: any = {};
      if (email) updateData.email = email;
      if (password) updateData.password = password;
      if (full_name) updateData.user_metadata = { full_name };

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, updateData);
        if (error) throw error;
      }

      // Update profile
      const profileUpdate: any = { full_name, email, cargo: cargo || '' };
      if (language) profileUpdate.language = language;
      await supabaseAdmin.from("profiles").update(profileUpdate).eq("user_id", user_id);

      // Update role - clear all roles first, then set the correct one
      await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
      await supabaseAdmin.from("user_roles").insert({ user_id, role: role || "user" });

      // Update user themes
      await supabaseAdmin.from("user_themes").delete().eq("user_id", user_id);
      if (user_themes?.length) {
        await supabaseAdmin.from("user_themes").insert(
          user_themes.map((t: string) => ({ user_id: user_id, theme_key: t }))
        );
      }

      // Update user clients
      await supabaseAdmin.from("user_clients").delete().eq("user_id", user_id);
      if (user_clients?.length) {
        await supabaseAdmin.from("user_clients").insert(
          user_clients.map((c: string) => ({ user_id: user_id, client_name: c }))
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_user") {
      const { user_id } = params;
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "batch_create_users") {
      const { users } = params;
      const results: any[] = [];
      for (const u of users) {
        try {
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { full_name: u.full_name },
          });
          if (createError) { results.push({ email: u.email, error: createError.message }); continue; }
          const userId = newUser.user.id;
          const profileUpdate: any = { full_name: u.full_name, cargo: u.cargo || '' };
          if (u.language) profileUpdate.language = u.language;
          await supabaseAdmin.from("profiles").update(profileUpdate).eq("user_id", userId);
          if (u.role === "admin") {
            await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
            await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", "user");
          } else if (u.role === "superuser") {
            await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "superuser" }, { onConflict: "user_id,role" });
            await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", "user");
          }
          if (u.user_themes?.length) {
            await supabaseAdmin.from("user_themes").insert(u.user_themes.map((t: string) => ({ user_id: userId, theme_key: t })));
          }
          if (u.user_clients?.length) {
            await supabaseAdmin.from("user_clients").insert(u.user_clients.map((c: string) => ({ user_id: userId, client_name: c })));
          }
          results.push({ email: u.email, success: true });
        } catch (e: any) {
          results.push({ email: u.email, error: e.message });
        }
      }
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('[admin-users] internal error:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred.' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
