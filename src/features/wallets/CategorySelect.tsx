import { useQuery } from '@tanstack/react-query'
import type { ComponentProps } from 'react'
import { SelectField } from '@/components/ui/SelectField'
import { categoryKeys, walletsApi } from './api'

type Props = Omit<ComponentProps<typeof SelectField>, 'children' | 'label'> & { label?: string }

export function CategorySelect({ label = 'Select Category', error, ...props }: Props) {
  const categories = useQuery({ queryKey: categoryKeys.all, queryFn: walletsApi.categories, staleTime: Infinity })
  return (
    <SelectField
      label={label}
      error={error ?? (categories.isError ? 'We could not load categories. Refresh the page to try again.' : undefined)}
      disabled={categories.isPending}
      {...props}
    >
      <option value="">{categories.isPending ? 'Loading categories...' : 'Choose a category'}</option>
      {categories.data?.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </SelectField>
  )
}
