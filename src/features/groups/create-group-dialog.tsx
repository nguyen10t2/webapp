import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { createGroupSchema, type CreateGroupInput } from '@/domain/groups'
import { useCreateGroup } from '@/features/groups/api'
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

/** Dialog tạo nhóm — người tạo thành ADMIN. Đóng + reset khi thành công, vào luôn detail. */
export function CreateGroupDialog({ trigger }: { trigger: React.ReactNode }) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const createGroup = useCreateGroup()
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateGroupInput>({
        resolver: zodResolver(createGroupSchema),
        defaultValues: { name: '', description: '', defaultCurrency: 'VND' },
    })

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
                    <DialogTitle>{t('groups.createTitle')}</DialogTitle>
                    <DialogDescription>{t('groups.createSubtitle')}</DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit((input) => {
                        createGroup.mutate(input, {
                            onSuccess: (group) => {
                                toast.success(t('groups.createSuccess'))
                                setOpen(false)
                                reset()
                                navigate(`/groups/${group.id}`)
                            },
                            onError: (error) => toast.error(apiErrorMessage(t, error)),
                        })
                    })}
                    noValidate
                    className="space-y-4"
                >
                    <Field
                        label={t('groups.groupName')}
                        htmlFor="create-group-name"
                        error={errors.name && t(errors.name.message ?? 'errors.VALIDATION_ERROR')}
                        errorId="create-group-name-error"
                    >
                        <Input
                            id="create-group-name"
                            placeholder={t('groups.groupNamePlaceholder')}
                            aria-describedby={errors.name ? 'create-group-name-error' : undefined}
                            aria-invalid={!!errors.name}
                            {...register('name')}
                        />
                    </Field>
                    <Field label={t('groups.groupDescription')} htmlFor="create-group-desc">
                        <Input
                            id="create-group-desc"
                            placeholder={t('groups.groupDescriptionPlaceholder')}
                            {...register('description')}
                        />
                    </Field>
                    <Field label={t('groups.currency')} htmlFor="create-group-currency">
                        <div className="flex gap-2" role="group" aria-label={t('groups.currency')}>
                            {(['VND', 'USD'] as const).map((currency) => (
                                <label
                                    key={currency}
                                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-4 py-2 font-mono text-base has-checked:border-ring has-checked:bg-muted"
                                >
                                    <input type="radio" value={currency} {...register('defaultCurrency')} className="accent-primary" />
                                    {currency}
                                </label>
                            ))}
                        </div>
                    </Field>
                    <DialogFooter>
                        <Button type="submit" disabled={createGroup.isPending} className="w-full sm:w-auto">
                            {createGroup.isPending ? t('groups.creating') : t('groups.create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
