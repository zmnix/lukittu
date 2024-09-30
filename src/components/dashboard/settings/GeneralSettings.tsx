import { ITeamGetSuccessResponse } from '@/app/api/(dashboard)/teams/[slug]/route';
import { ITeamsImageSetResponse } from '@/app/api/(dashboard)/teams/image/route';
import { ITeamsSettingsEditResponse } from '@/app/api/(dashboard)/teams/settings/route';
import LoadingButton from '@/components/shared/LoadingButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getInitials } from '@/lib/utils/text-helpers';
import {
  SetTeamSettingsSchema,
  setTeamSettingsSchema,
} from '@/lib/validation/team/set-team-settings-schema';
import { AuthContext } from '@/providers/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface GeneralSettingsProps {
  team: ITeamGetSuccessResponse['team'] | null;
}

export default function GeneralSettings({ team }: GeneralSettingsProps) {
  const t = useTranslations();
  const ctx = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    setImageUrl(team?.imageUrl ?? null);
  }, [team]);

  const form = useForm<SetTeamSettingsSchema>({
    resolver: zodResolver(setTeamSettingsSchema(t)),
    defaultValues: {
      strictCustomers: false,
      strictProducts: false,
    },
  });

  useEffect(() => {
    form.reset({
      strictCustomers: team?.settings?.strictCustomers ?? false,
      strictProducts: team?.settings?.strictProducts ?? false,
      emailMessage: team?.settings?.emailMessage ?? '',
    });
  }, [form, team]);

  const emailMessage = form.watch('emailMessage');

  const onSubmit = async (payload: SetTeamSettingsSchema) => {
    setLoading(true);
    try {
      const response = await fetch('/api/teams/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as ITeamsSettingsEditResponse;

      if ('message' in data) {
        toast.error(data.message);
        return;
      }

      toast.success(t('dashboard.settings.team_settings_updated'));
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/teams/image', {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json()) as ITeamsImageSetResponse;

      if ('message' in data) {
        toast.error(data.message);
        return;
      }

      setImageUrl(data.url);
      ctx.setSession((session) => ({
        ...session!,
        user: {
          ...session!.user,
          teams: session!.user.teams.map((t) =>
            t.id === team?.id ? { ...t, imageUrl: data.url } : t,
          ),
        },
      }));
      toast.success(t('dashboard.settings.team_image_updated'));
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = () => {
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-bold">
          {t('general.team')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="space-y-2 max-md:px-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="relative">
              <div className="mb-1 text-sm font-semibold">
                {t('general.avatar')}
              </div>
              <Avatar className="h-32 w-32 border max-md:h-28 max-md:w-28">
                <AvatarImage src={imageUrl!} asChild>
                  {imageUrl && (
                    <Image
                      alt="Team image"
                      className="object-cover"
                      height={128}
                      src={imageUrl}
                      width={128}
                    />
                  )}
                </AvatarImage>
                <AvatarFallback className="bg-primary text-2xl text-white">
                  {getInitials(team?.name ?? '??')}
                </AvatarFallback>
              </Avatar>
              <LoadingButton
                className="absolute bottom-0 left-0"
                disabled={!team || uploading}
                pending={uploading}
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  handleFileSelect();
                }}
              >
                {t('general.edit')}
              </LoadingButton>
              <Input
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUpload(file);
                  }
                }}
              />
            </div>
            <FormField
              control={form.control}
              name="strictCustomers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('dashboard.settings.strict_customers')}
                  </FormLabel>
                  <Select
                    value={`${field.value}`}
                    onValueChange={(value) => field.onChange(value === 'true')}
                  >
                    <FormControl>
                      <SelectTrigger disabled={!team || loading}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="strictProducts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('dashboard.settings.strict_products')}
                  </FormLabel>
                  <Select
                    value={`${field.value}`}
                    onValueChange={(value) => field.onChange(value === 'true')}
                  >
                    <FormControl>
                      <SelectTrigger disabled={!team || loading}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailMessage"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between pt-2">
                    <FormLabel htmlFor="emailMessage">
                      {t('dashboard.settings.email_delivery_message')}
                    </FormLabel>
                    <div className="flex justify-end text-xs text-muted-foreground">
                      {emailMessage?.length ?? 0} / 1000
                    </div>
                  </div>
                  <Textarea
                    {...field}
                    className="form-textarea"
                    disabled={!team || loading}
                    id="emailMessage"
                    maxLength={1000}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
          <button className="hidden" type="submit" />
        </Form>
      </CardContent>
      <CardFooter>
        <LoadingButton
          pending={loading}
          size="sm"
          type="submit"
          variant="secondary"
          onClick={form.handleSubmit(onSubmit)}
        >
          <Save className="mr-2 h-4 w-4" />
          {t('general.save')}
        </LoadingButton>
      </CardFooter>
    </Card>
  );
}
