"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { registerUserSchema, type RegisterUserInput } from "@/lib/validations/auth";
import { registerUserAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<RegisterUserInput>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: RegisterUserInput) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await registerUserAction(values);

        if (!res.success) {
          setError(res.error || "Failed to create account");
          if (res.fieldErrors) {
            Object.entries(res.fieldErrors).forEach(([field, messages]) => {
              form.setError(field as keyof RegisterUserInput, {
                message: messages[0],
              });
            });
          }
          return;
        }

        // Auto sign-in after successful registration
        const signInRes = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (signInRes?.error) {
          router.push("/login");
          return;
        }

        router.push("/onboarding");
        router.refresh();
      } catch (err) {
        console.error(err);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <Card className="border-zinc-800/80 bg-[#121215]/90 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1.5 pb-6">
        <CardTitle className="text-xl font-semibold text-foreground tracking-tight">
          Create your account
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Start collaborating with your team on Meridian
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-400 animate-in fade-in duration-150">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jane Doe"
                      disabled={isPending}
                      autoComplete="name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      disabled={isPending}
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Minimum 8 characters"
                      disabled={isPending}
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md shadow-primary/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Get Started
                  <ArrowRight className="ml-1.5 size-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-zinc-800/80 pt-4">
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline transition-colors"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
