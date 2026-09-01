"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerUserSchema, type RegisterUserInput } from "@/lib/validations/auth";
import type { ActionResponse } from "@/types";

export async function registerUserAction(
  input: RegisterUserInput
): Promise<ActionResponse<{ id: string; email: string }>> {
  const parsed = registerUserSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: "Invalid input",
      fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return {
      success: false,
      error: "A user with this email already exists",
    };
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
    },
  });

  return {
    success: true,
    data: user,
  };
}
