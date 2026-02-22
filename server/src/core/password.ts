import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 10;

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export function passwordSchema() {
  return z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .regex(passwordRegex, "Password must include uppercase, lowercase, and a number");
}
