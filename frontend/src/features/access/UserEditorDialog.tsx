import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { CONTROL_CLASS, Field, FieldError, LABEL_CLASS } from '@/components/ui/Field';
import { CloseIcon } from '@/components/ui/icons';
import { Modal, MODAL_CLOSE_BUTTON_CLASS } from '@/components/ui/Modal';
import { RadioPillGroup } from '@/components/ui/RadioPillGroup';
import { useAccessStore, type UserEditor } from '@/stores/access-store';
import { useAppStore } from '@/stores/app-store';
import { ROLES } from '@/types/access';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from './access-labels';
import { toFormValues, toUserInput, userFormSchema, type UserFormValues } from './access-schema';

const ROLE_OPTIONS = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

export function UserEditorDialog({ editor }: { editor: UserEditor }) {
  const workspaces = useAccessStore((s) => s.workspaces);
  const users = useAccessStore((s) => s.users);
  const closeEditor = useAccessStore((s) => s.closeEditor);
  const saveUser = useAccessStore((s) => s.saveUser);
  const showToast = useAppStore((s) => s.showToast);

  const editing = editor.mode === 'edit' ? users.find((u) => u.id === editor.userId) : undefined;

  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: toFormValues(workspaces, editing),
  });
  const access = useWatch({ control, name: 'access' });

  const onSubmit = (values: UserFormValues) => {
    const input = toUserInput(workspaces, values);
    const taken = users.some((u) => u.email === input.email && u.id !== editing?.id);
    if (taken) {
      setError(
        'email',
        { message: 'Another user already has this email address.' },
        { shouldFocus: true },
      );
      return;
    }
    saveUser(input, editing?.id);
    showToast(editing ? 'Changes applied · sample only' : 'User added · sample only');
  };

  const title = editing ? 'Edit user' : 'Add user';
  const accessError = errors.access?.root?.message;

  return (
    <Modal labelledBy="user-editor-title" onClose={closeEditor}>
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 id="user-editor-title" className="font-display text-xl font-bold text-navy">
            {title}
          </h2>
          <p className="text-xs text-muted">
            {editing
              ? 'Update their details and which workspaces they can open.'
              : 'They’ll set up multi-factor authentication the first time they sign in.'}
          </p>
        </div>
        <button
          type="button"
          onClick={closeEditor}
          aria-label="Close"
          className={`${MODAL_CLOSE_BUTTON_CLASS} text-muted hover:bg-paper hover:text-navy`}
        >
          <CloseIcon className="size-4.5" />
        </button>
      </div>

      <form
        noValidate
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      >
        <div className="grid gap-5 overflow-y-auto px-5 py-5 sm:px-6">
          <Field id="user-name" label="Full name" required error={errors.name?.message}>
            <input
              id="user-name"
              data-autofocus
              autoComplete="off"
              className={CONTROL_CLASS}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'user-name-error' : undefined}
              {...register('name')}
            />
          </Field>

          <Field id="user-email" label="Email address" required error={errors.email?.message}>
            <input
              id="user-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="name@example.gov"
              className={CONTROL_CLASS}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'user-email-error' : undefined}
              {...register('email')}
            />
          </Field>

          <fieldset
            className="grid min-w-0 gap-2.5"
            aria-describedby={accessError ? 'user-access-error' : undefined}
          >
            <legend className={`${LABEL_CLASS} mb-1`}>
              Workspace access<span className="text-brick"> *</span>
            </legend>
            {workspaces.map((w) => {
              const current = access[w.id];
              const assigned = Boolean(current?.assigned);
              return (
                <div
                  key={w.id}
                  className={`rounded-xl border p-3.5 transition-colors ${
                    assigned ? 'border-navy/20 bg-paper/60' : 'border-line bg-white'
                  }`}
                >
                  <Checkbox
                    label={<span className="font-semibold text-navy">{w.name}</span>}
                    {...register(`access.${w.id}.assigned`, {
                      onChange: () => clearErrors('access.root'),
                    })}
                  />
                  {assigned && current && (
                    <div className="mt-3 space-y-1.5 pl-6.5">
                      <Controller
                        control={control}
                        name={`access.${w.id}.role`}
                        render={({ field }) => (
                          <RadioPillGroup
                            legend={`Role in ${w.name}`}
                            name={`role-${w.id}`}
                            options={ROLE_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <p className="text-xs text-muted">{ROLE_DESCRIPTIONS[current.role]}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {accessError && <FieldError id="user-access-error" message={accessError} />}
          </fieldset>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-line bg-paper/60 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <p className="text-xs text-muted sm:mr-auto">Sample only: nothing is saved or sent.</p>
          <Button variant="secondary" onClick={closeEditor}>
            Cancel
          </Button>
          <Button type="submit">{editing ? 'Save changes' : 'Add user'}</Button>
        </div>
      </form>
    </Modal>
  );
}
