"use client";

import Logo from "@/assets/logos/dobro-logo-black-circle.svg";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input } from "@/components/ui/input";
import {
  LoginFormData,
  loginSchema,
  RegisterFormData,
  registerSchema,
} from "@/lib/auth.schema";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

type AuthFormSubmitHandler = (
  formData: FormData,
) => Promise<{ error?: string } | void>;

// Конфигурация контента
const content = {
  login: {
    title: "Welcome back",
    description: "Sign in with your email and password",
    buttonText: "Login",
    bottomText: "Don't have an account? ",
    bottomLink: "/register",
    bottomLinkText: "Register",
  },
  register: {
    title: "Register",
    description: "Register with your email and password",
    buttonText: "Register",
    bottomText: "Already have an account? ",
    bottomLink: "/login",
    bottomLinkText: "Login",
  },
};

// Конфигурация полей формы
const formFields = [
  {
    name: "firstName",
    label: "First Name",
    type: "text",
    placeholder: "",
    registerOnly: true,
  },
  {
    name: "lastName",
    label: "Last Name",
    type: "text",
    placeholder: "",
    registerOnly: true,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "m@example.com",
    registerOnly: false,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "",
    registerOnly: false,
  },
  {
    name: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    placeholder: "",
    registerOnly: true,
  },
] as const;

// Компонент для рендеринга поля формы
function FormInputField({
  control,
  name,
  label,
  type,
  placeholder,
  registerOnly,
  isRegister,
}: {
  control: any;
  name: string;
  label: string;
  type: string;
  placeholder: string;
  registerOnly: boolean;
  isRegister: boolean;
}) {
  if (registerOnly && !isRegister) return null;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} id={name} type={type} placeholder={placeholder} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function AuthForm({
  className,
  register = false,
  onSubmitAction,
  ...props
}: {
  className?: string;
  register?: boolean;
  onSubmitAction: AuthFormSubmitHandler;
} & Omit<React.ComponentPropsWithoutRef<"div">, "onSubmit">) {
  const mode = register ? "register" : "login";
  const {
    title,
    description,
    buttonText,
    bottomText,
    bottomLink,
    bottomLinkText,
  } = content[mode];

  const form = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(register ? registerSchema : loginSchema),
    defaultValues: register
      ? {
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "ARTIST",
        }
      : { email: "", password: "" },
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (data: LoginFormData | RegisterFormData) => {
    setServerError(null);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));

    try {
      const result = await onSubmitAction(formData);
      if (result && result.error) {
        console.log("Error:", result.error);
        setServerError(result.error);
      } else {
        form.reset();
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        (error as any).message.includes("NEXT_REDIRECT")
      ) {
        return;
      }
      setServerError(`${error}`);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 ", className)} {...props}>
      <Card>
        <CardHeader className="flex flex-col gap-6 justify-center items-center text-center">
          <Logo alt="Logo" width={80} height={80} className="mt-6" />
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="grid gap-6"
            >
              {formFields.map((field) => (
                <FormInputField
                  key={field.name}
                  control={form.control}
                  {...field}
                  isRegister={register}
                />
              ))}
              {serverError && (
                <div className="text-sm text-center text-red-500">
                  {serverError}
                </div>
              )}
              <Button type="submit" className="w-full">
                {buttonText}
              </Button>
              <div className="text-sm text-center">
                {bottomText}
                <a href={bottomLink} className="underline underline-offset-4">
                  {bottomLinkText}
                </a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
