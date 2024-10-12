'use client';
import { Button } from '@/components/ui/button';
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
import { iso3ToName } from '@/lib/constants/country-alpha-3-to-name';
import { cn } from '@/lib/utils/tailwind-helpers';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useMemo, useState } from 'react';

const getIso2FromIso3 = (iso3: string) => iso3.toLowerCase().slice(0, 2);

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CountrySelector({
  value: initialValue,
  onChange,
}: CountrySelectorProps) {
  const t = useTranslations();

  const initialCountry = iso3ToName[initialValue];

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialCountry || '');
  const [search, setSearch] = useState('');

  const countries = useMemo(
    () =>
      Object.entries(iso3ToName).map(([iso3, name]) => ({
        name,
        flag: iso3,
      })),
    [],
  );

  const filteredCountries = useMemo(
    () =>
      countries.filter((country) =>
        country.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [countries, search],
  );

  const visibleCountries = useMemo(
    () => filteredCountries.slice(0, 20),
    [filteredCountries],
  );

  return (
    <div className="flex w-full items-center gap-2">
      <Popover open={open} modal onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            aria-expanded={open}
            className="w-full justify-between"
            role="combobox"
            variant="outline"
          >
            {value
              ? countries.find((country) => country.name === value)?.flag +
                ' ' +
                value
              : 'Select country...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="popover-content-width-full w-full p-0">
          <Command>
            <CommandInput
              placeholder="Search country..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>{t('general.no_results')}</CommandEmpty>
            <CommandGroup>
              <CommandList>
                {visibleCountries.map((country) => (
                  <CommandItem
                    key={country.name}
                    value={country.name}
                    onSelect={(currentValue) => {
                      const iso3 = Object.keys(iso3ToName).find(
                        (key) => iso3ToName[key] === currentValue,
                      );
                      setValue(currentValue === value ? '' : currentValue);
                      onChange(currentValue === value ? '' : iso3!);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === country.name ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <Image
                      alt={country.name}
                      className="rounded-[2px]"
                      height={20}
                      loading="lazy"
                      src={`/countries/${getIso2FromIso3(country.flag)}.svg`}
                      width={20}
                      onError={(e) => {
                        e.preventDefault();
                        (e.target as HTMLImageElement).src =
                          '/countries/unknown.svg';
                      }}
                    />
                    <span className="ml-2">{country.name}</span>
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        onClick={() => {
          setValue('');
          onChange('');
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
