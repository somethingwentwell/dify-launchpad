'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useContext } from 'use-context-selector'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { RiBuildingLine, RiGlobalLine, RiLockLine, RiMoreFill, RiVerifiedBadgeLine } from '@remixicon/react'
import cn from '@/utils/classnames'
import type { App } from '@/types/app'
import Toast, { ToastContext } from '@/app/components/base/toast'
import { copyApp, deleteApp, exportAppConfig, updateAppInfo } from '@/service/apps'
import type { DuplicateAppModalProps } from '@/app/components/app/duplicate-modal'
import AppIcon from '@/app/components/base/app-icon'
import { useAppContext } from '@/context/app-context'
import type { HtmlContentProps } from '@/app/components/base/popover'
import CustomPopover from '@/app/components/base/popover'
import Divider from '@/app/components/base/divider'
import { basePath } from '@/utils/var'
import { getRedirection } from '@/utils/app-redirection'
import { useProviderContext } from '@/context/provider-context'
import { NEED_REFRESH_APP_LIST_KEY } from '@/config'
import { fetchAppDetail } from '@/service/apps'
import type { CreateAppModalProps } from '@/app/components/app/create-app-modal'
import type { Tag } from '@/app/components/base/tag-management/constant'
import TagSelector from '@/app/components/base/tag-management/selector'
import type { EnvironmentVariable } from '@/app/components/workflow/types'
import { fetchWorkflowDraft } from '@/service/workflow'
// import { fetchInstalledAppList } from '@/service/explore' // Removed explore functionality
import { AppTypeIcon } from '@/app/components/app/type-selector'
import Tooltip from '@/app/components/base/tooltip'
import { AccessMode } from '@/models/access-control'
import { useGlobalPublicStore } from '@/context/global-public-context'
import { formatTime } from '@/utils/time'
import { useGetUserCanAccessApp } from '@/service/access-control'
import dynamic from 'next/dynamic'

const EditAppModal = dynamic(() => import('@/app/components/app/create-app-modal'), {
  ssr: false,
})
const DuplicateAppModal = dynamic(() => import('@/app/components/app/duplicate-modal'), {
  ssr: false,
})
const SwitchAppModal = dynamic(() => import('@/app/components/app/switch-app-modal'), {
  ssr: false,
})
const Confirm = dynamic(() => import('@/app/components/base/confirm'), {
  ssr: false,
})
const DSLExportConfirmModal = dynamic(() => import('@/app/components/workflow/dsl-export-confirm-modal'), {
  ssr: false,
})
const AccessControl = dynamic(() => import('@/app/components/app/app-access-control'), {
  ssr: false,
})

export type AppCardProps = {
  app: App
  onRefresh?: () => void
}

const AppCard = ({ app, onRefresh }: AppCardProps) => {
  const { t } = useTranslation()
  const { notify } = useContext(ToastContext)
  const systemFeatures = useGlobalPublicStore(s => s.systemFeatures)
  const { isCurrentWorkspaceEditor } = useAppContext()
  const { onPlanInfoChanged } = useProviderContext()
  const { push } = useRouter()

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [showSwitchModal, setShowSwitchModal] = useState<boolean>(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showAccessControl, setShowAccessControl] = useState(false)
  const [secretEnvList, setSecretEnvList] = useState<EnvironmentVariable[]>([])

  const onConfirmDelete = useCallback(async () => {
    try {
      await deleteApp(app.id)
      notify({ type: 'success', message: t('app.appDeleted') })
      if (onRefresh)
        onRefresh()
      onPlanInfoChanged()
    }
    catch (e: any) {
      notify({
        type: 'error',
        message: `${t('app.appDeleteFailed')}${'message' in e ? `: ${e.message}` : ''}`,
      })
    }
    setShowConfirmDelete(false)
  }, [app.id, notify, onPlanInfoChanged, onRefresh, t])

  const onEdit: CreateAppModalProps['onConfirm'] = useCallback(async ({
    name,
    icon_type,
    icon,
    icon_background,
    description,
    use_icon_as_answer_icon,
    max_active_requests,
  }) => {
    try {
      await updateAppInfo({
        appID: app.id,
        name,
        icon_type,
        icon,
        icon_background,
        description,
        use_icon_as_answer_icon,
        max_active_requests,
      })
      setShowEditModal(false)
      notify({
        type: 'success',
        message: t('app.editDone'),
      })
      if (onRefresh)
        onRefresh()
    }
    catch {
      notify({ type: 'error', message: t('app.editFailed') })
    }
  }, [app.id, notify, onRefresh, t])

  const onCopy: DuplicateAppModalProps['onConfirm'] = async ({ name, icon_type, icon, icon_background }) => {
    try {
      const newApp = await copyApp({
        appID: app.id,
        name,
        icon_type,
        icon,
        icon_background,
        mode: app.mode,
      })
      setShowDuplicateModal(false)
      notify({
        type: 'success',
        message: t('app.newApp.appCreated'),
      })
      localStorage.setItem(NEED_REFRESH_APP_LIST_KEY, '1')
      if (onRefresh)
        onRefresh()
      onPlanInfoChanged()
      getRedirection(isCurrentWorkspaceEditor, newApp, push)
    }
    catch {
      notify({ type: 'error', message: t('app.newApp.appCreateFailed') })
    }
  }

  const onExport = async (include = false) => {
    try {
      const { data } = await exportAppConfig({
        appID: app.id,
        include,
      })
      const a = document.createElement('a')
      const file = new Blob([data], { type: 'application/yaml' })
      a.href = URL.createObjectURL(file)
      a.download = `${app.name}.yml`
      a.click()
    }
    catch {
      notify({ type: 'error', message: t('app.exportFailed') })
    }
  }

  const exportCheck = async () => {
    if (app.mode !== 'workflow' && app.mode !== 'advanced-chat') {
      onExport()
      return
    }
    try {
      const workflowDraft = await fetchWorkflowDraft(`/apps/${app.id}/workflows/draft`)
      const list = (workflowDraft.environment_variables || []).filter(env => env.value_type === 'secret')
      if (list.length === 0) {
        onExport()
        return
      }
      setSecretEnvList(list)
    }
    catch {
      notify({ type: 'error', message: t('app.exportFailed') })
    }
  }

  const onSwitch = () => {
    if (onRefresh)
      onRefresh()
    setShowSwitchModal(false)
  }

  const onUpdateAccessControl = useCallback(() => {
    if (onRefresh)
      onRefresh()
    setShowAccessControl(false)
  }, [onRefresh, setShowAccessControl])

  const Operations = (props: HtmlContentProps) => {
    const { data: userCanAccessApp, isLoading: isGettingUserCanAccessApp } = useGetUserCanAccessApp({ appId: app?.id, enabled: (!!props?.open && systemFeatures.webapp_auth.enabled) })
    const onMouseLeave = async () => {
      props.onClose?.()
    }
    const onClickSettings = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      props.onClick?.()
      e.preventDefault()
      setShowEditModal(true)
    }
    // Removed editor access - launchpad is launch-only
    const onClickDuplicate = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      props.onClick?.()
      e.preventDefault()
      setShowDuplicateModal(true)
    }
    const onClickExport = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      props.onClick?.()
      e.preventDefault()
      exportCheck()
    }
    const onClickSwitch = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      props.onClick?.()
      e.preventDefault()
      setShowSwitchModal(true)
    }
    const onClickDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      props.onClick?.()
      e.preventDefault()
      setShowConfirmDelete(true)
    }
    const onClickAccessControl = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      props.onClick?.()
      e.preventDefault()
      setShowAccessControl(true)
    }
    // Removed explore and editor functionality - launchpad is launch-only
    
    return (
      <div className="relative flex w-full flex-col py-1" onMouseLeave={onMouseLeave}>
        <button className='mx-1 flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3 hover:bg-state-base-hover' onClick={onClickSettings}>
          <span className='system-sm-regular text-text-secondary'>{t('app.editApp')}</span>
        </button>
        <Divider className="my-1" />
        <button className='mx-1 flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3 hover:bg-state-base-hover' onClick={onClickDuplicate}>
          <span className='system-sm-regular text-text-secondary'>{t('app.duplicate')}</span>
        </button>
        <button className='mx-1 flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3 hover:bg-state-base-hover' onClick={onClickExport}>
          <span className='system-sm-regular text-text-secondary'>{t('app.export')}</span>
        </button>
        {(app.mode === 'completion' || app.mode === 'chat') && (
          <>
            <Divider className="my-1" />
            <button
              className='mx-1 flex h-8 cursor-pointer items-center rounded-lg px-3 hover:bg-state-base-hover'
              onClick={onClickSwitch}
            >
              <span className='text-sm leading-5 text-text-secondary'>{t('app.switch')}</span>
            </button>
          </>
        )}
        {/* Removed explore functionality */}
        <Divider className="my-1" />
        {
          systemFeatures.webapp_auth.enabled && isCurrentWorkspaceEditor && <>
            <button className='mx-1 flex h-8 cursor-pointer items-center rounded-lg px-3 hover:bg-state-base-hover' onClick={onClickAccessControl}>
              <span className='text-sm leading-5 text-text-secondary'>{t('app.accessControl')}</span>
            </button>
            <Divider className='my-1' />
          </>
        }
        <button
          className='group mx-1 flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3 py-[6px] hover:bg-state-destructive-hover'
          onClick={onClickDelete}
        >
          <span className='system-sm-regular text-text-secondary group-hover:text-text-destructive'>
            {t('common.operation.delete')}
          </span>
        </button>
      </div>
    )
  }

  const [tags, setTags] = useState<Tag[]>(app.tags)
  useEffect(() => {
    setTags(app.tags)
  }, [app.tags])

  const EditTimeText = useMemo(() => {
    const timeText = formatTime({
      date: (app.updated_at || app.created_at) * 1000,
      dateFormat: `${t('datasetDocuments.segment.dateTimeFormat')}`,
    })
    return `${t('datasetDocuments.segment.editedAt')} ${timeText}`
  }, [app.updated_at, app.created_at])

  // Generate app URL - always try to launch directly, no editor redirects
  const getAppUrl = (app: App) => {
    // Get the base URL for apps from environment variable
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || window.location.origin
    const baseUrl = appBaseUrl.endsWith('/') ? appBaseUrl.slice(0, -1) : appBaseUrl
    
    // Try to get access token from various possible locations
    const accessToken = app.site?.access_token || 
                       (app as any).access_token || 
                       (app as any).site_access_token ||
                       app.id // Fallback to app ID if no access token
    
    console.log('=== DETAILED APP DEBUG ===')
    console.log('App name:', app.name)
    console.log('App mode:', app.mode)
    console.log('App ID:', app.id)
    console.log('Access token found:', accessToken)
    console.log('app.site?.access_token:', app.site?.access_token)
    console.log('app.access_token:', (app as any).access_token)
    console.log('app.site_access_token:', (app as any).site_access_token)
    console.log('Full site object:', JSON.stringify(app.site, null, 2))
    console.log('Full app object:', app)
    
    let appUrl: string
    switch (app.mode) {
      case 'chat':        // Regular chat apps
      case 'advanced-chat': // Advanced chat apps  
      case 'agent-chat':  // Agent chat apps
        appUrl = `${baseUrl}/chat/${accessToken}`
        break
      case 'workflow':    // Workflow apps
        appUrl = `${baseUrl}/workflow/${accessToken}`
        break
      case 'completion':  // Completion apps
        appUrl = `${baseUrl}/completion/${accessToken}`
        break
      default:
        console.log('Unknown app mode:', app.mode, '- using chat URL')
        appUrl = `${baseUrl}/chat/${accessToken}`
    }
    
    console.log('Generated app URL:', appUrl)
    return appUrl
  }

  const handleAppClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('App clicked:', app.name)
    
    // If we don't have the access token in the app list data, fetch it from the detail API
    if (!app.site?.access_token) {
      console.log('No access token in app list data, fetching from detail API...')
      try {
        const detailResponse = await fetchAppDetail({ url: '/apps', id: app.id })
        console.log('Detail API response:', detailResponse)
        
        if (detailResponse.site?.access_token) {
          const accessToken = detailResponse.site.access_token
          const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || window.location.origin
          const baseUrl = appBaseUrl.endsWith('/') ? appBaseUrl.slice(0, -1) : appBaseUrl
          
          let appUrl: string
          switch (app.mode) {
            case 'chat':
            case 'advanced-chat':
            case 'agent-chat':
              appUrl = `${baseUrl}/chat/${accessToken}`
              break
            case 'workflow':
              appUrl = `${baseUrl}/workflow/${accessToken}`
              break
            case 'completion':
              appUrl = `${baseUrl}/completion/${accessToken}`
              break
            default:
              appUrl = `${baseUrl}/chat/${accessToken}`
          }
          
          console.log('Generated URL with fetched token:', appUrl)
          window.open(appUrl, '_blank')
          return
        }
      } catch (error) {
        console.error('Failed to fetch app details:', error)
      }
    }
    
    // Fallback to the original URL generation if we have the token or fetching failed
    const appUrl = getAppUrl(app)
    console.log('Launching app at:', appUrl)
    window.open(appUrl, '_blank')
  }

  return (
    <>
      <div
        onClick={handleAppClick}
        className='group relative col-span-1 inline-flex h-[160px] cursor-pointer flex-col rounded-xl border-[1px] border-solid border-components-card-border bg-components-card-bg shadow-sm transition-all duration-200 ease-in-out hover:shadow-lg'
        title={`Click to launch: ${getAppUrl(app)}`}
      >
        <div className='flex h-[66px] shrink-0 grow-0 items-center gap-3 px-[14px] pb-3 pt-[14px]'>
          <div className='relative shrink-0'>
            <AppIcon
              size="large"
              iconType={app.icon_type}
              icon={app.icon}
              background={app.icon_background}
              imageUrl={app.icon_url}
            />
            <AppTypeIcon type={app.mode} wrapperClassName='absolute -bottom-0.5 -right-0.5 w-4 h-4 shadow-sm' className='h-3 w-3' />
            {/* Show launch indicator for apps with access tokens */}
            {app.site?.access_token && (
              <div className='absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm' title="Published App" />
            )}
          </div>
          <div className='w-0 grow py-[1px]'>
            <div className='flex items-center text-sm font-semibold leading-5 text-text-secondary'>
              <div className='truncate' title={app.name}>{app.name}</div>
            </div>
            <div className='flex items-center gap-1 text-[10px] font-medium leading-[18px] text-text-tertiary'>
              <div className='truncate' title={app.author_name}>{app.author_name}</div>
              <div>·</div>
              <div className='truncate' title={EditTimeText}>{EditTimeText}</div>
            </div>
          </div>
          <div className='flex h-5 w-5 shrink-0 items-center justify-center'>
            {app.site?.access_token && (
              <Tooltip asChild={false} popupContent={`Ready to launch: ${getAppUrl(app)}`}>
                <RiGlobalLine className='h-4 w-4 text-green-500' />
              </Tooltip>
            )}
          </div>
        </div>
        <div className='title-wrapper h-[90px] px-[14px] text-xs leading-normal text-text-tertiary'>
          <div
            className={cn(tags.length ? 'line-clamp-2' : 'line-clamp-4', 'group-hover:line-clamp-2')}
            title={app.description}
          >
            {app.description}
          </div>
        </div>
        <div className={cn(
          'absolute bottom-1 left-0 right-0 h-[42px] shrink-0 items-center pb-[6px] pl-[14px] pr-[6px] pt-1',
          tags.length ? 'flex' : '!hidden group-hover:!flex',
        )}>
          {isCurrentWorkspaceEditor && (
            <>
              <div className={cn('flex w-0 grow items-center gap-1')} onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}>
                <div className={cn(
                  'mr-[41px] w-full grow group-hover:!mr-0 group-hover:!block',
                  tags.length ? '!block' : '!hidden',
                )}>
                  <TagSelector
                    position='bl'
                    type='app'
                    targetID={app.id}
                    value={tags.map(tag => tag.id)}
                    selectedTags={tags}
                    onCacheUpdate={setTags}
                    onChange={onRefresh}
                  />
                </div>
              </div>

            </>
          )}
        </div>
      </div>
      {showEditModal && (
        <EditAppModal
          isEditModal
          appName={app.name}
          appIconType={app.icon_type}
          appIcon={app.icon}
          appIconBackground={app.icon_background}
          appIconUrl={app.icon_url}
          appDescription={app.description}
          appMode={app.mode}
          appUseIconAsAnswerIcon={app.use_icon_as_answer_icon}
          max_active_requests={app.max_active_requests ?? null}
          show={showEditModal}
          onConfirm={onEdit}
          onHide={() => setShowEditModal(false)}
        />
      )}
      {showDuplicateModal && (
        <DuplicateAppModal
          appName={app.name}
          icon_type={app.icon_type}
          icon={app.icon}
          icon_background={app.icon_background}
          icon_url={app.icon_url}
          show={showDuplicateModal}
          onConfirm={onCopy}
          onHide={() => setShowDuplicateModal(false)}
        />
      )}
      {showSwitchModal && (
        <SwitchAppModal
          show={showSwitchModal}
          appDetail={app}
          onClose={() => setShowSwitchModal(false)}
          onSuccess={onSwitch}
        />
      )}
      {showConfirmDelete && (
        <Confirm
          title={t('app.deleteAppConfirmTitle')}
          content={t('app.deleteAppConfirmContent')}
          isShow={showConfirmDelete}
          onConfirm={onConfirmDelete}
          onCancel={() => setShowConfirmDelete(false)}
        />
      )}
      {secretEnvList.length > 0 && (
        <DSLExportConfirmModal
          envList={secretEnvList}
          onConfirm={onExport}
          onClose={() => setSecretEnvList([])}
        />
      )}
      {showAccessControl && (
        <AccessControl app={app} onConfirm={onUpdateAccessControl} onClose={() => setShowAccessControl(false)} />
      )}
    </>
  )
}

export default React.memo(AppCard)
