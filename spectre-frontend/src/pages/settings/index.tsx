import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addToast,
  Button,
  Card,
  CardBody,
  Input,
  Link,
  Select,
  SelectItem,
  Spinner,
  Switch,
  type SharedSelection,
} from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_CACHE_KEY } from '@/i18n'
import {
  queryCurrentLLMConfiguration,
  saveLLMConfiguration,
  type LLMConfigurationModifyVO,
} from '@/api/impl/ai.ts'

const DEFAULT_LLM_CONFIG: LLMConfigurationModifyVO = {
  provider: 'OPENAI',
  model: 'gpt-4o-mini',
  baseUrl: '',
  apiKey: '',
  enabled: true,
}

const FORBIDDEN_TEXT_MATCHER = /(403|forbidden|permission|denied|unauthorized)/i

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorText, setErrorText] = useState<string>()
  const [llmConfig, setLlmConfig] =
    useState<LLMConfigurationModifyVO>(DEFAULT_LLM_CONFIG)

  const localeDefaultKeys = useMemo(
    () => (i18n.resolvedLanguage ? [i18n.resolvedLanguage] : undefined),
    [i18n.resolvedLanguage],
  )

  const resolveLlmErrorText = useCallback(
    (
      error: unknown,
      fallbackKey: 'settings.llm.loadError' | 'settings.llm.saveError',
    ): string => {
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

  const onLocaleChange = (sel: SharedSelection) => {
    if (sel === 'all') {
      return
    }
    const v = sel.entries().next().value![0] as string
    localStorage.setItem(LANGUAGE_CACHE_KEY, v)
    i18n.changeLanguage(v).catch((e) => {
      console.error(e)
    })
  }

  useEffect(() => {
    setLoading(true)
    queryCurrentLLMConfiguration()
      .then((result) => {
        if (!result) {
          setLlmConfig({ ...DEFAULT_LLM_CONFIG })
          setErrorText(undefined)
          return
        }
        setLlmConfig({
          id: result.id,
          provider: result.provider || 'OPENAI',
          model: result.model || 'gpt-4o-mini',
          baseUrl: result.baseUrl ?? '',
          apiKey: result.apiKey ?? '',
          enabled: result.enabled,
        })
        setErrorText(undefined)
      })
      .catch((error) => {
        setErrorText(resolveLlmErrorText(error, 'settings.llm.loadError'))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [resolveLlmErrorText])

  const onSaveLLMConfig = () => {
    setSaving(true)
    saveLLMConfiguration({
      id: llmConfig.id,
      provider: llmConfig.provider || 'OPENAI',
      model: llmConfig.model?.trim() || 'gpt-4o-mini',
      baseUrl: llmConfig.baseUrl?.trim() || undefined,
      apiKey: llmConfig.apiKey?.trim() || undefined,
      enabled: llmConfig.enabled,
    })
      .then((result) => {
        setLlmConfig({
          id: result.id,
          provider: result.provider || 'OPENAI',
          model: result.model || 'gpt-4o-mini',
          baseUrl: result.baseUrl ?? '',
          apiKey: result.apiKey ?? '',
          enabled: result.enabled,
        })
        setErrorText(undefined)
        addToast({ title: t('settings.llm.saveSuccess'), color: 'success' })
      })
      .catch((error) => {
        setErrorText(resolveLlmErrorText(error, 'settings.llm.saveError'))
      })
      .finally(() => {
        setSaving(false)
      })
  }

  return (
    <div className="spectre-container relative h-full">
      <div className="spectre-heading">{t('router.settings')}</div>
      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-3">
            <div className="header-2">{t('settings.basic')}</div>
            <Select
              onSelectionChange={onLocaleChange}
              className="w-64"
              label={t('settings.locale')}
              labelPlacement="outside"
              defaultSelectedKeys={localeDefaultKeys}
            >
              <SelectItem key="zh-CN">{'简体中文 (zh-CN)'}</SelectItem>
              <SelectItem key="en">English (en) (Incomplete)</SelectItem>
            </Select>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <div className="header-2">{t('settings.llm.title')}</div>
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
                <Switch
                  isSelected={llmConfig.enabled}
                  onValueChange={(enabled) => {
                    setLlmConfig((old) => ({ ...old, enabled }))
                  }}
                >
                  {t('settings.llm.enabled')}
                </Switch>

                {llmConfig.enabled ? (
                  <>
                    <Select
                      className="w-64"
                      label={t('settings.llm.provider')}
                      labelPlacement="outside"
                      selectedKeys={[llmConfig.provider]}
                      isDisabled
                    >
                      <SelectItem key="OPENAI">OPENAI</SelectItem>
                    </Select>
                    <Input
                      className="max-w-xl"
                      label={t('settings.llm.model')}
                      labelPlacement="outside"
                      value={llmConfig.model}
                      onValueChange={(model) => {
                        setLlmConfig((old) => ({ ...old, model }))
                      }}
                    />
                    <Input
                      className="max-w-xl"
                      label={t('settings.llm.baseUrl')}
                      labelPlacement="outside-top"
                      placeholder="https://api.openai.com"
                      value={llmConfig.baseUrl ?? ''}
                      onValueChange={(baseUrl) => {
                        setLlmConfig((old) => ({ ...old, baseUrl }))
                      }}
                    />
                    <Input
                      className="max-w-xl"
                      type="password"
                      label={t('settings.llm.apiKey')}
                      labelPlacement="outside-top"
                      placeholder="sk-abcderfhijklmn"
                      value={llmConfig.apiKey ?? ''}
                      onValueChange={(apiKey) => {
                        setLlmConfig((old) => ({ ...old, apiKey }))
                      }}
                    />
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
      </div>

      <div className="text-default-400 absolute bottom-0 w-full text-center text-sm">
        <div>Spectre Project</div>
        <Link href="https://github.com/vudsen/spectre" isExternal size="sm">
          GitHub
        </Link>
        <div>{import.meta.env.VITE_APP_VERSION ?? '<Unknown Version>'}</div>
      </div>
    </div>
  )
}

export default Settings
