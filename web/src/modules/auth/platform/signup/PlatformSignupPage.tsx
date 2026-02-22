"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as z from "zod";

import { SchemaForm } from "@/components/form/SchemaForm";
import { toast } from "sonner";
import { useApiMutation } from "@/hooks/useApiMutation";
import { passwordSchema, PASSWORD_REQUIREMENTS_TEXT } from "@/lib/validation/password";

// Define schema with metadata for SchemaForm
const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .describe(
        JSON.stringify({ label: "Full Name", placeholder: "John Doe" }),
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

export function PlatformSignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const signupMutation = useApiMutation({
    method: "POST",
    endpoint: "/api/auth/platform/signup",
  });

  async function onSubmit(data: SignupValues) {
    setIsLoading(true);
    try {
      await signupMutation.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      toast.success("Account created", {
        description: "Welcome to the platform!",
      });

      // Redirect to dashboard
      router.push("/platform/dashboard");
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
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to create your platform account
        </p>
      </div>

      <SchemaForm
        schema={signupSchema}
        defaultValues={{
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        }}
        onSubmit={onSubmit}
        submitLabel="Sign Up"
        isLoading={isLoading}
      />

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link
          href="/platform/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
