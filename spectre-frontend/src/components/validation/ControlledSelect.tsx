import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
  type PathValue,
  type RegisterOptions,
} from 'react-hook-form'
import { type SelectProps, Select } from '@heroui/react'

interface ControlledSelectProps<
  Values extends FieldValues,
  MyPath extends Path<Values> = Path<Values>,
> {
  control: Control<Values>
  name: MyPath
  rules?: Omit<
    RegisterOptions<Values, MyPath>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >
  selectProps: Omit<SelectProps, 'children'>
  children: SelectProps['children']
}

function ControlledSelect<Values extends FieldValues>(
  props: ControlledSelectProps<Values>,
) {
  let defaultValue: string | undefined
  if (props.selectProps.defaultSelectedKeys) {
    const ks = props.selectProps.defaultSelectedKeys
    if (typeof ks === 'string') {
      // TODO
      defaultValue = undefined
    } else {
      const ks0 = ks as Iterable<string | number>
      defaultValue = ks0[Symbol.iterator]().next().value
    }
  }
  return (
    <Controller
      control={props.control}
      name={props.name}
      defaultValue={defaultValue as PathValue<Values, Path<Values>>}
      rules={props.rules}
      render={({ field, fieldState }) => (
        <Select
          {...props.selectProps}
          {...field}
          validationBehavior="aria"
          isInvalid={fieldState.invalid}
          name={props.name}
          errorMessage={fieldState.error?.message}
        >
          {props.children}
        </Select>
      )}
    />
  )
}

export default ControlledSelect
