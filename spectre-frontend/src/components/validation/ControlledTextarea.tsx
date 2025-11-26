import type {
  Control,
  FieldValues,
  Path,
  RegisterOptions,
  PathValue,
} from 'react-hook-form'
import { Controller } from 'react-hook-form'
import type { TextAreaProps } from '@heroui/react'
import { Textarea } from '@heroui/react'

interface ControlledTextareaProps<
  Values extends FieldValues,
  MyPath extends Path<Values> = Path<Values>,
> {
  control: Control<Values>
  name: MyPath
  rules?: Omit<
    RegisterOptions<Values, MyPath>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >
  inputProps: TextAreaProps
}

function ControlledTextarea<Values extends FieldValues>(
  props: ControlledTextareaProps<Values>,
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
        <Textarea
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

export default ControlledTextarea
