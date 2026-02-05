import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

type SignInState = {
  error: string | null;
  success: boolean;
};

async function signInAction(
  prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please fill in all fields", success: false };
  }

  return new Promise((resolve) => {
    authClient.signIn.email(
      { email, password },
      {
        onSuccess: () => {
          toast.success("Signed in successfully");
          window.location.href = "/admin";
          resolve({ error: null, success: true });
        },
        onError: (ctx) => {
          resolve({ error: ctx.error.message, success: false });
        },
      },
    );
  });
}

export default function SignIn() {
  const [state, formAction, isPending] = useActionState(signInAction, {
    error: null,
    success: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pending") === "1") {
      toast.success(
        "Your account is pending approval. You'll get access once approved.",
      );
    }
  }, []);

  // Show error toast when state changes
  if (state.error) {
    toast.error(state.error);
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <a href="/signup" className="underline hover:text-primary">
              Sign up
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
