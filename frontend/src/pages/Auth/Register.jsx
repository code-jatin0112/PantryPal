import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { User, Mail, Lock, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

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

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password", "");

  const onSubmit = async (data) => {
    setAuthError("");
    setIsSubmitting(true);

    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      toast.success("Account created successfully! Welcome to PantryPal.");
      navigate(ROUTES.LOGIN);
    } catch (error) {
      const errorMessage =
        error.message || "Failed to create account. Please try again.";
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
          <CardTitle className="text-3xl text-[#272A1F]">Create Account</CardTitle>
          <CardDescription className="text-base text-[#5E5947]">
            Join PantryPal to reduce kitchen waste and plan mindful meals.
          </CardDescription>
        </CardHeader>

        {/* Global Error Alert Area */}
        {authError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <span className="font-semibold block">Registration Error</span>
              <span>{authError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {/* Full Name Field */}
            <Input
              id="register-name"
              label="Full Name"
              type="text"
              placeholder="Chef Jamie Oliver"
              autoComplete="name"
              required
              leftIcon={User}
              error={errors.name?.message}
              {...register("name")}
            />

            {/* Email Address Field */}
            <Input
              id="register-email"
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
              id="register-password"
              label="Password"
              isPassword
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              required
              leftIcon={Lock}
              helperText="Must be at least 8 characters long"
              error={errors.password?.message}
              {...register("password")}
            />

            {/* Confirm Password Field */}
            <Input
              id="register-confirm-password"
              label="Confirm Password"
              isPassword
              placeholder="Re-enter password"
              autoComplete="new-password"
              required
              leftIcon={Lock}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            {/* Password Length Hint */}
            {passwordValue && (
              <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#D8C6A5]/40 text-xs text-[#5E5947] space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      passwordValue.length >= 8 ? "text-[#8A9070]" : "text-gray-400"
                    }`}
                  />
                  <span>At least 8 characters</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              icon={UserPlus}
              className="mt-6"
            >
              Create Account
            </Button>
          </CardContent>
        </form>

        {/* Footer Link to Login */}
        <CardFooter className="justify-center border-t border-[#D8C6A5]/30 mt-6 pt-6 text-sm text-[#5E5947]">
          <span>Already have an account?</span>
          <Link
            to={ROUTES.LOGIN}
            className="ml-1.5 font-semibold text-[#8A9070] hover:text-[#757C5F] hover:underline transition-colors"
          >
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
};

export default Register;
