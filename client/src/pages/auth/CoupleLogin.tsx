import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Heart } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CoupleLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Login successful!");
      setLocation("/couple/dashboard");
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "Invalid credentials");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password, role: "couple" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-accent" />
          </div>
          <CardTitle className="text-3xl">Couple Login</CardTitle>
          <CardDescription>
            Sign in to view your event details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setLocation("/login")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to role selection
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
