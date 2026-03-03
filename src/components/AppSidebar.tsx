import { LayoutDashboard, Users, Shield, LogOut, Home } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logoIdl from "@/assets/logo-idl.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin, signOut, profile } = useAuth();

  const mainItems = [
    { title: "Temas", url: "/", icon: Home },
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  ];

  const adminItems = [
    { title: "Usuarios", url: "/admin/users", icon: Users },
    { title: "Perfiles de Acceso", url: "/admin/profiles", icon: Shield },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-[hsla(200,80%,60%,0.15)] bg-[hsl(215,85%,8%)]">
      <SidebarContent className="bg-[hsl(215,85%,8%)]">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4">
          <img src={logoIdl} alt="Logo" className="h-10 w-auto" />
          {!collapsed && (
            <span className="text-sm font-bold text-[hsl(200,70%,60%)]">CSS Analytics</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[hsl(200,60%,50%)]">Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="text-[hsl(200,40%,70%)] hover:bg-[hsla(200,80%,50%,0.1)] hover:text-white"
                      activeClassName="bg-[hsla(200,80%,50%,0.15)] text-white font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[hsl(200,60%,50%)]">Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="text-[hsl(200,40%,70%)] hover:bg-[hsla(200,80%,50%,0.1)] hover:text-white"
                        activeClassName="bg-[hsla(200,80%,50%,0.15)] text-white font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="bg-[hsl(215,85%,8%)] border-t border-[hsla(200,80%,60%,0.1)]">
        <div className="px-2 py-2">
          {!collapsed && (
            <p className="mb-2 truncate text-xs text-[hsl(200,40%,60%)]">
              {profile?.email || ""}
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-[hsl(200,40%,60%)] hover:bg-[hsla(0,80%,50%,0.1)] hover:text-[hsl(0,80%,70%)]"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {!collapsed && "Cerrar Sesión"}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
