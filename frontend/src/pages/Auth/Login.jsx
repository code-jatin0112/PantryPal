import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";

import AuthLayout from "../../layouts/AuthLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../constants/routes";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
  rememberMe: z.boolean().default(false).optional(),
});

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    setAuthError("");
    setIsSubmitting(true);

    try {
      if (data.rememberMe) {
        localStorage.setItem("pantrypal_remember_email", data.email);
      } else {
        localStorage.removeItem("pantrypal_remember_email");
      }

      await login({
        email: data.email,
        password: data.password,
      });

      toast.success("Welcome back to PantryPal!");
      navigate(ROUTES.DASHBOARD || "/");
    } catch (error) {
      const errorMessage =
        error.message || "Invalid email or password. Please try again.";
      setAuthError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full shadow-lg border-[#D8C6A5]/50">
        <CardHeader className="text-center sm:text-left">
          <CardTitle className="text-3xl text-[#272A1F]">Sign In</CardTitle>
          <CardDescription className="text-base text-[#5E5947]">
            Enter your credentials to access your smart pantry and meal plans.
          </CardDescription>
        </CardHeader>

        {/* Global Alert Error Message Area */}
        {authError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm animate-shake"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <span className="font-semibold block">Authentication Failed</span>
              <span>{authError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {/* Email Field */}
            <Input
              id="login-email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              leftIcon={Mail}
              error={errors.email?.message}
              {...register("email")}
            />

            {/* Password Field */}
            <Input
              id="login-password"
              label="Password"
              isPassword
              placeholder="••••••••"
              autoComplete="current-password"
              required
              leftIcon={Lock}
              error={errors.password?.message}
              {...register("password")}
            />

            {/* Remember Me & Forgot Password Links */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-[#8A9070] border-gray-300 focus:ring-[#8A9070] focus:ring-offset-0 cursor-pointer accent-[#8A9070]"
                  {...register("rememberMe")}
                />
                <span className="text-sm text-[#272A1F] font-medium">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={() =>
                  toast(
                    "Password reset instructions will be sent to your registered email address.",
                    { icon: "ℹ️" }
                  )
                }
                className="text-sm font-medium text-[#8A9070] hover:text-[#757C5F] hover:underline focus:outline-none transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              icon={LogIn}
              className="mt-6"
            >
              Sign In
            </Button>
          </CardContent>
        </form>

        {/* Footer Link to Register */}
        <CardFooter className="justify-center border-t border-[#D8C6A5]/30 mt-6 pt-6 text-sm text-[#5E5947]">
          <span>Don't have an account yet?</span>
          <Link
            to={ROUTES.REGISTER}
            className="ml-1.5 font-semibold text-[#8A9070] hover:text-[#757C5F] hover:underline transition-colors"
          >
            Create an account
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
};

export default Login;
