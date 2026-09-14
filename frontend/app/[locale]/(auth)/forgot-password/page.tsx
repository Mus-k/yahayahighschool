'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validators';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email: data.email });
      setIsSuccess(true);
      toast.success(t('emailSent'));
    } catch {
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center p-2 mb-4">
            <Image src="/yahaya-logo.jpeg" alt="YAHAYASCOOL" width={48} height={48} className="rounded-xl object-contain" priority />
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{t('emailSent')}</h2>
              <p className="text-muted-foreground text-sm">
                If that email is registered, you will receive a password reset link shortly.
                Check your spam folder if you don&apos;t see it.
              </p>
              <Link href={ROUTES.AUTH.LOGIN}>
                <Button variant="outline" className="mt-4 w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('backToLogin')}
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-1">{t('forgotTitle')}</h2>
              <p className="text-muted-foreground text-sm mb-6">{t('forgotSubtitle')}</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    {t('email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="your.email@yahayascool.edu.ng"
                      disabled={isLoading}
                      {...register('email')}
                      className={cn(
                        'w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-foreground text-sm',
                        'placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring',
                        'disabled:opacity-50 transition-all',
                        errors.email ? 'border-destructive' : 'border-input hover:border-primary/40'
                      )}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isLoading} className="w-full py-3 h-auto text-base rounded-xl">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending…
                    </span>
                  ) : t('sendResetLink')}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href={ROUTES.AUTH.LOGIN}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {t('backToLogin')}
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
