"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { SchemaForm } from "@/components/form/SchemaForm";
import { useApiMutation } from "@/hooks/useApiMutation";
import { platformAuthApi } from "@/lib/api/auth";
import type { PlatformSessionData } from "@/lib/auth/sessionTypes";
import { PASSWORD_REQUIREMENTS_TEXT, passwordSchema } from "@/lib/validation/password";

// Define schema with UI metadata
const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .describe(
      JSON.stringify({
        label: "Email Address",
        placeholder: "owner@gmail.com",
        inputType: "email",
      }),
    ),
  password: passwordSchema().describe(
    JSON.stringify({
      label: "Password",
      placeholder: PASSWORD_REQUIREMENTS_TEXT,
      inputType: "password",
    }),
  ),
});

type LoginSchema = z.infer<typeof loginSchema>;

interface PlatformLoginResponse extends PlatformSessionData {
  message: string;
  token: string;
}

export function PlatformLoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useApiMutation<PlatformLoginResponse, LoginSchema>({
    endpoint: platformAuthApi.login.endpoint,
    method: platformAuthApi.login.method,
    onSuccess: (data) => {
      queryClient.setQueryData(["platform-session"], {
        user: data.user,
        role: data.role,
        permissions: data.permissions,
        navigation: data.navigation,
        session: data.session,
      } satisfies PlatformSessionData);
      toast.success("Login successful!");
      router.push("/platform/dashboard");
    },
    onError: (error) => {
      const msg =
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials.";
      console.error("Login failed:", error);
      toast.error(msg);
    },
  });

  const handleSubmit = async (values: LoginSchema) => {
    try {
      await mutation.mutateAsync(values);
    } catch {
      // Error handled in onError
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Platform Login
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access the platform admin dashboard.
          </p>
        </div>

        <SchemaForm
          schema={loginSchema}
          onSubmit={handleSubmit}
          submitLabel={mutation.isPending ? "Signing in..." : "Sign In"}
          isLoading={mutation.isPending}
          defaultValues={{
            email: "",
            password: "",
          }}
        />

        <div className="flex justify-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
