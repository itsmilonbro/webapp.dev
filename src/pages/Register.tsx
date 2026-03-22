import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Phone, Mail, Lock } from "lucide-react";
import logo from "@/assets/logo.webp";

export default function Register() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", role: "" as "customer" | "reseller" | "sawmill_owner" | "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!/^01[3-9]\d{8}$/.test(form.phone)) e.phone = "Enter a valid 11-digit Bangladeshi phone number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.role) e.role = "Select a role";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const success = register({
        name: form.name, phone: form.phone, email: form.email,
        role: form.role as "customer" | "reseller" | "sawmill_owner",
        password: form.password,
      });
      setLoading(false);
      if (success) {
        toast({ title: "Registration Successful", description: "Please verify your email." });
        navigate("/verify-email", { state: { email: form.email } });
      } else {
        toast({ title: "Registration Failed", description: "Phone number already registered.", variant: "destructive" });
      }
    }, 800);
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md animate-fade-in shadow-card">
        <CardHeader className="items-center space-y-4 pb-2">
          <img src={logo} alt="AL-Madina Traders" className="h-16 w-16 rounded-xl object-cover" />
          <CardTitle className="font-display text-2xl">{t("register.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("register.fullName")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Your full name" value={form.name} onChange={e => update("name", e.target.value)} className="pl-10" />
              </div>
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("profile.phone")}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="01XXXXXXXXX" value={form.phone} onChange={e => update("phone", e.target.value)} className="pl-10" maxLength={11} />
              </div>
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("profile.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="you@example.com" value={form.email} onChange={e => update("email", e.target.value)} className="pl-10" />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("register.selectRole")}</Label>
              <Select onValueChange={v => update("role", v)}>
                <SelectTrigger><SelectValue placeholder={t("register.selectRole")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">{t("role.customer")}</SelectItem>
                  <SelectItem value="reseller">{t("role.reseller")}</SelectItem>
                  <SelectItem value="sawmill_owner">{t("role.sawmill_owner")}</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("login.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="••••••" value={form.password} onChange={e => update("password", e.target.value)} className="pl-10" />
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("register.submit")}
            </Button>
            <div className="text-center">
              <Link to="/" className="text-sm font-medium text-primary hover:underline">
                {t("register.hasAccount")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
