import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from 'react-hook-form'
import SearchableSelect, {
  type SearchableSelectProps,
} from '@/components/SearchableSelect.tsx'
import type { InputProps } from '@heroui/react'

interface ControlledSearchableSelectProps<
  Values extends FieldValues,
  SV,
  MyPath extends Path<Values> = Path<Values>,
> {
  control: Control<Values>
  name: MyPath
  rules?: Omit<
    RegisterOptions<Values, MyPath>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >
  onSearch: SearchableSelectProps<SV>['onSearch']
  inputProps?: InputProps
}

function ControlledSearchableSelect<Values extends FieldValues, SV>(
  props: ControlledSearchableSelectProps<Values, SV>,
) {
  return (
    <Controller
      control={props.control}
      name={props.name}
      rules={props.rules}
      render={({ field, fieldState }) => {
        return (
          <SearchableSelect
            {...field}
            onSearch={props.onSearch}
            inputProps={{
              ...props.inputProps,
              validationBehavior: 'aria',
              isInvalid: fieldState.invalid,
              name: props.name,
              errorMessage: fieldState.error?.message,
            }}
          />
        )
      }}
    />
  )
}

export default ControlledSearchableSelect
