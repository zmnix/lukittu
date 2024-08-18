'use client';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TableSearch() {
  const searchParams = useSearchParams();
  const [debounceSearch, setDebounceSearch] = useState(
    searchParams.get('search') || '',
  );
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentSearchParam = searchParams.toString();
      const newSearchParams = new URLSearchParams(currentSearchParam);

      if (debounceSearch) {
        newSearchParams.set('search', debounceSearch);
      } else {
        newSearchParams.delete('search');
      }

      router.replace(`?${newSearchParams.toString()}`);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [debounceSearch, router, searchParams]);

  return (
    <div className="relative mb-4 flex max-w-xs items-center max-sm:max-w-full">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
      <Input
        className="pl-8"
        placeholder="Search products"
        value={debounceSearch}
        onChange={(e) => {
          setDebounceSearch(e.target.value);
        }}
      />
    </div>
  );
}
