'use client';
import { IProductsReleasesGetSuccessResponse } from '@/app/api/(dashboard)/products/releases/route';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReleaseModalContext } from '@/providers/ReleasesModalProvider';
import { VariantProps } from 'class-variance-authority';
import { Edit, Ellipsis, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';

interface ReleasesActionDropdownProps {
  release: IProductsReleasesGetSuccessResponse['releases'][number] | undefined;
  variant?: VariantProps<typeof buttonVariants>['variant'];
}

export const ReleasesActionDropdown = ({
  release,
  variant = 'ghost',
}: ReleasesActionDropdownProps) => {
  const t = useTranslations();
  const ctx = useContext(ReleaseModalContext);

  if (!release) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant={variant}>
          <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-medium" forceMount>
        <DropdownMenuItem
          className="hover:cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            ctx.setReleaseToEdit(release);
            ctx.setReleaseModalOpen(true);
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          {t('dashboard.releases.update_release')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive hover:cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            ctx.setReleaseToDelete(release);
            ctx.setReleaseToDeleteModalOpen(true);
          }}
        >
          <Trash className="mr-2 h-4 w-4" />
          {t('dashboard.releases.delete_release')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
