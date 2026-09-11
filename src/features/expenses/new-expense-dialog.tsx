import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GroupMember } from '@/domain/groups'
import type { Currency } from '@/domain/groups/types'
import { ExpenseWizard } from '@/features/expenses/expense-wizard'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog'

/**
 * Popup thêm chi tiêu (mở ngay trên trang nhóm, không chuyển page).
 * Đóng popup là unmount wizard → state các bước reset sạch.
 */
export function NewExpenseDialog({
    groupId,
    groupName,
    members,
    defaultCurrency,
    myId,
    trigger,
}: {
    groupId: string
    groupName: string
    members: GroupMember[]
    defaultCurrency: Currency
    myId: string | undefined
    trigger: React.ReactNode
}) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent
                aria-describedby="new-expense-desc"
                className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
            >
                <DialogHeader>
                    <DialogTitle>{t('expenses.newExpense')}</DialogTitle>
                    <DialogDescription id="new-expense-desc">{groupName}</DialogDescription>
                </DialogHeader>
                {open && (
                    <ExpenseWizard
                        groupId={groupId}
                        members={members}
                        defaultCurrency={defaultCurrency}
                        myId={myId}
                        onDone={() => setOpen(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
