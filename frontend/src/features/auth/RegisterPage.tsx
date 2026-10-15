import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field, FieldError } from '@/components/ui/Field';
import { IconInput } from '@/components/ui/IconInput';
import { MailIcon, UserIcon } from '@/components/ui/icons';
import {
  AuthHeading,
  AuthNotice,
  PasswordInput,
  TEXT_LINK_CLASS,
  type AuthNoticeContent,
} from './AuthControls';
import { registerSchema, type RegisterValues } from './auth-schema';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

const REGISTRATION_PENDING: AuthNoticeContent = {
  title: 'Registration isn’t connected yet',
  body: 'Your details passed validation, but account creation and MFA setup are still being built for Milestone 2. No account was created and nothing was stored.',
};

function describedBy(...ids: (string | false | undefined)[]) {
  return ids.filter(Boolean).join(' ') || undefined;
}

export function RegisterPage() {
  const [notice, setNotice] = useState<AuthNoticeContent | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });
  const password = useWatch({ control, name: 'password' });

  return (
    <section>
      <AuthHeading
        eyebrow="Workspace access"
        title="Create your account"
        description="Request access to your Seventh Vote workspace. Your administrator assigns your council workspace and role."
      />

      <Card className="sm:p-7">
        <form
          noValidate
          className="grid gap-5"
          onSubmit={(e) => void handleSubmit(() => setNotice(REGISTRATION_PENDING))(e)}
        >
          <Field id="register-name" label="Full name" error={errors.fullName?.message}>
            <IconInput
              id="register-name"
              icon={UserIcon}
              autoComplete="name"
              placeholder="Jordan Ellis"
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? 'register-name-error' : undefined}
              {...register('fullName')}
            />
          </Field>

          <Field id="register-email" label="Work email" error={errors.email?.message}>
            <IconInput
              id="register-email"
              icon={MailIcon}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="name@example.gov"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'register-email-error' : undefined}
              {...register('email')}
            />
          </Field>

          <Field id="register-password" label="Password" error={errors.password?.message}>
            <PasswordInput
              id="register-password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={describedBy(
                'register-password-strength',
                errors.password && 'register-password-error',
              )}
              {...register('password')}
            />
            <PasswordStrengthMeter id="register-password-strength" password={password} />
          </Field>

          <Field
            id="register-confirm"
            label="Confirm password"
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              id="register-confirm"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? 'register-confirm-error' : undefined}
              {...register('confirmPassword')}
            />
          </Field>

          <div className="grid gap-1.5">
            <Checkbox
              aria-invalid={Boolean(errors.acceptTerms)}
              aria-describedby={errors.acceptTerms ? 'register-terms-error' : undefined}
              label={
                <>
                  I agree to the{' '}
                  <strong className="font-semibold text-navy">Terms of Service</strong> and{' '}
                  <strong className="font-semibold text-navy">Privacy Policy</strong>.
                </>
              }
              {...register('acceptTerms')}
            />
            {errors.acceptTerms?.message && (
              <FieldError id="register-terms-error" message={errors.acceptTerms.message} />
            )}
          </div>

          <Button type="submit" fullWidth className="mt-1">
            Create account
          </Button>

          <AuthNotice notice={notice} />
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className={TEXT_LINK_CLASS}>
          Sign in
        </Link>
      </p>
    </section>
  );
}
