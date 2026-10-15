import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field, FieldError, LABEL_CLASS } from '@/components/ui/Field';
import { IconInput } from '@/components/ui/IconInput';
import { MailIcon } from '@/components/ui/icons';
import {
  AuthHeading,
  AuthNotice,
  PasswordInput,
  TEXT_LINK_CLASS,
  type AuthNoticeContent,
} from './AuthControls';
import { loginSchema, type LoginValues } from './auth-schema';

const SIGN_IN_PENDING: AuthNoticeContent = {
  title: 'Sign-in isn’t connected yet',
  body: 'Your details passed validation, but authentication and MFA are still being built for Milestone 2. Nothing was sent or stored.',
};

export function LoginPage() {
  const [notice, setNotice] = useState<AuthNoticeContent | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  return (
    <section>
      <AuthHeading
        eyebrow="Secure sign-in"
        title="Welcome back"
        description="Sign in to your Seventh Vote workspace to rehearse council sessions and prepare your outreach."
      />

      <Card className="sm:p-7">
        <form
          noValidate
          className="grid gap-5"
          onSubmit={(e) => void handleSubmit(() => setNotice(SIGN_IN_PENDING))(e)}
        >
          <Field id="login-email" label="Email address" error={errors.email?.message}>
            <IconInput
              id="login-email"
              icon={MailIcon}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="name@example.gov"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              {...register('email')}
            />
          </Field>

          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="login-password" className={LABEL_CLASS}>
                Password
              </label>
              <Link to="/forgot-password" className={`text-xs ${TEXT_LINK_CLASS}`}>
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              {...register('password')}
            />
            {errors.password?.message && (
              <FieldError id="login-password-error" message={errors.password.message} />
            )}
          </div>

          <Checkbox label="Keep me signed in on this device" {...register('remember')} />

          <Button type="submit" fullWidth className="mt-1">
            Sign in
          </Button>

          <AuthNotice notice={notice} />
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-muted">
        New to Seventh Vote?{' '}
        <Link to="/register" className={TEXT_LINK_CLASS}>
          Create an account
        </Link>
      </p>
    </section>
  );
}
