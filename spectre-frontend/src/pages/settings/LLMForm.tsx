import React, { useCallback, useEffect, useState } from 'react'
import {
  addToast,
  Button,
  Card,
  CardBody,
  Progress,
  Spinner,
  Switch,
} from '@heroui/react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  queryCurrentLLMConfiguration,
  saveLLMConfiguration,
  type LLMConfigurationModifyVO,
} from '@/api/impl/ai.ts'
import ControlledInput from '@/components/validation/ControlledInput.tsx'
import Time from '@/components/Time.tsx'

type Values = Omit<LLMConfigurationModifyVO, 'maxTokenPerHour'> & {
  maxTokenPerHour: string
  provider: string
}

const DEFAULT_LLM_CONFIG: Values = {
  provider: 'OPENAI',
  model: '',
  baseUrl: '',
  apiKey: '',
  maxTokenPerHour: '-1',
  enabled: false,
}

const FAKE_SK = '******'

const FORBIDDEN_TEXT_MATCHER = /(403|forbidden|permission|denied|unauthorized)/i

const toFormValues = (value?: LLMConfigurationModifyVO | null): Values => {
  if (!value) {
    return { ...DEFAULT_LLM_CONFIG }
  }

  return {
    id: value.id,
    provider: 'OPENAI',
    model: value.model || '',
    baseUrl: value.baseUrl ?? '',
    apiKey: value.enabled ? FAKE_SK : '',
    maxTokenPerHour: String(value.maxTokenPerHour ?? -1),
    enabled: value.enabled,
  }
}

type Usage = {
  used: number
  total: number
  nextRefresh: string
}

const LLMForm: React.FC = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorText, setErrorText] = useState<string>()
  const { control, trigger, getValues, reset } = useForm<Values>({
    defaultValues: DEFAULT_LLM_CONFIG,
  })
  const [usage, setUsage] = useState<Usage | undefined>()
  const enabled = useWatch({ control, name: 'enabled' })

  const resolveLlmErrorText = useCallback(
    (error: unknown, fallbackKey: string): string => {
      let message = ''
      if (error instanceof Error) {
        message = error.message
      } else if (typeof error === 'string') {
        message = error
      } else if (error) {
        message = String(error)
      }

      if (FORBIDDEN_TEXT_MATCHER.test(message)) {
        return t('settings.llm.forbidden')
      }
      if (!message) {
        return t(fallbackKey)
      }
      return message
    },
    [t],
  )

  useEffect(() => {
    setLoading(true)
    queryCurrentLLMConfiguration()
      .then((result) => {
        reset(toFormValues(result))
        if (result) {
          setUsage({
            used: result.currentUsed,
            total: result.maxTokenPerHour,
            nextRefresh: result.nextRefresh,
          })
        }
        setErrorText(undefined)
      })
      .catch((error) => {
        setErrorText(resolveLlmErrorText(error, 'settings.llm.loadError'))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [reset, resolveLlmErrorText])

  const onSaveLLMConfig = async () => {
    if (!(await trigger())) {
      return
    }

    const values = getValues()
    const maxTokenPerHour = Number.parseInt(values.maxTokenPerHour, 10)

    setSaving(true)
    saveLLMConfiguration({
      id: values.id,
      model: values.model.trim() || 'gpt-4o-mini',
      baseUrl: (values.baseUrl ?? '').trim() || undefined,
      apiKey: values.apiKey === FAKE_SK ? undefined : values.apiKey,
      maxTokenPerHour: Number.isNaN(maxTokenPerHour) ? -1 : maxTokenPerHour,
      enabled: values.enabled,
    })
      .then((_) => {
        setErrorText(undefined)
        addToast({ title: t('保存成功'), color: 'success' })
      })
      .catch((error) => {
        setErrorText(resolveLlmErrorText(error, '保存失败'))
      })
      .finally(() => {
        setSaving(false)
      })
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="header-2">{t('settings.llm.title')}</div>
        <div className="text-sm">
          开启 LLM 后，将能够借助 AI 进行 arthas 诊断。
        </div>
        {loading ? (
          <div className="text-default-500 flex items-center gap-2">
            <Spinner size="sm" />
            <span>{t('settings.llm.loading')}</span>
          </div>
        ) : (
          <>
            {!!errorText && (
              <div className="text-danger text-sm">{errorText}</div>
            )}

            <Controller
              control={control}
              name="enabled"
              render={({ field }) => (
                <Switch
                  isSelected={field.value}
                  onValueChange={field.onChange}
                  name={field.name}
                >
                  {t('settings.llm.enabled')}
                </Switch>
              )}
            />

            {enabled ? (
              <>
                <ControlledInput
                  control={control}
                  name="baseUrl"
                  rules={{ required: true }}
                  inputProps={{
                    className: 'max-w-xl',
                    label: t('settings.llm.baseUrl'),
                    labelPlacement: 'outside-top',
                    isRequired: true,
                    placeholder: 'https://api.openai.com',
                  }}
                />

                <ControlledInput
                  control={control}
                  name="model"
                  rules={{ required: true }}
                  inputProps={{
                    className: 'max-w-xl',
                    label: t('settings.llm.model'),
                    labelPlacement: 'outside-top',
                    placeholder: 'gpt-4o-mini',
                    isRequired: true,
                  }}
                />

                <ControlledInput
                  control={control}
                  name="apiKey"
                  rules={{ required: true }}
                  inputProps={{
                    className: 'max-w-xl',
                    type: 'password',
                    label: t('settings.llm.apiKey'),
                    labelPlacement: 'outside-top',
                    isRequired: true,
                    placeholder: 'sk-abcde******xyz',
                  }}
                />

                <ControlledInput
                  control={control}
                  name="maxTokenPerHour"
                  rules={{
                    required: true,
                    pattern: {
                      value: /^-?\d+$/,
                      message: 'Must be an integer',
                    },
                  }}
                  inputProps={{
                    className: 'max-w-xl',
                    type: 'number',
                    label: t('settings.llm.maxTokenPerHour'),
                    labelPlacement: 'outside-top',
                    description: t('settings.llm.maxTokenPerHourDesc'),
                    isRequired: true,
                  }}
                />

                {usage ? (
                  <Progress
                    className="max-w-xl"
                    label={
                      <div>
                        当前剩余用量 (已使用{usage.used}) (
                        <Time time={usage.nextRefresh} />
                        刷新)
                      </div>
                    }
                    value={
                      usage.total < 0
                        ? 100
                        : 100 - (usage.used / usage.total) * 100
                    }
                    showValueLabel
                  ></Progress>
                ) : null}
              </>
            ) : null}

            <div>
              <Button
                color="primary"
                onPress={onSaveLLMConfig}
                isLoading={saving}
                isDisabled={loading}
              >
                {t('common.save')}
              </Button>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  )
}

export default LLMForm
