import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/crm/dashboard");
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({ title: "Account created", description: "Check your email to confirm your account, or sign in if email confirmation is disabled." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(222,47%,5%)] p-4">
      <Card className="w-full max-w-md bg-[hsl(220,30%,8%)] border-[hsl(220,20%,15%)]">
        <CardHeader className="text-center">
          <img src="/iKlick_logo_variations_on_transparent_background_1.PNG" alt="iKlick" className="h-12 mx-auto mb-4 object-contain" />
          <CardTitle className="text-[hsl(210,40%,98%)] text-2xl">
            {isLogin ? "Sign In" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-[hsl(215,20%,65%)]">
            {isLogin ? "Access the iKlick CRM platform" : "Register for a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-[hsl(220,20%,12%)] border-[hsl(220,20%,20%)] text-[hsl(210,40%,98%)] placeholder:text-[hsl(215,20%,45%)]"
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[hsl(220,20%,12%)] border-[hsl(220,20%,20%)] text-[hsl(210,40%,98%)] placeholder:text-[hsl(215,20%,45%)]"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-[hsl(220,20%,12%)] border-[hsl(220,20%,20%)] text-[hsl(210,40%,98%)] placeholder:text-[hsl(215,20%,45%)]"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>
          <p className="text-center text-sm mt-4 text-[hsl(215,20%,65%)]">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
