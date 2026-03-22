import { useState, useRef, useMemo } from "react";
import { useAuth, User, ROLE_LABELS, DEFAULT_MENU_ITEMS, MenuItem, MenuPermission } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Users, Clock, DollarSign, FileText, UserCheck, UserX, Pencil, Trash2,
  Plus, LogOut, Menu, X, LayoutDashboard, Send, MessageSquare, Database,
  Download, Upload, Search, Eye, Shield, Activity, Printer, ArrowLeft, Image, CalendarIcon
} from "lucide-react";

const MENU_LABELS: Record<MenuItem, string> = {
  home: "Home", profile: "Profile", transactions: "Transactions",
  tools: "Tools", policy: "Your Policy Update", offers: "Latest Offers", support: "Support/Contact",
};

export default function AdminDashboard() {
  const {
    isAdmin, users, transactions, logout,
    approveUser, rejectUser, updateUser, deleteUser, createUser,
    addTransaction, passwords, updatePassword,
    exportBackup, importBackup,
  } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", phone: "", email: "", address: "", role: "customer" as any, status: "approved", dueBalance: "0", paymentLink: "", expiryDate: "" });
  const [txForm, setTxForm] = useState({ userId: "", date: new Date().toISOString().split("T")[0], saleAmount: "", paymentAmount: "", description: "" });
  const [whatsappModal, setWhatsappModal] = useState<{ open: boolean; message: string; userId: string }>({ open: false, message: "", userId: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileForm, setProfileForm] = useState<any>({});
  const [profilePerms, setProfilePerms] = useState<Record<MenuItem, MenuPermission>>({} as any);
  const [profilePassword, setProfilePassword] = useState("");
  const [profilePolicyContent, setProfilePolicyContent] = useState("");

  // Date range for admin transaction statement
  const [stmtDateFrom, setStmtDateFrom] = useState<Date | undefined>();
  const [stmtDateTo, setStmtDateTo] = useState<Date | undefined>();
  const [stmtUserId, setStmtUserId] = useState<string>("");

  if (!isAdmin) return <Navigate to="/" replace />;

  const pendingUsers = users.filter(u => u.status === "pending");
  const totalDue = users.reduce((s, u) => s + u.dueBalance, 0);
  const selectedUser = selectedUserId ? users.find(u => u.id === selectedUserId) : null;

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.email.toLowerCase().includes(q);
  });

  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "approvals", label: "Approvals", icon: Clock },
    { id: "transactions", label: "Transactions", icon: FileText },
    { id: "database", label: "Database", icon: Database },
    { id: "logs", label: "Login Logs", icon: Activity },
  ];

  const openUserProfile = (userId: string) => {
    setSelectedUserId(userId);
    setActiveTab("user-profile");
  };

  const handleCreate = () => {
    createUser({ ...createForm, dueBalance: parseFloat(createForm.dueBalance) || 0 } as any);
    setCreateOpen(false);
    toast({ title: "User Created", description: "Default password: default123" });
  };

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.userId) { toast({ title: "Select a user", variant: "destructive" }); return; }
    const user = users.find(u => u.id === txForm.userId);
    const tx = addTransaction({
      userId: txForm.userId, date: txForm.date,
      saleAmount: parseFloat(txForm.saleAmount) || 0,
      paymentAmount: parseFloat(txForm.paymentAmount) || 0,
      description: txForm.description,
    });

    // Simulated email notification
    toast({ title: "Transaction Saved", description: `📧 Email notification sent to ${user?.name}. (Simulated)` });

    // WhatsApp notification with transaction summary
    const msg = `*Transaction Summary*\n\nTXN ID: ${tx.transactionId}\nName: ${user?.name}\nDate: ${tx.date}\nSale: ৳${tx.saleAmount.toFixed(2)}\nPayment: ৳${tx.paymentAmount.toFixed(2)}\nBalance: ৳${tx.runningBalance.toFixed(2)}\nDescription: ${tx.description}\n\n- AL-Madina Traders`;
    setWhatsappModal({ open: true, message: msg, userId: txForm.userId });
    setTxForm({ userId: txForm.userId, date: new Date().toISOString().split("T")[0], saleAmount: "", paymentAmount: "", description: "" });
  };

  const handleExportBackup = () => {
    const data = exportBackup();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `amt-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: "Backup Downloaded" });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = importBackup(ev.target?.result as string);
      toast({ title: ok ? "Backup Restored" : "Invalid Backup File", variant: ok ? "default" : "destructive" });
    };
    reader.readAsText(file);
  };

  const printStatement = (userId: string, fromDate?: Date, toDate?: Date) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    let userTx = transactions.filter(t => t.userId === userId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (fromDate) userTx = userTx.filter(t => new Date(t.date) >= fromDate);
    if (toDate) {
      const end = new Date(toDate); end.setHours(23, 59, 59, 999);
      userTx = userTx.filter(t => new Date(t.date) <= end);
    }
    const dateRange = fromDate || toDate ? `${fromDate ? format(fromDate, "PP") : "Start"} - ${toDate ? format(toDate, "PP") : "Present"}` : "All Time";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Statement - ${user.name}</title>
      <style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#0e7490;color:white}.right{text-align:right}h1{color:#0e7490}
      @media print{button{display:none}}</style></head>
      <body><h1>AL-Madina Traders</h1><h2>Transaction Statement</h2>
      <p><strong>Name:</strong> ${user.name} | <strong>Phone:</strong> ${user.phone} | <strong>Email:</strong> ${user.email}</p>
      <p><strong>Period:</strong> ${dateRange} | <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th>TXN ID</th><th>#</th><th>Date</th><th class="right">Sale</th><th class="right">Payment</th><th>Description</th><th class="right">Balance</th></tr></thead>
      <tbody>${userTx.map((tx, i) => `<tr><td>${tx.transactionId || "-"}</td><td>${i + 1}</td><td>${new Date(tx.date).toLocaleDateString()}</td><td class="right">৳${tx.saleAmount.toFixed(2)}</td><td class="right">৳${tx.paymentAmount.toFixed(2)}</td><td>${tx.description}</td><td class="right">৳${tx.runningBalance.toFixed(2)}</td></tr>`).join("")}</tbody></table>
      <p style="margin-top:20px"><strong>Last Due Balance: ৳${user.dueBalance.toFixed(2)}</strong></p>
      <button onclick="window.print()" style="margin-top:10px;padding:8px 20px;background:#0e7490;color:white;border:none;cursor:pointer;border-radius:4px">Print / Save PDF</button>
      </body></html>`);
    win.document.close();
  };

  // Profile editor helpers
  const loadProfileForm = (user: User) => {
    setProfileForm({
      name: user.name, phone: user.phone, email: user.email, address: user.address || "",
      dueBalance: String(user.dueBalance), paymentLink: user.paymentLink, expiryDate: user.expiryDate,
      comments: user.comments || "", role: user.role, status: user.status,
    });
    setProfilePerms(user.menuPermissions || {} as any);
    setProfilePassword(passwords[user.id] || "");
    setProfilePolicyContent(user.policyContent || "");
  };

  if (selectedUser && profileForm._loaded !== selectedUser.id) {
    loadProfileForm(selectedUser);
    setProfileForm((p: any) => ({ ...p, _loaded: selectedUser.id }));
  }

  const saveProfile = () => {
    if (!selectedUser) return;
    const changes: string[] = [];
    if (profileForm.name !== selectedUser.name) changes.push(`Name: ${selectedUser.name} → ${profileForm.name}`);
    if (profileForm.phone !== selectedUser.phone) changes.push(`Phone: ${selectedUser.phone} → ${profileForm.phone}`);
    if (profileForm.email !== selectedUser.email) changes.push(`Email: ${selectedUser.email} → ${profileForm.email}`);

    updateUser(selectedUser.id, {
      name: profileForm.name, phone: profileForm.phone, email: profileForm.email,
      address: profileForm.address, dueBalance: parseFloat(profileForm.dueBalance) || 0,
      paymentLink: profileForm.paymentLink, expiryDate: profileForm.expiryDate,
      comments: profileForm.comments, role: profileForm.role, status: profileForm.status,
      menuPermissions: profilePerms, policyContent: profilePolicyContent,
    });
    if (profilePassword && profilePassword !== passwords[selectedUser.id]) {
      updatePassword(selectedUser.id, profilePassword);
      changes.push("Password changed");
    }
    toast({ title: "User Profile Updated", description: changes.length > 0 ? `📧 Email notification sent with changes: ${changes.join(", ")}. (Simulated)` : "No major changes detected." });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedUser || !e.target.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateUser(selectedUser.id, { profilePhoto: ev.target?.result as string });
      toast({ title: "Photo Updated" });
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      <button className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside className={`gradient-sidebar fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col pt-16 md:pt-4">
          <div className="px-4 pb-4">
            <div className="rounded-lg bg-sidebar-accent p-3 text-center">
              <p className="font-display text-sm font-bold text-sidebar-primary">Admin Panel</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedUserId(null); setSidebarOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === item.id || (activeTab === "user-profile" && item.id === "users") ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.id === "approvals" && pendingUsers.length > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs text-destructive-foreground">{pendingUsers.length}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="p-3">
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-foreground/20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="animate-fade-in space-y-6">
            <h1 className="font-display text-2xl font-bold">Dashboard Overview</h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Users", value: users.length, icon: Users, color: "text-primary" },
                { label: "Pending Approvals", value: pendingUsers.length, icon: Clock, color: "text-warning" },
                { label: "Total Transactions", value: transactions.length, icon: FileText, color: "text-success" },
                { label: "Total Due", value: `৳${totalDue.toFixed(2)}`, icon: DollarSign, color: "text-destructive" },
              ].map(stat => (
                <Card key={stat.label} className="shadow-card transition-shadow hover:shadow-card-hover">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-accent ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* USERS LIST */}
        {activeTab === "users" && (
          <div className="animate-fade-in space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="font-display text-2xl font-bold">User Management</h1>
              <Button onClick={() => setCreateOpen(true)} size="sm"><Plus className="mr-2 h-4 w-4" /> Create User</Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, phone, or email..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Card className="shadow-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10 hover:bg-primary/10">
                    <TableHead className="font-semibold text-primary">Photo</TableHead>
                    <TableHead className="font-semibold text-primary">Name</TableHead>
                    <TableHead className="font-semibold text-primary">Phone</TableHead>
                    <TableHead className="font-semibold text-primary">Role</TableHead>
                    <TableHead className="font-semibold text-primary">Status</TableHead>
                    <TableHead className="text-right font-semibold text-primary">Due</TableHead>
                    <TableHead className="font-semibold text-primary">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No users found</TableCell></TableRow>
                  ) : filteredUsers.map((u, i) => (
                    <TableRow key={u.id} className={`cursor-pointer ${i % 2 === 0 ? "bg-muted/30" : ""} hover:bg-accent/50`} onClick={() => openUserProfile(u.id)}>
                      <TableCell>
                        {u.profilePhoto ? (
                          <img src={u.profilePhoto} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{u.name.charAt(0)}</div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.phone}</TableCell>
                      <TableCell className="capitalize">{ROLE_LABELS[u.role] || u.role}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.status === "approved" ? "bg-success/10 text-success" : u.status === "pending" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                          {u.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">৳{u.dueBalance.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" onClick={() => openUserProfile(u.id)}><Eye className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => printStatement(u.id)}><Printer className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { deleteUser(u.id); toast({ title: "User Deleted" }); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {/* USER PROFILE (Admin view) */}
        {activeTab === "user-profile" && selectedUser && (
          <div className="animate-fade-in space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setActiveTab("users")} className="gap-2 mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to Users
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative">
                {selectedUser.profilePhoto ? (
                  <img src={selectedUser.profilePhoto} alt="" className="h-20 w-20 rounded-full object-cover border-2 border-primary" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-2xl font-bold text-accent-foreground border-2 border-primary">
                    {selectedUser.name.charAt(0)}
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  <Image className="h-3.5 w-3.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">{selectedUser.name}</h1>
                <p className="text-sm text-muted-foreground">ID: {selectedUser.id} | Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Editable fields */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-lg">User Information</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Name", key: "name" },
                  { label: "Phone", key: "phone" },
                  { label: "Email", key: "email" },
                  { label: "Address", key: "address" },
                  { label: "Due Balance", key: "dueBalance", type: "number" },
                  { label: "Payment Link", key: "paymentLink" },
                  { label: "Expiry Date", key: "expiryDate", type: "date" },
                ].map(f => (
                  <div key={f.key} className="space-y-1">
                    <Label>{f.label}</Label>
                    <Input type={f.type || "text"} value={profileForm[f.key] || ""} onChange={e => setProfileForm((p: any) => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div className="space-y-1">
                  <Label>Password</Label>
                  <Input value={profilePassword} onChange={e => setProfilePassword(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Select value={profileForm.role} onValueChange={v => setProfileForm((p: any) => ({ ...p, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer Type</SelectItem>
                      <SelectItem value="reseller">Reseller</SelectItem>
                      <SelectItem value="sawmill_owner">Sawmill Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={profileForm.status} onValueChange={v => setProfileForm((p: any) => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Comments</Label>
                  <Textarea value={profileForm.comments || ""} onChange={e => setProfileForm((p: any) => ({ ...p, comments: e.target.value }))} rows={3} />
                </div>
              </CardContent>
            </Card>

            {/* Policy Content per user */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-4 w-4" /> Your Policy (Per User)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Label>HTML Content for "Your Policy Update" menu</Label>
                <Textarea rows={6} className="font-mono text-sm" placeholder="<h2>Policy</h2><p>Details here...</p>" value={profilePolicyContent} onChange={e => setProfilePolicyContent(e.target.value)} />
                {profilePolicyContent && (
                  <div className="rounded-lg border p-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Preview:</p>
                    <div dangerouslySetInnerHTML={{ __html: profilePolicyContent }} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Menu Permissions */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-4 w-4" /> Menu Permissions</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10 hover:bg-primary/10">
                      <TableHead className="font-semibold text-primary">Menu Item</TableHead>
                      <TableHead className="text-center font-semibold text-primary">Visible</TableHead>
                      <TableHead className="text-center font-semibold text-primary">Editable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEFAULT_MENU_ITEMS.map(item => (
                      <TableRow key={item}>
                        <TableCell className="font-medium">{MENU_LABELS[item]}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox checked={profilePerms[item]?.visible ?? true} onCheckedChange={v => setProfilePerms(p => ({ ...p, [item]: { ...p[item], visible: !!v } }))} />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox checked={profilePerms[item]?.editable ?? false} onCheckedChange={v => setProfilePerms(p => ({ ...p, [item]: { ...p[item], editable: !!v } }))} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Login Logs */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Activity className="h-4 w-4" /> Login Logs (Last 20)</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10 hover:bg-primary/10">
                      <TableHead className="font-semibold text-primary">#</TableHead>
                      <TableHead className="font-semibold text-primary">Timestamp</TableHead>
                      <TableHead className="font-semibold text-primary">Action</TableHead>
                      <TableHead className="font-semibold text-primary">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedUser.loginLogs || []).slice(-20).reverse().map((log, i) => (
                      <TableRow key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${log.action === "login" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{log.action}</span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                      </TableRow>
                    ))}
                    {(!selectedUser.loginLogs || selectedUser.loginLogs.length === 0) && (
                      <TableRow><TableCell colSpan={4} className="py-4 text-center text-muted-foreground">No login logs</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button onClick={saveProfile}><Pencil className="mr-2 h-4 w-4" /> Save All Changes</Button>
              <Button variant="outline" onClick={() => printStatement(selectedUser.id)}><Printer className="mr-2 h-4 w-4" /> Print Statement</Button>
              <Button variant="destructive" onClick={() => { deleteUser(selectedUser.id); setActiveTab("users"); toast({ title: "User Deleted" }); }}><Trash2 className="mr-2 h-4 w-4" /> Delete User</Button>
            </div>
          </div>
        )}

        {/* APPROVALS */}
        {activeTab === "approvals" && (
          <div className="animate-fade-in space-y-4">
            <h1 className="font-display text-2xl font-bold">User Approvals</h1>
            {pendingUsers.length === 0 ? (
              <Card className="shadow-card"><CardContent className="py-12 text-center text-muted-foreground">No pending approvals</CardContent></Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingUsers.map(u => (
                  <Card key={u.id} className="shadow-card">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">{u.name.charAt(0)}</div>
                        <div>
                          <p className="font-semibold">{u.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{ROLE_LABELS[u.role]}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Phone:</span> {u.phone}</p>
                        <p><span className="text-muted-foreground">Email:</span> {u.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 gap-1" onClick={() => { approveUser(u.id); toast({ title: "User Approved" }); }}>
                          <UserCheck className="h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => { rejectUser(u.id); toast({ title: "User Rejected" }); }}>
                          <UserX className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="animate-fade-in space-y-6">
            <h1 className="font-display text-2xl font-bold">Transactions</h1>

            {/* Add Transaction Form */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-lg">Add Transaction</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleTxSubmit} className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Select User</Label>
                    <Select onValueChange={v => setTxForm(p => ({ ...p, userId: v }))} value={txForm.userId}>
                      <SelectTrigger><SelectValue placeholder="Choose a user" /></SelectTrigger>
                      <SelectContent>
                        {users.filter(u => u.status === "approved").map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name} ({u.phone})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Date</Label><Input type="date" value={txForm.date} onChange={e => setTxForm(p => ({ ...p, date: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Sale Amount (৳)</Label><Input type="number" placeholder="0.00" value={txForm.saleAmount} onChange={e => setTxForm(p => ({ ...p, saleAmount: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Payment Amount (৳)</Label><Input type="number" placeholder="0.00" value={txForm.paymentAmount} onChange={e => setTxForm(p => ({ ...p, paymentAmount: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Description</Label><Input placeholder="Transaction description" value={txForm.description} onChange={e => setTxForm(p => ({ ...p, description: e.target.value }))} /></div>
                  <div className="sm:col-span-2"><Button type="submit" className="gap-2"><Send className="h-4 w-4" /> Submit Transaction</Button></div>
                </form>
              </CardContent>
            </Card>

            {/* Statement Download with Date Range */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Printer className="h-4 w-4" /> Statement Download</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Select User</Label>
                    <Select onValueChange={setStmtUserId} value={stmtUserId}>
                      <SelectTrigger><SelectValue placeholder="Choose a user" /></SelectTrigger>
                      <SelectContent>
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name} ({u.phone})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left", !stmtDateFrom && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {stmtDateFrom ? format(stmtDateFrom, "PP") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={stmtDateFrom} onSelect={setStmtDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left", !stmtDateTo && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {stmtDateTo ? format(stmtDateTo, "PP") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={stmtDateTo} onSelect={setStmtDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button disabled={!stmtUserId} onClick={() => printStatement(stmtUserId, stmtDateFrom, stmtDateTo)} className="gap-2">
                    <Download className="h-4 w-4" /> View / Print Statement
                  </Button>
                  {(stmtDateFrom || stmtDateTo) && (
                    <Button variant="ghost" onClick={() => { setStmtDateFrom(undefined); setStmtDateTo(undefined); }}>Clear Dates</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* DATABASE */}
        {activeTab === "database" && (
          <div className="animate-fade-in space-y-6">
            <h1 className="font-display text-2xl font-bold">Database Management</h1>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="shadow-card">
                <CardHeader><CardTitle className="flex items-center gap-2"><Download className="h-4 w-4" /> Export Backup</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Download all users, transactions, and passwords as a JSON file.</p>
                  <Button onClick={handleExportBackup} className="gap-2"><Download className="h-4 w-4" /> Download Backup</Button>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-4 w-4" /> Restore Backup</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Upload a previously exported JSON backup file to restore data.</p>
                  <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2"><Upload className="h-4 w-4" /> Upload Backup File</Button>
                </CardContent>
              </Card>
            </div>
            <Card className="shadow-card">
              <CardHeader><CardTitle>Database Stats</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-accent/50 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <div className="rounded-lg bg-accent/50 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </div>
                <div className="rounded-lg bg-accent/50 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Storage Used</p>
                  <p className="text-2xl font-bold">{(new Blob([JSON.stringify({ users, transactions, passwords })]).size / 1024).toFixed(1)} KB</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* LOGIN LOGS */}
        {activeTab === "logs" && (
          <div className="animate-fade-in space-y-4">
            <h1 className="font-display text-2xl font-bold">All Login Logs</h1>
            <Card className="shadow-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10 hover:bg-primary/10">
                    <TableHead className="font-semibold text-primary">User</TableHead>
                    <TableHead className="font-semibold text-primary">Timestamp</TableHead>
                    <TableHead className="font-semibold text-primary">Action</TableHead>
                    <TableHead className="font-semibold text-primary">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.flatMap(u => (u.loginLogs || []).map(log => ({ ...log, userName: u.name, userId: u.id })))
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 50)
                    .map((log, i) => (
                      <TableRow key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                        <TableCell className="font-medium cursor-pointer text-primary hover:underline" onClick={() => openUserProfile(log.userId)}>{log.userName}</TableCell>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${log.action === "login" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{log.action}</span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                      </TableRow>
                    ))}
                  {users.every(u => !u.loginLogs?.length) && (
                    <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No login logs recorded yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </main>

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1"><Label>Name</Label><Input value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={createForm.phone} onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} maxLength={11} /></div>
            <div className="space-y-1"><Label>Email</Label><Input value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Address</Label><Input value={createForm.address} onChange={e => setCreateForm(p => ({ ...p, address: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select onValueChange={v => setCreateForm(p => ({ ...p, role: v as any }))} defaultValue="customer">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer Type</SelectItem>
                  <SelectItem value="reseller">Reseller</SelectItem>
                  <SelectItem value="sawmill_owner">Sawmill Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Create User</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp preview */}
      <Dialog open={whatsappModal.open} onOpenChange={o => setWhatsappModal(p => ({ ...p, open: o }))}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> WhatsApp Message Preview</DialogTitle></DialogHeader>
          <div className="rounded-lg bg-accent p-4"><pre className="whitespace-pre-wrap text-sm">{whatsappModal.message}</pre></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsappModal({ open: false, message: "", userId: "" })}>Close</Button>
            <Button onClick={() => {
              const user = users.find(u => u.id === whatsappModal.userId);
              if (user) {
                const phone = user.phone.startsWith("88") ? user.phone : `88${user.phone}`;
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(whatsappModal.message)}`, "_blank");
              }
              setWhatsappModal({ open: false, message: "", userId: "" });
            }}>Send via WhatsApp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
