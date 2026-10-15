import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { IconInput } from '@/components/ui/IconInput';
import { MailIcon, UserIcon } from '@/components/ui/icons';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/stores/app-store';
import { useProfileStore } from '@/stores/profile-store';
import { personalInfoSchema, type PersonalInfoValues } from './profile-schema';
import { ProfileSection } from './ProfileSection';

interface PersonalInfoCardProps {
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-paper px-3.5 py-3">
      <dt className="text-xs font-semibold text-navy">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-ink">{value}</dd>
    </div>
  );
}

export function PersonalInfoCard({ editing, onEditingChange }: PersonalInfoCardProps) {
  const user = useProfileStore((s) => s.user);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const showToast = useAppStore((s) => s.showToast);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: { name: user.name, email: user.email },
  });

  // Start every edit session from the current stored values, not a stale draft.
  useEffect(() => {
    if (editing) reset({ name: user.name, email: user.email });
  }, [editing, reset, user.name, user.email]);

  const stopEditing = () => {
    setConfirmDiscard(false);
    onEditingChange(false);
  };

  const onSubmit = (values: PersonalInfoValues) => {
    updateProfile({ name: values.name, email: values.email.toLowerCase() });
    showToast('Profile updated · this browser only');
    stopEditing();
  };

  const onCancel = () => {
    if (isDirty) setConfirmDiscard(true);
    else stopEditing();
  };

  return (
    <ProfileSection
      id="profile-personal"
      title="Personal information"
      description="Your name and the email address you sign in with."
      action={
        !editing && (
          <Button variant="secondary" className="shrink-0" onClick={() => onEditingChange(true)}>
            Edit
          </Button>
        )
      }
    >
      {editing ? (
        <form noValidate className="grid gap-5" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="profile-name" label="Full name" required error={errors.name?.message}>
              <IconInput
                id="profile-name"
                icon={UserIcon}
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'profile-name-error' : undefined}
                {...register('name')}
              />
            </Field>
            <Field
              id="profile-email"
              label="Email address"
              required
              hint="Used for sign-in and account notices."
              error={errors.email?.message}
            >
              <IconInput
                id="profile-email"
                icon={MailIcon}
                type="email"
                inputMode="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'profile-email-error' : 'profile-email-hint'}
                {...register('email')}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-3 border-t border-line2 pt-4 sm:flex-row sm:items-center">
            <p className="text-xs text-muted sm:mr-auto">
              Changes stay in this browser until the auth service is connected.
            </p>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2">
          <ReadOnlyValue label="Full name" value={user.name} />
          <ReadOnlyValue label="Email address" value={user.email} />
        </dl>
      )}

      {confirmDiscard && (
        <Modal labelledBy="profile-discard-title" onClose={() => setConfirmDiscard(false)}>
          <div className="px-5 py-5 sm:px-6">
            <h2 id="profile-discard-title" className="font-display text-xl font-bold text-navy">
              Discard unsaved changes?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Your edits to your name or email will be lost and the saved values restored.
            </p>
          </div>
          <div className="flex flex-col gap-3 border-t border-line bg-paper/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button variant="secondary" data-autofocus onClick={() => setConfirmDiscard(false)}>
              Keep editing
            </Button>
            <Button onClick={stopEditing}>Discard changes</Button>
          </div>
        </Modal>
      )}
    </ProfileSection>
  );
}
