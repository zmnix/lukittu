import { ITeamGetSuccessResponse } from '@/app/api/(dashboard)/teams/[slug]/route';
import { ITeamsSettingsValidationEditResponse } from '@/app/api/(dashboard)/teams/settings/validation/route';
import LoadingButton from '@/components/shared/LoadingButton';
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
import {
  SetTeamValidationSettingsSchema,
  setTeamValidationSettingsSchema,
} from '@/lib/validation/team/set-team-validation-settings-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface TeamValidationSettingsProps {
  team: ITeamGetSuccessResponse['team'] | null;
}

export default function TeamValidationSettings({
  team,
}: TeamValidationSettingsProps) {
  const t = useTranslations();

  const [loading, setLoading] = useState(false);

  const form = useForm<SetTeamValidationSettingsSchema>({
    resolver: zodResolver(setTeamValidationSettingsSchema(t)),
    defaultValues: {
      strictCustomers: false,
      strictProducts: false,
      strictReleases: false,
      heartbeatTimeout: 60,
      ipLimitPeriod: 'DAY',
    },
  });

  useEffect(() => {
    form.reset({
      strictCustomers: team?.settings.strictCustomers ?? false,
      strictProducts: team?.settings.strictProducts ?? false,
      strictReleases: team?.settings.strictReleases ?? false,
      heartbeatTimeout: team?.settings.heartbeatTimeout ?? 60,
      ipLimitPeriod: team?.settings.ipLimitPeriod ?? 'DAY',
    });
  }, [form, team]);

  const onSubmit = async (payload: SetTeamValidationSettingsSchema) => {
    setLoading(true);
    try {
      const response = await fetch('/api/teams/settings/validation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data =
        (await response.json()) as ITeamsSettingsValidationEditResponse;

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-bold">
          {t('dashboard.settings.validation_settings')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="space-y-2 max-md:px-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
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
              name="strictReleases"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('dashboard.settings.strict_releases')}
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
              name="ipLimitPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('dashboard.settings.ip_limit_period')}
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <FormControl>
                      <SelectTrigger disabled={!team || loading}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DAY">{t('general.day')}</SelectItem>
                      <SelectItem value="WEEK">{t('general.week')}</SelectItem>
                      <SelectItem value="MONTH">
                        {t('general.month')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="heartbeatTimeout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('dashboard.settings.heartbeat_timeout')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={!team || loading}
                      min={1}
                      placeholder={t('dashboard.settings.heartbeat_timeout')}
                      type="number"
                      value={field.value}
                      onChange={(e) => {
                        if (!e.target.value || e.target.value === '0') {
                          e.target.value = '1';
                        }
                        form.setValue('heartbeatTimeout', +e.target.value);
                      }}
                    />
                  </FormControl>
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
