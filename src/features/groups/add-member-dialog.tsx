import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAddMember, useLookupUserByEmail } from '@/features/groups/api'
import { apiErrorMessage } from '@/features/auth/helpers'
import type { AuthUser } from '@/domain/auth'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog'

const lookupSchema = z.object({ email: z.string().min(1, 'REQUIRED') })

/**
 * Thêm thành viên (chỉ ADMIN thấy nút): nhập email → lookup → xem trước user →
 * chọn role → thêm. Lookup on-demand (không fetch lúc gõ).
 */
export function AddMemberDialog({ groupId, trigger }: { groupId: string; trigger: React.ReactNode }) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [found, setFound] = useState<AuthUser | null>(null)
    const [role, setRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER')
    const lookup = useLookupUserByEmail()
    const addMember = useAddMember(groupId)
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<{ email: string }>({ resolver: zodResolver(lookupSchema) })

    const close = () => {
        setOpen(false)
        setFound(null)
        setRole('MEMBER')
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (next) setOpen(true)
                else close()
            }}
        >
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>{t('groups.addMember')}</DialogTitle>
                    <DialogDescription>{t('groups.addMemberSubtitle')}</DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit((input) => {
                        lookup.mutate(input.email, {
                            onSuccess: (user) => setFound(user),
                            onError: (error) => {
                                setFound(null)
                                toast.error(apiErrorMessage(t, error))
                            },
                        })
                    })}
                    noValidate
                    className="space-y-4"
                >
                    <Field
                        label={t('auth.email')}
                        htmlFor="add-member-email"
                        error={errors.email && t(errors.email.message ?? 'errors.VALIDATION_ERROR')}
                        errorId="add-member-email-error"
                    >
                        <Input
                            id="add-member-email"
                            type="email"
                            autoComplete="off"
                            placeholder={t('auth.emailPlaceholder')}
                            aria-describedby={errors.email ? 'add-member-email-error' : undefined}
                            aria-invalid={!!errors.email}
                            {...register('email')}
                        />
                    </Field>
                    <Button type="submit" variant="outline" disabled={lookup.isPending} className="w-full">
                        {lookup.isPending ? t('groups.lookingUp') : t('groups.lookup')}
                    </Button>
                </form>
                {found && (
                    <div className="space-y-4 rounded-lg border border-border p-4">
                        <p className="text-base">
                            <span className="font-medium">{found.fullName}</span>{' '}
                            <span className="text-muted-foreground">{found.email}</span>
                        </p>
                        <div className="flex gap-2" role="group" aria-label="Role">
                            {(['MEMBER', 'ADMIN'] as const).map((r) => (
                                <Button
                                    key={r}
                                    type="button"
                                    variant={role === r ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => setRole(r)}
                                    aria-pressed={role === r}
                                >
                                    {r === 'ADMIN' ? t('groups.roleAdmin') : t('groups.roleMember')}
                                </Button>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button
                                disabled={addMember.isPending}
                                onClick={() => {
                                    addMember.mutate(
                                        { userId: found.id, role },
                                        {
                                            onSuccess: () => {
                                                toast.success(t('groups.addSuccess'))
                                                close()
                                            },
                                            onError: (error) => toast.error(apiErrorMessage(t, error)),
                                        },
                                    )
                                }}
                                className="w-full sm:w-auto"
                            >
                                {addMember.isPending ? t('groups.adding') : t('groups.add')}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
