import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, Lock, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.webp";

export default function Index() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, currentUser, isAdmin } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // If already logged in, redirect
  if (currentUser) {
    navigate("/dashboard");
    return null;
  }
  if (isAdmin) {
    navigate("/admin");
    return null;
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!identifier.trim()) e.identifier = "Enter your phone number or username";
    if (password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const success = login(identifier.trim(), password);
      setLoading(false);
      if (success) {
        toast({ title: "Welcome back!", description: "Login successful." });
        // login() sets isAdmin or currentUser, useEffect will handle redirect
        // Check if admin
        if (identifier.trim() === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        toast({ title: "Login Failed", description: "Invalid credentials or account not approved.", variant: "destructive" });
      }
    }, 800);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-stretch">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden gradient-primary relative lg:flex lg:w-1/2 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          <img src={logo} alt="AL-Madina Traders" className="mb-8 h-28 w-28 rounded-2xl object-cover shadow-xl ring-4 ring-white/20" />
          <h1 className="font-display text-4xl font-extrabold text-primary-foreground leading-tight">
            {t("app.name")}
          </h1>
          <p className="mt-4 max-w-sm text-primary-foreground/75 text-base leading-relaxed">
            Your trusted trading partner. Manage your business, track transactions, and grow with confidence.
          </p>
          <div className="mt-10 flex items-center gap-3 text-primary-foreground/50 text-xs">
            <span className="h-px w-10 bg-primary-foreground/20" />
            Secure &amp; Reliable
            <span className="h-px w-10 bg-primary-foreground/20" />
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile-only logo */}
          <div className="flex flex-col items-center lg:hidden">
            <img src={logo} alt="AL-Madina Traders" className="h-20 w-20 rounded-xl object-cover shadow-md" />
            <h1 className="mt-3 font-display text-xl font-bold text-foreground">{t("app.name")}</h1>
          </div>

          <div className="space-y-1 text-center lg:text-left">
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">{t("login.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-foreground">{t("login.phone")}</Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="identifier"
                  placeholder="01XXXXXXXXX or admin"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="h-12 pl-11 text-base rounded-xl border-border bg-muted/40 focus:bg-background transition-colors"
                  maxLength={20}
                />
              </div>
              {errors.identifier && <p className="text-sm text-destructive">{errors.identifier}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">{t("login.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 pl-11 pr-11 text-base rounded-xl border-border bg-muted/40 focus:bg-background transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("login.signin")}
            </Button>
          </form>

          <div className="relative flex items-center justify-center">
            <span className="absolute inset-x-0 h-px bg-border" />
            <span className="relative bg-background px-3 text-xs text-muted-foreground">{t("login.or")}</span>
          </div>

          <div className="text-center">
            <Link to="/register">
              <Button variant="outline" className="w-full h-11 rounded-xl font-medium">
                {t("login.register")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
