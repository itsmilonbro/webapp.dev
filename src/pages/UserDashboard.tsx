import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Home, User, FileText, Wrench, ShieldCheck, HeadphonesIcon, LogOut, Menu, X,
  ExternalLink, Facebook, Instagram, Linkedin, Twitter, Youtube, Globe, Lock, Send, Star, Image,
  CalendarIcon, Download, Languages, Sun, Moon
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type Tab = "home" | "profile" | "transactions" | "tools" | "policy" | "offers" | "support";

const TAB_ICONS: Record<Tab, React.ElementType> = {
  home: Home, profile: User, transactions: FileText, tools: Wrench,
  policy: ShieldCheck, offers: Star, support: HeadphonesIcon,
};

export default function UserDashboard() {
  const { currentUser, getUserTransactions, logout, updatePassword, updateUser, passwords } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [contactForm, setContactForm] = useState({ name: "", phone: "", subject: "", message: "" });
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const transactions = currentUser ? getUserTransactions(currentUser.id) : [];
  const perms = currentUser?.menuPermissions || {};

  const allMenuItems: { id: Tab; label: string }[] = [
    { id: "home", label: t("menu.home") },
    { id: "profile", label: t("menu.profile") },
    { id: "transactions", label: t("menu.transactions") },
    { id: "tools", label: t("menu.tools") },
    { id: "policy", label: t("menu.policy") },
    { id: "offers", label: t("menu.latestOffers") },
    { id: "support", label: t("menu.support") },
  ];

  const visibleMenuItems = allMenuItems.filter(item => perms[item.id]?.visible !== false);

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/itsmilonbro", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Youtube, href: "#", label: "YouTube" },
    { icon: Globe, href: "#", label: "Website" },
  ];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      if (dateFrom && txDate < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (txDate > endOfDay) return false;
      }
      return true;
    });
  }, [transactions, dateFrom, dateTo]);

  if (!currentUser) return <Navigate to="/" replace />;

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords[currentUser.id] && passwordForm.current !== passwords[currentUser.id]) {
      toast({ title: "Error", description: "Current password is incorrect.", variant: "destructive" });
      return;
    }
    if (passwordForm.new.length < 6) {
      toast({ title: "Error", description: "New password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    updatePassword(currentUser.id, passwordForm.new);
    toast({ title: "Password Updated", description: "📧 Email notification sent to you and admin. (Simulated)" });
    setPasswordForm({ current: "", new: "", confirm: "" });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    const msg = `*Support Request*\n\nName: ${contactForm.name || currentUser.name}\nPhone: ${contactForm.phone || currentUser.phone}\nSubject: ${contactForm.subject}\n\nMessage:\n${contactForm.message}`;
    window.open(`https://wa.me/8801955255066?text=${encodeURIComponent(msg)}`, "_blank");
    toast({ title: "Redirecting to WhatsApp", description: "Your message is ready to send." });
    setContactForm({ name: "", phone: "", subject: "", message: "" });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateUser(currentUser.id, { profilePhoto: ev.target?.result as string });
      toast({ title: "Profile Photo Updated", description: "📧 Email notification sent. (Simulated)" });
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const printStatement = () => {
    const txs = filteredTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dateRange = dateFrom || dateTo ? `${dateFrom ? format(dateFrom, "PP") : "Start"} - ${dateTo ? format(dateTo, "PP") : "Present"}` : "All Time";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Statement - ${currentUser.name}</title>
      <style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#0e7490;color:white}.right{text-align:right}h1{color:#0e7490}
      @media print{button{display:none}}</style></head>
      <body><h1>AL-Madina Traders</h1><h2>Transaction Statement</h2>
      <p><strong>Name:</strong> ${currentUser.name} | <strong>Phone:</strong> ${currentUser.phone}</p>
      <p><strong>Period:</strong> ${dateRange} | <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th>TXN ID</th><th>#</th><th>Date</th><th class="right">Sale</th><th class="right">Payment</th><th>Description</th><th class="right">Balance</th></tr></thead>
      <tbody>${txs.map((tx, i) => `<tr><td>${tx.transactionId || "-"}</td><td>${i + 1}</td><td>${new Date(tx.date).toLocaleDateString()}</td><td class="right">৳${tx.saleAmount.toFixed(2)}</td><td class="right">৳${tx.paymentAmount.toFixed(2)}</td><td>${tx.description}</td><td class="right">৳${tx.runningBalance.toFixed(2)}</td></tr>`).join("")}</tbody></table>
      <p style="margin-top:20px"><strong>Last Due Balance: ৳${currentUser.dueBalance.toFixed(2)}</strong></p>
      <button onclick="window.print()" style="margin-top:10px;padding:8px 20px;background:#0e7490;color:white;border:none;cursor:pointer;border-radius:4px">Print / Save PDF</button>
      </body></html>`);
    win.document.close();
  };

  const roleLabel = currentUser.role === "customer" ? "Customer Type" : currentUser.role === "sawmill_owner" ? "Sawmill Owner" : currentUser.role === "reseller" ? "Reseller" : currentUser.role;

  const isEditable = (section: Tab) => perms[section]?.editable === true;

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header Navigation */}
      <div className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4">
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto py-1">
            {visibleMenuItems.map(item => {
              const Icon = TAB_ICONS[item.id];
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    activeTab === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLang(lang === "en" ? "bn" : "en")} title={lang === "en" ? "বাংলা" : "English"}>
                <Languages className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive gap-1" onClick={logout}>
                <LogOut className="h-4 w-4" /> {t("nav.logout")}
              </Button>
            </div>
          </div>

          {/* Mobile nav */}
          <div className="flex items-center justify-between py-2 md:hidden">
            <span className="text-sm font-semibold truncate">{currentUser.name}</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLang(lang === "en" ? "bn" : "en")}>
                <Languages className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="border-t border-border pb-3 md:hidden">
              <div className="flex flex-col gap-1 pt-2">
                {visibleMenuItems.map(item => {
                  const Icon = TAB_ICONS[item.id];
                  return (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                      className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        activeTab === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}>
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
                <div className="flex flex-wrap gap-2 px-3 pt-2">
                  {socialLinks.map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground" title={s.label}>
                      <s.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
                <Button variant="ghost" className="justify-start text-destructive mx-2 mt-1" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* HOME */}
        {activeTab === "home" && (
          <div className="animate-fade-in space-y-6">
            <h1 className="font-display text-2xl font-bold">{t("menu.home")}</h1>
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {currentUser.profilePhoto ? (
                      <img src={currentUser.profilePhoto} alt="" className="h-16 w-16 rounded-full object-cover border-2 border-primary" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground text-2xl font-bold border-2 border-primary">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <Image className="h-3 w-3" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{currentUser.name}</h2>
                    <p className="text-sm text-muted-foreground capitalize">{roleLabel}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-accent/50 p-4 text-center">
                    <p className="text-xs text-muted-foreground">{t("profile.dueBalance")}</p>
                    <p className="text-xl font-bold text-foreground">৳{currentUser.dueBalance.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg bg-accent/50 p-4 text-center">
                    <p className="text-xs text-muted-foreground">{t("menu.transactions")}</p>
                    <p className="text-xl font-bold text-foreground">{transactions.length}</p>
                  </div>
                  <div className="rounded-lg bg-accent/50 p-4 text-center">
                    <p className="text-xs text-muted-foreground">{t("profile.expiryDate")}</p>
                    <p className="text-xl font-bold text-foreground">{currentUser.expiryDate || "N/A"}</p>
                  </div>
                </div>
                {/* Social links on desktop home */}
                <div className="hidden md:flex flex-wrap gap-2 pt-2">
                  {socialLinks.map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-primary hover:text-primary-foreground" title={s.label}>
                      <s.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div className="animate-fade-in space-y-6">
            <h1 className="font-display text-2xl font-bold">{t("profile.title")}</h1>
            <Card className="shadow-card">
              <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                {[
                  { label: t("profile.userId"), value: currentUser.id },
                  { label: t("profile.name"), value: currentUser.name },
                  { label: t("profile.phone"), value: currentUser.phone },
                  { label: t("profile.email"), value: currentUser.email },
                  { label: "Address", value: currentUser.address || "N/A" },
                  { label: t("profile.dueBalance"), value: `৳${currentUser.dueBalance.toFixed(2)}` },
                  { label: t("profile.expiryDate"), value: currentUser.expiryDate || "N/A" },
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    {isEditable("profile") ? (
                      <Input value={item.value} readOnly className="bg-muted/30" />
                    ) : (
                      <p className="font-medium text-foreground">{item.value}</p>
                    )}
                  </div>
                ))}
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("profile.paymentLink")}</p>
                  {currentUser.paymentLink ? (
                    <a href={currentUser.paymentLink} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="gap-2"><ExternalLink className="h-3 w-3" /> {t("common.payNow")}</Button>
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">No payment link available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Lock className="h-4 w-4" /> {t("profile.changePassword")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1"><Label>Current Password</Label><Input type="password" value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>New Password</Label><Input type="password" value={passwordForm.new} onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Confirm Password</Label><Input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} /></div>
                  <div className="sm:col-span-3"><Button type="submit" size="sm">Update Password</Button></div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="animate-fade-in space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="font-display text-2xl font-bold">{t("tx.title")}</h1>
              <Button size="sm" className="gap-2" onClick={printStatement}>
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </div>
            {/* Date range filter */}
            <div className="flex flex-wrap gap-3 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-2 text-left", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PP") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-2 text-left", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4" />
                    {dateTo ? format(dateTo, "PP") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>Clear</Button>
              )}
            </div>
            <Card className="shadow-card">
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10 hover:bg-primary/10">
                      <TableHead className="font-semibold text-primary">TXN ID</TableHead>
                      <TableHead className="w-12 font-semibold text-primary">#</TableHead>
                      <TableHead className="font-semibold text-primary">{t("tx.date")}</TableHead>
                      <TableHead className="text-right font-semibold text-primary">{t("tx.sale")}</TableHead>
                      <TableHead className="text-right font-semibold text-primary">{t("tx.payment")}</TableHead>
                      <TableHead className="font-semibold text-primary">{t("tx.description")}</TableHead>
                      <TableHead className="text-right font-semibold text-primary">{t("tx.balance")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">{t("common.noData")}</TableCell></TableRow>
                    ) : filteredTransactions.map((tx, i) => (
                      <TableRow key={tx.id} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                        <TableCell className="font-mono text-xs">{tx.transactionId || "-"}</TableCell>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right text-destructive font-medium">৳{tx.saleAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-success font-medium">৳{tx.paymentAmount.toFixed(2)}</TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell className="text-right font-bold">৳{tx.runningBalance.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TOOLS */}
        {activeTab === "tools" && (
          <div className="animate-fade-in space-y-4">
            <h1 className="font-display text-2xl font-bold">{t("menu.tools")}</h1>
            <Card className="shadow-card">
              <CardContent className="p-6 text-center text-muted-foreground">
                <Wrench className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                <p>Tools section coming soon. Admin will configure this area.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* YOUR POLICY UPDATE */}
        {activeTab === "policy" && (
          <div className="animate-fade-in space-y-4">
            <h1 className="font-display text-2xl font-bold">{t("menu.policy")}</h1>
            <Card className="shadow-card">
              <CardContent className="p-6">
                {currentUser.policyContent ? (
                  <div dangerouslySetInnerHTML={{ __html: currentUser.policyContent }} />
                ) : (
                  <p className="text-center text-muted-foreground">No policy content has been published by the admin yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* LATEST OFFERS */}
        {activeTab === "offers" && (
          <div className="animate-fade-in space-y-4">
            <h1 className="font-display text-2xl font-bold">{t("menu.latestOffers")}</h1>
            <Card className="shadow-card">
              <CardContent className="p-6 text-center text-muted-foreground">
                <Star className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                <p>No latest offers available at this time. Check back soon!</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SUPPORT */}
        {activeTab === "support" && (
          <div className="animate-fade-in space-y-4">
            <h1 className="font-display text-2xl font-bold">{t("support.title")}</h1>
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-lg">Submit an Issue or Complaint</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1"><Label>{t("support.name")}</Label><Input placeholder={currentUser.name} value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>{t("support.phone")}</Label><Input placeholder={currentUser.phone} value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div className="space-y-1 sm:col-span-2"><Label>{t("support.subject")}</Label><Input placeholder="Subject of your issue" value={contactForm.subject} onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))} /></div>
                  <div className="space-y-1 sm:col-span-2"><Label>{t("support.message")}</Label><Textarea rows={5} placeholder="Describe your issue or complaint..." value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} /></div>
                  <div className="sm:col-span-2"><Button type="submit" className="gap-2"><Send className="h-4 w-4" /> {t("support.submit")}</Button></div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
