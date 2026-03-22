import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

export type UserRole = "customer" | "reseller" | "sawmill_owner" | "admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer Type",
  reseller: "Reseller",
  sawmill_owner: "Sawmill Owner",
  admin: "Admin",
};

export const DEFAULT_MENU_ITEMS = ["home", "profile", "transactions", "tools", "policy", "offers", "support"] as const;
export type MenuItem = typeof DEFAULT_MENU_ITEMS[number];

export interface MenuPermission {
  visible: boolean;
  editable: boolean;
}

export interface LoginLog {
  timestamp: string;
  ip: string;
  action: "login" | "logout";
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  role: UserRole;
  status: "pending" | "approved" | "rejected";
  dueBalance: number;
  paymentLink: string;
  expiryDate: string;
  createdAt: string;
  comments: string;
  policyContent: string;
  profilePhoto: string;
  menuPermissions: Record<MenuItem, MenuPermission>;
  loginLogs: LoginLog[];
}

export interface Transaction {
  id: string;
  transactionId: string;
  userId: string;
  date: string;
  saleAmount: number;
  paymentAmount: number;
  description: string;
  runningBalance: number;
}

const defaultMenuPermissions = (): Record<MenuItem, MenuPermission> => {
  const perms: any = {};
  DEFAULT_MENU_ITEMS.forEach(item => { perms[item] = { visible: true, editable: false }; });
  return perms;
};

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  transactions: Transaction[];
  isLoading: boolean;
  login: (phone: string, password: string) => boolean;
  adminLogin: (username: string, password: string) => boolean;
  register: (data: Omit<User, "id" | "status" | "dueBalance" | "paymentLink" | "expiryDate" | "createdAt" | "comments" | "policyContent" | "profilePhoto" | "menuPermissions" | "loginLogs" | "address"> & { password: string; address?: string }) => boolean;
  logout: () => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  updateUser: (userId: string, data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  createUser: (data: Partial<User> & { name: string; phone: string; email: string; role: UserRole; status: string }) => void;
  addTransaction: (t: Omit<Transaction, "id" | "runningBalance" | "transactionId">) => Transaction;
  getUserTransactions: (userId: string) => Transaction[];
  isAdmin: boolean;
  passwords: Record<string, string>;
  updatePassword: (userId: string, newPassword: string) => void;
  exportBackup: () => string;
  importBackup: (json: string) => boolean;
  addLoginLog: (userId: string, action: "login" | "logout") => void;
  txCounter: number;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_CREDS = { username: "admin", password: "admin123" };
const generateId = () => Math.random().toString(36).substring(2, 10);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("amt_users");
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return parsed.map((u: any) => ({
      address: "", comments: "", policyContent: "", profilePhoto: "",
      menuPermissions: defaultMenuPermissions(), loginLogs: [],
      ...u,
    }));
  });

  const [passwords, setPasswords] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("amt_passwords");
    return saved ? JSON.parse(saved) : {};
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("amt_transactions");
    return saved ? JSON.parse(saved) : [];
  });

  const [txCounter, setTxCounter] = useState<number>(() => {
    const saved = localStorage.getItem("amt_tx_counter");
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => { localStorage.setItem("amt_users", JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem("amt_passwords", JSON.stringify(passwords)); }, [passwords]);
  useEffect(() => { localStorage.setItem("amt_transactions", JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem("amt_tx_counter", String(txCounter)); }, [txCounter]);

  useEffect(() => {
    const saved = localStorage.getItem("amt_current_user");
    const savedAdmin = localStorage.getItem("amt_is_admin");
    if (savedAdmin === "true") setIsAdmin(true);
    if (saved) {
      const u = JSON.parse(saved);
      setCurrentUser({
        address: "", comments: "", policyContent: "", profilePhoto: "",
        menuPermissions: defaultMenuPermissions(), loginLogs: [],
        ...u,
      });
    }
  }, []);

  const addLoginLog = (userId: string, action: "login" | "logout") => {
    const log: LoginLog = {
      timestamp: new Date().toISOString(),
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      action,
    };
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, loginLogs: [...(u.loginLogs || []), log] } : u));
  };

  const login = (phone: string, password: string): boolean => {
    if (phone === ADMIN_CREDS.username && password === ADMIN_CREDS.password) {
      setIsAdmin(true);
      localStorage.setItem("amt_is_admin", "true");
      return true;
    }
    setIsLoading(true);
    const user = users.find(u => u.phone === phone);
    if (!user) { setIsLoading(false); return false; }
    if (passwords[user.id] !== password) { setIsLoading(false); return false; }
    if (user.status !== "approved") {
      toast({ title: "Account Pending", description: "Your account is awaiting admin approval.", variant: "destructive" });
      setIsLoading(false);
      return false;
    }
    const enriched = { address: "", comments: "", policyContent: "", profilePhoto: "", menuPermissions: defaultMenuPermissions(), loginLogs: [], ...user };
    setCurrentUser(enriched);
    localStorage.setItem("amt_current_user", JSON.stringify(enriched));
    addLoginLog(user.id, "login");
    setIsLoading(false);
    return true;
  };

  const adminLogin = (username: string, password: string): boolean => {
    if (username === ADMIN_CREDS.username && password === ADMIN_CREDS.password) {
      setIsAdmin(true);
      localStorage.setItem("amt_is_admin", "true");
      return true;
    }
    return false;
  };

  const register = (data: any): boolean => {
    if (users.find(u => u.phone === data.phone)) return false;
    const id = generateId();
    const newUser: User = {
      id, name: data.name, phone: data.phone, email: data.email,
      address: data.address || "", role: data.role, status: "pending",
      dueBalance: 0, paymentLink: "", expiryDate: "",
      createdAt: new Date().toISOString(),
      comments: "", policyContent: "", profilePhoto: "",
      menuPermissions: defaultMenuPermissions(), loginLogs: [],
    };
    setUsers(prev => [...prev, newUser]);
    setPasswords(prev => ({ ...prev, [id]: data.password }));
    return true;
  };

  const logout = () => {
    if (currentUser) addLoginLog(currentUser.id, "logout");
    setCurrentUser(null);
    setIsAdmin(false);
    localStorage.removeItem("amt_current_user");
    localStorage.removeItem("amt_is_admin");
  };

  const approveUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: "approved" as const } : u));
  };

  const rejectUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: "rejected" as const } : u));
  };

  const updateUser = (userId: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    if (currentUser?.id === userId) {
      const updated = { ...currentUser, ...data };
      setCurrentUser(updated);
      localStorage.setItem("amt_current_user", JSON.stringify(updated));
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setTransactions(prev => prev.filter(t => t.userId !== userId));
  };

  const createUser = (data: any) => {
    const id = generateId();
    const newUser: User = {
      id, createdAt: new Date().toISOString(),
      name: data.name, phone: data.phone, email: data.email,
      address: data.address || "", role: data.role,
      status: data.status || "approved",
      dueBalance: data.dueBalance || 0,
      paymentLink: data.paymentLink || "",
      expiryDate: data.expiryDate || "",
      comments: data.comments || "",
      policyContent: data.policyContent || "",
      profilePhoto: data.profilePhoto || "",
      menuPermissions: data.menuPermissions || defaultMenuPermissions(),
      loginLogs: [],
    };
    setUsers(prev => [...prev, newUser]);
    setPasswords(prev => ({ ...prev, [id]: "default123" }));
  };

  const updatePassword = (userId: string, newPassword: string) => {
    setPasswords(prev => ({ ...prev, [userId]: newPassword }));
  };

  const addTransaction = (t: Omit<Transaction, "id" | "runningBalance" | "transactionId">): Transaction => {
    const userTxns = transactions.filter(tx => tx.userId === t.userId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const lastBalance = userTxns.length > 0 ? userTxns[userTxns.length - 1].runningBalance : 0;
    const runningBalance = lastBalance + t.saleAmount - t.paymentAmount;
    const newCounter = txCounter + 1;
    const transactionId = `TXN-${String(newCounter).padStart(6, "0")}`;
    setTxCounter(newCounter);
    const newTx: Transaction = { ...t, id: generateId(), transactionId, runningBalance };
    setTransactions(prev => [...prev, newTx]);
    updateUser(t.userId, { dueBalance: runningBalance });
    return newTx;
  };

  const getUserTransactions = (userId: string) =>
    transactions.filter(t => t.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const exportBackup = (): string => {
    return JSON.stringify({ users, passwords, transactions, txCounter, exportedAt: new Date().toISOString() }, null, 2);
  };

  const importBackup = (json: string): boolean => {
    try {
      const data = JSON.parse(json);
      if (data.users) setUsers(data.users.map((u: any) => ({ address: "", comments: "", policyContent: "", profilePhoto: "", menuPermissions: defaultMenuPermissions(), loginLogs: [], ...u })));
      if (data.passwords) setPasswords(data.passwords);
      if (data.transactions) setTransactions(data.transactions);
      if (data.txCounter) setTxCounter(data.txCounter);
      return true;
    } catch { return false; }
  };

  return (
    <AuthContext.Provider value={{
      currentUser, users, transactions, isLoading,
      login, adminLogin, register, logout,
      approveUser, rejectUser, updateUser, deleteUser, createUser,
      addTransaction, getUserTransactions,
      isAdmin, passwords, updatePassword,
      exportBackup, importBackup, addLoginLog, txCounter,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
