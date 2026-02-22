"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as z from "zod";
import { toast } from "sonner";

import { SchemaForm } from "@/components/form/SchemaForm";
import { useApiMutation } from "@/hooks/useApiMutation";
import { passwordSchema, PASSWORD_REQUIREMENTS_TEXT } from "@/lib/validation/password";

// Define schema for Tenant Signup
const signupSchema = z
  .object({
    companyName: z
      .string()
      .min(2, "Company Name must be at least 2 characters")
      .describe(
        JSON.stringify({
          label: "Company Name",
          placeholder: "Acme Corp",
        }),
      ),
    ownerName: z
      .string()
      .min(2, "Owner Name must be at least 2 characters")
      .describe(
        JSON.stringify({
          label: "Full Name",
          placeholder: "John Doe",
        }),
      ),
    email: z
      .string()
      .email("Invalid email address")
      .describe(
        JSON.stringify({
          label: "Email",
          placeholder: "name@example.com",
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
    confirmPassword: z.string().describe(
      JSON.stringify({
        label: "Confirm Password",
        placeholder: "••••••",
        inputType: "password",
      }),
    ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupValues = z.infer<typeof signupSchema>;

export function TenantSignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const signupMutation = useApiMutation({
    method: "POST",
    endpoint: "/api/auth/tenant/signup",
  });

  async function onSubmit(data: SignupValues) {
    setIsLoading(true);
    try {
      await signupMutation.mutateAsync({
        companyName: data.companyName,
        // Slug is generated on server
        ownerName: data.ownerName,
        email: data.email,
        password: data.password,
      });

      toast.success("Account created successfully!", {
        description: "Your account is pending approval by the platform admin.",
        duration: 5000,
      });

      // Redirect to login page
      router.push("/tenant/login");
    } catch (err: unknown) {
      console.error("Signup error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Please check your details and try again.";
      toast.error("Signup failed", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Create your Workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            Get started with your own tenant organization
          </p>
        </div>

        <SchemaForm
          schema={signupSchema}
          defaultValues={{
            companyName: "",
            ownerName: "",
            email: "",
            password: "",
            confirmPassword: "",
          }}
          onSubmit={onSubmit}
          submitLabel="Create Workspace"
          isLoading={isLoading}
        />

        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            Already have an account?{" "}
          </span>
          <Link
            href="/tenant/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
