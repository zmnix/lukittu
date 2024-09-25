'use client';
import { Button } from '@/components/ui/button';
import { MemberModalContext } from '@/providers/MemberModalProvider';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';

interface AddMemberButtonProps {
  disabled?: boolean;
}

export default function AddMemberButton({
  disabled = false,
}: AddMemberButtonProps) {
  const t = useTranslations();
  const ctx = useContext(MemberModalContext);

  return (
    <Button
      className="ml-auto flex gap-2"
      disabled={disabled}
      size="sm"
      variant="default"
      onClick={() => ctx.setMemberModalOpen(true)}
    >
      <Plus className="h-4 w-4" />
      <span className="max-md:hidden">{t('dashboard.members.new_member')}</span>
    </Button>
  );
}
