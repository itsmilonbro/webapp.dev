import logo from "@/assets/logo.webp";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LogOut, Menu, X, Sun, Moon, Languages } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export default function Navbar() {
  const { currentUser, isAdmin, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoggedIn = currentUser || isAdmin;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const toggleLang = () => setLang(lang === "en" ? "bn" : "en");

  return (
    <nav className="gradient-primary sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="AL-Madina Traders" className="h-10 w-10 rounded-lg object-cover" />
          <span className="font-display text-lg font-bold text-primary-foreground md:text-xl">
            {t("app.name")}
          </span>
        </Link>

        {/* Desktop right-side items */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Language toggle */}
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={toggleLang} title={lang === "en" ? "বাংলা" : "English"}>
            <Languages className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium text-primary-foreground/70 mr-1">{lang === "en" ? "EN" : "বা"}</span>

          {/* Theme toggle */}
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {isLoggedIn && (
            <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="text-primary-foreground md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-primary-foreground/10 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-primary-foreground" onClick={toggleLang}>
                <Languages className="mr-1 h-4 w-4" /> {lang === "en" ? "বাংলা" : "English"}
              </Button>
              <Button variant="ghost" size="sm" className="text-primary-foreground" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="mr-1 h-4 w-4" /> : <Moon className="mr-1 h-4 w-4" />}
                {theme === "dark" ? "Light" : "Dark"}
              </Button>
            </div>
            {isLoggedIn && (
              <Button variant="ghost" className="w-full justify-start text-primary-foreground" onClick={() => { handleLogout(); setMobileOpen(false); }}>
                <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
