import type {
  Control,
  FieldValues,
  Path,
  RegisterOptions,
  PathValue,
} from 'react-hook-form'
import { Controller } from 'react-hook-form'
import type { InputProps } from '@heroui/react'
import { Input } from '@heroui/react'

interface ControlledInputProps<
  Values extends FieldValues,
  MyPath extends Path<Values> = Path<Values>,
> {
  control: Control<Values>
  name: MyPath
  rules?: Omit<
    RegisterOptions<Values, MyPath>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >
  inputProps: InputProps
}

function ControlledInput<Values extends FieldValues>(
  props: ControlledInputProps<Values>,
) {
  return (
    <Controller
      control={props.control}
      name={props.name}
      defaultValue={
        props.inputProps.defaultValue as PathValue<Values, Path<Values>>
      }
      rules={props.rules}
      render={({ field, fieldState }) => (
        <Input
          {...props.inputProps}
          {...field}
          validationBehavior="aria"
          isInvalid={fieldState.invalid}
          name={props.name}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  )
}

export default ControlledInput
