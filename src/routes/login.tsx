import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/lib/auth/store";

// Temporary local auth guard. Replace with Supabase Auth later.

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Worthly" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, state: authState } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    if (email !== "adiphidayatr@gmail.com") {
      toast.error("Access is currently private.");
      return;
    }

    login(email);
    toast.success("Login successful");
    navigate({ to: "/" });
  };

  const handleSignUp = () => {
    toast.info("Sign up is coming soon.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] px-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <img src="/assets/paw-logo.svg" alt="Worthly" className="h-16 w-auto" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Worthly</h1>
            <p className="text-sm text-muted-foreground mt-1">Your personal net worth dashboard</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 bg-[#3b82f6] hover:bg-[#3b82f6]/90 rounded-xl">
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2">
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <button
              type="button"
              onClick={handleSignUp}
              className="text-[#3b82f6] hover:underline font-medium"
            >
              Sign up
            </button>
          </div>
          <div className="text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to dashboard
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
