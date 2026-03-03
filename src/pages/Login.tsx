import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logoIdl from "@/assets/logo-idl.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 130% 80% at 50% 30%, hsl(205,75%,25%) 0%, hsl(210,80%,14%) 40%, hsl(215,85%,8%) 100%)"
      }} />
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 70% 40% at 50% 20%, hsla(200,85%,55%,0.2) 0%, transparent 70%)"
      }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.25]" style={{
        backgroundImage: "radial-gradient(circle, hsla(200,80%,65%,1) 1.2px, transparent 1.2px)",
        backgroundSize: "28px 28px"
      }} />

      <Card className="relative z-10 w-full max-w-md border-[hsla(200,80%,60%,0.25)] bg-[hsla(210,70%,15%,0.8)] backdrop-blur-xl">
        <CardHeader className="items-center">
          <img src={logoIdl} alt="Logo" className="mb-4 h-16 w-auto" />
          <CardTitle className="text-2xl text-white">Iniciar Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[hsl(200,60%,70%)]">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white placeholder:text-[hsl(200,40%,50%)]"
                placeholder="tu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[hsl(200,60%,70%)]">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-[hsla(200,80%,60%,0.3)] bg-[hsla(210,70%,15%,0.5)] text-white placeholder:text-[hsl(200,40%,50%)]"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[hsl(200,80%,45%)] text-white hover:bg-[hsl(200,80%,55%)]"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
