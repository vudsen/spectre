import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from 'react-hook-form'
import { Checkbox, type CheckboxProps } from '@heroui/react'
import React from 'react'

interface ControlledCheckboxProps<
  Values extends FieldValues,
  MyPath extends Path<Values> = Path<Values>,
> extends React.PropsWithChildren {
  control: Control<Values>
  name: MyPath
  rules?: Omit<
    RegisterOptions<Values, MyPath>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >
  checkboxProps: CheckboxProps
}

function ControlledCheckBox<Values extends FieldValues>(
  props: ControlledCheckboxProps<Values>,
) {
  return (
    <Controller
      control={props.control}
      name={props.name}
      render={({ field, fieldState }) => {
        return (
          <Checkbox
            {...props.checkboxProps}
            {...field}
            validationBehavior="aria"
            isInvalid={fieldState.invalid}
            name={props.name}
            isSelected={field.value}
            defaultSelected={field.value}
          >
            {props.children}
          </Checkbox>
        )
      }}
    />
  )
}

export default ControlledCheckBox
