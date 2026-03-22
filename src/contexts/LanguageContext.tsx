import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "en" | "bn";

const translations: Record<string, Record<Lang, string>> = {
  // Navbar
  "app.name": { en: "AL-Madina Traders", bn: "আল-মদিনা ট্রেডার্স" },
  "nav.logout": { en: "Logout", bn: "লগআউট" },
  
  // Login
  "login.title": { en: "Welcome back", bn: "স্বাগতম" },
  "login.subtitle": { en: "Sign in to your account to continue", bn: "চালিয়ে যেতে আপনার অ্যাকাউন্টে সাইন ইন করুন" },
  "login.phone": { en: "Phone Number / Username", bn: "ফোন নম্বর / ইউজারনেম" },
  "login.password": { en: "Password", bn: "পাসওয়ার্ড" },
  "login.signin": { en: "Sign In", bn: "সাইন ইন" },
  "login.register": { en: "Create New Account", bn: "নতুন অ্যাকাউন্ট তৈরি করুন" },
  "login.or": { en: "or", bn: "অথবা" },
  
  // Dashboard menu
  "menu.home": { en: "Home", bn: "হোম" },
  "menu.profile": { en: "Profile", bn: "প্রোফাইল" },
  "menu.transactions": { en: "Transactions", bn: "লেনদেন" },
  "menu.tools": { en: "Tools", bn: "টুলস" },
  "menu.policy": { en: "Your Policy Update", bn: "আপনার পলিসি আপডেট" },
  "menu.latestOffers": { en: "Latest Offers", bn: "সর্বশেষ অফার" },
  "menu.support": { en: "Support / Contact", bn: "সাপোর্ট / যোগাযোগ" },
  
  // Profile
  "profile.title": { en: "My Profile", bn: "আমার প্রোফাইল" },
  "profile.userId": { en: "User ID", bn: "ইউজার আইডি" },
  "profile.name": { en: "Name", bn: "নাম" },
  "profile.phone": { en: "Phone", bn: "ফোন" },
  "profile.email": { en: "Email", bn: "ইমেইল" },
  "profile.dueBalance": { en: "Last Due Balance", bn: "শেষ বকেয়া ব্যালেন্স" },
  "profile.expiryDate": { en: "Expiry Date", bn: "মেয়াদ শেষ" },
  "profile.paymentLink": { en: "Payment Link", bn: "পেমেন্ট লিংক" },
  "profile.password": { en: "Password", bn: "পাসওয়ার্ড" },
  "profile.changePassword": { en: "Change Password", bn: "পাসওয়ার্ড পরিবর্তন" },
  
  // Transactions
  "tx.title": { en: "Transaction History", bn: "লেনদেন ইতিহাস" },
  "tx.serial": { en: "#", bn: "#" },
  "tx.date": { en: "Date", bn: "তারিখ" },
  "tx.sale": { en: "Sale", bn: "বিক্রয়" },
  "tx.payment": { en: "Payment", bn: "পেমেন্ট" },
  "tx.description": { en: "Description", bn: "বিবরণ" },
  "tx.balance": { en: "Balance", bn: "ব্যালেন্স" },
  
  // Support
  "support.title": { en: "Support / Contact", bn: "সাপোর্ট / যোগাযোগ" },
  "support.name": { en: "Your Name", bn: "আপনার নাম" },
  "support.phone": { en: "Your Phone", bn: "আপনার ফোন" },
  "support.subject": { en: "Subject", bn: "বিষয়" },
  "support.message": { en: "Message", bn: "বার্তা" },
  "support.submit": { en: "Submit via WhatsApp", bn: "হোয়াটসঅ্যাপে পাঠান" },
  
  // Roles
  "role.customer": { en: "Customer Type", bn: "কাস্টমার টাইপ" },
  "role.reseller": { en: "Reseller", bn: "রিসেলার" },
  "role.sawmill_owner": { en: "Sawmill Owner", bn: "স'মিল মালিক" },
  
  // Register
  "register.title": { en: "Create Account", bn: "অ্যাকাউন্ট তৈরি করুন" },
  "register.fullName": { en: "Full Name", bn: "পুরো নাম" },
  "register.selectRole": { en: "Select your role", bn: "আপনার ভূমিকা নির্বাচন করুন" },
  "register.submit": { en: "Create New Account", bn: "নতুন অ্যাকাউন্ট তৈরি করুন" },
  "register.hasAccount": { en: "Already have an account? Login", bn: "ইতোমধ্যে অ্যাকাউন্ট আছে? লগইন" },
  
  // Common
  "common.payNow": { en: "Pay Now", bn: "পে করুন" },
  "common.noData": { en: "No data available", bn: "কোনো তথ্য নেই" },
  "common.connectWithUs": { en: "Connect With Us", bn: "আমাদের সাথে যোগাযোগ" },
  
  // Theme
  "theme.light": { en: "Light", bn: "লাইট" },
  "theme.dark": { en: "Dark", bn: "ডার্ক" },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem("amt_lang") as Lang) || "en";
  });

  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("amt_lang", l);
  };

  const t = (key: string): string => {
    return translations[key]?.[lang] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
