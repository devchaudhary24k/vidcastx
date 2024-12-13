'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LoginSchema } from '@/validators/auth-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { signIn } from '@/auth/client';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const LoginPage = () => {
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof LoginSchema>) => {
    const { email, password } = data;

    await signIn.email({
      email,
      password,
      callbackURL: DEFAULT_LOGIN_REDIRECT,
      fetchOptions: {
        onSuccess: () => {
          toast.success('Authenticated successfully');
        },
        onError(ctx) {
          // Email verification error
          if (ctx.error.status === 403) {
            toast.error('Please verify your email address');
            // TODO: On success send to a page which tells to check inbox
          } else {
            // Other errors
            toast.error(ctx.error.message);
          }
        },
      },
    });

    form.reset();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Welcome back! Please sign in to continue.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="dev@example.com"
                      type="email"
                      disabled={form.formState.isSubmitting}
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
                      {...field}
                      placeholder="******"
                      type="password"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Link
              href="/auth/forgot-password"
              className="text-sm text-muted-foreground"
            >
              Forgot your password
            </Link>
            <Button
              className="w-full"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              Login
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have account yet?{' '}
          <Link href="/auth/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export default LoginPage;
