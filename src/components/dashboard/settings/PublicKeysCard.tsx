'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Copy, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PublicKeysCardProps {
  publicKeyRsa: string | undefined;
}

export default function PublicKeysCard({ publicKeyRsa }: PublicKeysCardProps) {
  const t = useTranslations();

  const [plainFormat, setPlainFormat] = useState('');
  const [base64Format, setBase64Format] = useState('');

  const importKey = useCallback(async () => {
    if (!publicKeyRsa) {
      return;
    }

    setPlainFormat(publicKeyRsa);
    setBase64Format(btoa(publicKeyRsa));
  }, [publicKeyRsa]);

  useEffect(() => {
    importKey();
  }, [importKey]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error: any) {
      toast.error(error.message ?? t('general.error'));
    }
  };

  const handleResetKey = async () => {
    //
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-bold">
          {t('dashboard.settings.rsa_public_key')}
        </CardTitle>
        <CardDescription>
          {t('dashboard.settings.rsa_public_key_description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t('dashboard.settings.plain_format')}
            </h3>
            <Button
              className="text-xs text-inherit"
              disabled={!plainFormat}
              size="sm"
              variant="link"
              onClick={() => copyToClipboard(plainFormat)}
            >
              <Copy className="mr-2 h-4 w-4" />
              {t('general.click_to_copy')}
            </Button>
          </div>
          {plainFormat ? (
            <Textarea
              className="h-44 font-mono text-xs"
              value={plainFormat}
              readOnly
            />
          ) : (
            <Card className="flex h-44 flex-col gap-1 p-2">
              <Skeleton className="h-full w-full" />
            </Card>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t('dashboard.settings.base_64_encoded')}
            </h3>
            <Button
              className="text-xs text-inherit"
              disabled={!base64Format}
              size="sm"
              variant="link"
              onClick={() => copyToClipboard(base64Format)}
            >
              <Copy className="mr-2 h-4 w-4" />
              {t('general.click_to_copy')}
            </Button>
          </div>
          {base64Format ? (
            <Input
              className="font-mono text-xs"
              value={base64Format}
              readOnly
            />
          ) : (
            <Card className="flex h-10 p-2">
              <Skeleton className="h-full w-full" />
            </Card>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="secondary" onClick={handleResetKey}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {t('dashboard.settings.reset_key')}
        </Button>
      </CardFooter>
    </Card>
  );
}
