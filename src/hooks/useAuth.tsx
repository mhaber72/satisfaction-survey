import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import i18n from "@/i18n";

type UserRole = "admin" | "superuser" | "user";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSuperUser: boolean;
  userRole: UserRole;
  loading: boolean;
  profile: any;
  allowedThemes: string[];
  allowedClients: string[];
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  isSuperUser: false,
  userRole: "user",
  loading: true,
  profile: null,
  allowedThemes: [],
  allowedClients: [],
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [allowedThemes, setAllowedThemes] = useState<string[]>([]);
  const [allowedClients, setAllowedClients] = useState<string[]>([]);

  const fetchUserData = async (userId: string) => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setProfile(profileData);

    // Set language from profile
    if (profileData?.language) {
      i18n.changeLanguage(profileData.language);
    }

    // Check admin role
    const { data: adminCheck } = await supabase
      .rpc("has_role", { _user_id: userId, _role: "admin" });
    const admin = adminCheck === true;
    setIsAdmin(admin);

    // Check superuser role
    const { data: superCheck } = await supabase
      .rpc("has_role", { _user_id: userId, _role: "superuser" });
    const superuser = superCheck === true;
    setIsSuperUser(superuser);

    if (admin) {
      setUserRole("admin");
      setAllowedThemes([]);
      setAllowedClients([]);
      return;
    }

    if (superuser) {
      setUserRole("superuser");
    } else {
      setUserRole("user");
    }

    // Fetch allowed themes from user_themes
    const { data: themes } = await supabase
      .from("user_themes")
      .select("theme_key")
      .eq("user_id", userId);
    setAllowedThemes(themes?.map((t: any) => t.theme_key) ?? []);

    // Fetch allowed clients from user_clients
    const { data: clients } = await supabase
      .from("user_clients")
      .select("client_name")
      .eq("user_id", userId);
    setAllowedClients(clients?.map((c: any) => c.client_name) ?? []);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsSuperUser(false);
          setUserRole("user");
          setAllowedThemes([]);
          setAllowedClients([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isSuperUser, userRole, loading, profile, allowedThemes, allowedClients, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
