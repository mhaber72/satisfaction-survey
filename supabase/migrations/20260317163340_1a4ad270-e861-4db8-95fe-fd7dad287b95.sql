
-- Fix profiles policies: change from public to authenticated
DROP POLICY "Admins can view all profiles" ON public.profiles;
DROP POLICY "Users can view own profile" ON public.profiles;
DROP POLICY "Admins can update profiles" ON public.profiles;
DROP POLICY "Admins can insert profiles" ON public.profiles;
DROP POLICY "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Fix user_roles policies: change from public to authenticated
DROP POLICY "Admins can manage roles" ON public.user_roles;
DROP POLICY "Admins can view all roles" ON public.user_roles;
DROP POLICY "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix access_profiles policies
DROP POLICY "Admins can manage access profiles" ON public.access_profiles;
DROP POLICY "Authenticated can view access profiles" ON public.access_profiles;

CREATE POLICY "Admins can manage access profiles" ON public.access_profiles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view access profiles" ON public.access_profiles FOR SELECT TO authenticated USING (true);

-- Fix access_profile_themes policies
DROP POLICY "Admins can manage profile themes" ON public.access_profile_themes;
DROP POLICY "Authenticated can view profile themes" ON public.access_profile_themes;

CREATE POLICY "Admins can manage profile themes" ON public.access_profile_themes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view profile themes" ON public.access_profile_themes FOR SELECT TO authenticated USING (true);

-- Fix action_statuses policies
DROP POLICY "Admins can manage action_statuses" ON public.action_statuses;
DROP POLICY "Authenticated can view action_statuses" ON public.action_statuses;

CREATE POLICY "Admins can manage action_statuses" ON public.action_statuses FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view action_statuses" ON public.action_statuses FOR SELECT TO authenticated USING (true);

-- Fix contract_managers policies
DROP POLICY "Admins can manage contract_managers" ON public.contract_managers;
DROP POLICY "Authenticated can view contract_managers" ON public.contract_managers;

CREATE POLICY "Admins can manage contract_managers" ON public.contract_managers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view contract_managers" ON public.contract_managers FOR SELECT TO authenticated USING (true);

-- Fix regional_managers policies
DROP POLICY "Admins can manage regional_managers" ON public.regional_managers;
DROP POLICY "Authenticated can view regional_managers" ON public.regional_managers;

CREATE POLICY "Admins can manage regional_managers" ON public.regional_managers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view regional_managers" ON public.regional_managers FOR SELECT TO authenticated USING (true);

-- Fix directories policies
DROP POLICY "Admins can manage directories" ON public.directories;
DROP POLICY "Authenticated can view directories" ON public.directories;

CREATE POLICY "Admins can manage directories" ON public.directories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view directories" ON public.directories FOR SELECT TO authenticated USING (true);
