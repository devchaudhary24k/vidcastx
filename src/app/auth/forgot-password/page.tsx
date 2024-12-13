'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { EmailSchema } from '@/validators/auth-schema';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { forgetPassword } from '@/auth/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const ForgotPassword = () => {
  const form = useForm<z.infer<typeof EmailSchema>>({
    resolver: zodResolver(EmailSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof EmailSchema>) => {
    const { email } = data;

    await forgetPassword({
      email,
      redirectTo: '/auth/reset-password',
      fetchOptions: {
        onError: (ctx) => {
          console.log(ctx.error);
        },
        onSuccess: () => {
          toast.success('Please check your inbox');
        },
      },
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>Enter email to reset your password</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter you email"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button className="w-full">Reset password</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ForgotPassword;
