import { Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="gradient-primary mt-auto">
      <div className="container mx-auto px-4 py-6 text-center">
        <p className="font-medium text-primary-foreground">
          Developed by{" "}
          <a
            href="https://facebook.com/itsmilonbro"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-80"
          >
            MD MILON HOSSAIN
            <Facebook className="h-4 w-4" />
          </a>
        </p>
        <p className="mt-1 text-sm text-primary-foreground/70">
          © {new Date().getFullYear()} AL-Madina Traders. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
