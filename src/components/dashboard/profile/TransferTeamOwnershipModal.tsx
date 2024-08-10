/* eslint-disable no-unused-vars */
import LoadingButton from '@/components/shared/LoadingButton';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Team, User } from '@prisma/client';
import { ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

interface TransferTeamOwnershipModalProps {
  team: Team & { users: User[] };
  onClose: () => void;
  onConfirm: (team: Team, newOwnerId: number) => Promise<void>;
}

export function TransferTeamOwnershipModal({
  team,
  onClose,
  onConfirm,
}: TransferTeamOwnershipModalProps) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [newOwner, setNewOwner] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    if (!newOwner) return;
    startTransition(async () => {
      await onConfirm(team, newOwner);
      onClose();
    });
  };

  return (
    <AlertDialog open={Boolean(team)} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('dashboard.profile.transfer_ownership_title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t.rich('dashboard.profile.transfer_ownership_description', {
              teamName: team.name,
              strong: (child) => <strong>{child}</strong>,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              aria-expanded={open}
              className="w-full justify-between"
              role="combobox"
              variant="outline"
            >
              {newOwner
                ? team.users.find((user) => user.id === newOwner)?.fullName
                : t('general.select_new_owner')}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="popover-content-width-full w-full p-0">
            <Command
              filter={(value, search) => {
                const item = team.users.find(
                  (user) => user.id === parseInt(value),
                );
                return item?.fullName
                  .toLowerCase()
                  .includes(search.toLowerCase())
                  ? 1
                  : 0;
              }}
            >
              <CommandInput placeholder={t('general.search_user')} />
              <CommandList>
                <CommandEmpty className="px-4 py-4 text-sm">
                  {t('general.no_users_found')}
                </CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="flex max-h-40 flex-col overflow-y-auto">
                    {team.users
                      .filter((user) => user.id !== team.ownerId)
                      .map((user) => (
                        <CommandItem
                          key={user.id.toString()}
                          value={user.id.toString()}
                          onSelect={() => {
                            setNewOwner(user.id);
                            setOpen(false);
                          }}
                        >
                          {user.fullName}
                        </CommandItem>
                      ))}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <AlertDialogFooter>
          <AlertDialogCancel
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
            onClick={onClose}
          >
            {t('general.cancel')}
          </AlertDialogCancel>
          <LoadingButton
            className={buttonVariants({
              variant: 'destructive',
              size: 'sm',
            })}
            disabled={!newOwner}
            pending={pending}
            onClick={handleConfirm}
          >
            {t('general.transfer_ownership')}
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
