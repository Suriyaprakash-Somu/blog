"use client";

import { z } from "zod";
import { SchemaForm } from "@/components/form/SchemaForm";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "@/hooks/useApiMutation";
import { tenantAuthApi } from "@/lib/api/auth";
import type { TenantSessionData } from "@/lib/auth/sessionTypes";
import { passwordSchema, PASSWORD_REQUIREMENTS_TEXT } from "@/lib/validation/password";

// Define schema with UI metadata
const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .describe(
      JSON.stringify({
        label: "Email Address",
        placeholder: "you@company.com",
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

interface TenantLoginResponse extends TenantSessionData {
  message: string;
}

export function TenantLoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useApiMutation<TenantLoginResponse, LoginSchema>({
    endpoint: tenantAuthApi.login.endpoint,
    method: tenantAuthApi.login.method,
    onSuccess: (data) => {
      queryClient.setQueryData(["tenant-session"], {
        user: data.user,
        tenant: data.tenant,
        role: data.role,
        permissions: data.permissions,
        navigation: data.navigation,
      } satisfies TenantSessionData);
      toast.success("Login successful!");
      router.push("/tenant/dashboard");
    },
    onError: (error) => {
      // Allow custom error display from backend (e.g., status check)
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
            Tenant Login
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your organization workspace.
          </p>
        </div>

        <SchemaForm
          schema={loginSchema}
          onSubmit={handleSubmit}
          submitLabel={
            mutation.isPending ? "Signing in..." : "Sign In to Workspace"
          }
          isLoading={mutation.isPending}
          defaultValues={{
            email: "",
            password: "",
          }}
        />

        <div className="flex justify-center text-sm text-muted-foreground gap-4">
          <Link
            href="/tenant/signup"
            className="hover:text-primary transition-colors"
          >
            Create Account
          </Link>
          <span>|</span>
          <Link href="/" className="hover:text-primary transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
