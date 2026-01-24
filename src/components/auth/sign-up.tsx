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
import { useActionState } from "react";
import { toast } from "sonner";

type SignUpState = {
  error: string | null;
  success: boolean;
};

async function signUpAction(
  prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const inviteToken = formData.get("inviteToken") as string;

  if (!inviteToken) {
    return { error: "Invite token is missing", success: false };
  }

  if (!name || !email || !password) {
    return { error: "Please fill in all fields", success: false };
  }

  return new Promise((resolve) => {
    authClient.signUp.email(
      { email, password, name, inviteToken } as {
        email: string;
        password: string;
        name: string;
        inviteToken: string;
      },
      {
        onSuccess: () => {
          toast.success(
            "Account created. You'll get access after approval by an admin.",
          );
          window.location.href = "/signin?pending=1";
          resolve({ error: null, success: true });
        },
        onError: (ctx) => {
          resolve({ error: ctx.error.message, success: false });
        },
      },
    );
  });
}

export default function SignUp({
  inviteToken,
}: {
  inviteToken?: string;
}) {
  const [state, formAction, isPending] = useActionState(signUpAction, {
    error: null,
    success: false,
  });

  // Show error toast when state changes
  if (state.error) {
    toast.error(state.error);
  }

  if (!inviteToken) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Invite Required</CardTitle>
          <CardDescription>
            You need an invite link from an admin to create an account.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <a href="/signin" className="underline hover:text-primary">
              Sign in
            </a>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create a new account to get started</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <input type="hidden" name="inviteToken" value={inviteToken} />
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              required
            />
          </div>
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
            {isPending ? "Creating account..." : "Sign Up"}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <a href="/signin" className="underline hover:text-primary">
              Sign in
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
