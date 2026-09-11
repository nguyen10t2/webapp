import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { joinGroupSchema, type JoinGroupInput } from '@/domain/groups'
import { useJoinGroup } from '@/features/groups/api'
import { apiErrorMessage } from '@/features/auth/helpers'
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

/** Dialog vào nhóm bằng invite code. Sai mã → inline INVALID_INVITE_CODE. */
export function JoinGroupDialog({ trigger }: { trigger: React.ReactNode }) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const joinGroup = useJoinGroup()
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<JoinGroupInput>({ resolver: zodResolver(joinGroupSchema) })

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (!next) reset()
            }}
        >
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>{t('groups.joinTitle')}</DialogTitle>
                    <DialogDescription>{t('groups.joinSubtitle')}</DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit((input) => {
                        joinGroup.mutate(
                            { code: input.code.trim() },
                            {
                                onSuccess: (group) => {
                                    toast.success(t('groups.joinSuccess'))
                                    setOpen(false)
                                    reset()
                                    navigate(`/groups/${group.id}`)
                                },
                                onError: (error) => {
                                    if (error.code === 'INVALID_INVITE_CODE') {
                                        setError('code', { message: apiErrorMessage(t, error) })
                                    } else {
                                        toast.error(apiErrorMessage(t, error))
                                    }
                                },
                            },
                        )
                    })}
                    noValidate
                    className="space-y-4"
                >
                    <Field
                        label={t('groups.inviteCode')}
                        htmlFor="join-group-code"
                        error={errors.code && t(errors.code.message ?? 'errors.VALIDATION_ERROR')}
                        errorId="join-group-code-error"
                    >
                        <Input
                            id="join-group-code"
                            autoComplete="off"
                            placeholder="AB12CD34"
                            aria-describedby={errors.code ? 'join-group-code-error' : undefined}
                            aria-invalid={!!errors.code}
                            className="font-mono uppercase"
                            {...register('code')}
                        />
                    </Field>
                    <DialogFooter>
                        <Button type="submit" disabled={joinGroup.isPending} className="w-full sm:w-auto">
                            {joinGroup.isPending ? t('groups.joining') : t('groups.join')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
