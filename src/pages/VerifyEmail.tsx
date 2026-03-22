import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, MailCheck } from "lucide-react";

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email || "your email";

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) {
      toast({ title: "Invalid Code", description: "Please enter a valid verification code.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Email Verified!", description: "Your account is pending admin approval." });
      navigate("/pending-approval");
    }, 1000);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md animate-fade-in shadow-card">
        <CardHeader className="items-center space-y-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <MailCheck className="h-8 w-8 text-accent-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">Verify Your Email</CardTitle>
          <CardDescription className="text-center">
            We've sent a verification code to <strong>{email}</strong>. Enter it below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              placeholder="Enter verification code"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Email
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Didn't receive a code?{" "}
              <button type="button" className="font-medium text-primary hover:underline" onClick={() => toast({ title: "Code Resent", description: "A new code has been sent." })}>
                Resend
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
