'use client'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/app/components/base/modal'
import Button from '@/app/components/base/button'
import Input from '@/app/components/base/input'
import Textarea from '@/app/components/base/textarea'
import AppIcon from '@/app/components/base/app-icon'
import { AppMode } from '@/types/app'

export interface CreateAppModalProps {
  isEditModal?: boolean
  appName?: string
  appIconType?: string
  appIcon?: string
  appIconBackground?: string
  appIconUrl?: string
  appDescription?: string
  appMode?: AppMode
  appUseIconAsAnswerIcon?: boolean
  max_active_requests?: number | null
  show: boolean
  onConfirm: (data: {
    name: string
    icon_type: string
    icon: string
    icon_background: string
    description: string
    use_icon_as_answer_icon: boolean
    max_active_requests: number | null
  }) => void
  onHide: () => void
}

const CreateAppModal = ({
  isEditModal = false,
  appName = '',
  appIconType = 'emoji',
  appIcon = '🤖',
  appIconBackground = '#E1E4EA',
  appIconUrl = '',
  appDescription = '',
  appUseIconAsAnswerIcon = false,
  max_active_requests = null,
  show,
  onConfirm,
  onHide,
}: CreateAppModalProps) => {
  const { t } = useTranslation()
  const [name, setName] = useState(appName)
  const [description, setDescription] = useState(appDescription)
  const [iconType, setIconType] = useState(appIconType)
  const [icon, setIcon] = useState(appIcon)
  const [iconBackground, setIconBackground] = useState(appIconBackground)
  const [useIconAsAnswerIcon, setUseIconAsAnswerIcon] = useState(appUseIconAsAnswerIcon)
  const [maxActiveRequests, setMaxActiveRequests] = useState(max_active_requests)

  const handleConfirm = () => {
    onConfirm({
      name,
      icon_type: iconType,
      icon,
      icon_background: iconBackground,
      description,
      use_icon_as_answer_icon: useIconAsAnswerIcon,
      max_active_requests: maxActiveRequests,
    })
  }

  if (!show) return null

  return (
    <Modal
      title={isEditModal ? t('app.editApp') : t('app.createApp')}
      show={show}
      onClose={onHide}
    >
      <div className="space-y-4 p-6">
        <div className="flex items-center space-x-4">
          <AppIcon
            size="large"
            iconType={iconType}
            icon={icon}
            background={iconBackground}
            imageUrl={appIconUrl}
          />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('app.name')}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('app.appNamePlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('app.description')}
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('app.appDescriptionPlaceholder')}
            rows={3}
          />
        </div>

        {maxActiveRequests !== undefined && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Active Requests
            </label>
            <Input
              type="number"
              value={maxActiveRequests?.toString() || ''}
              onChange={(e) => setMaxActiveRequests(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Maximum concurrent requests"
            />
          </div>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            id="useIconAsAnswerIcon"
            checked={useIconAsAnswerIcon}
            onChange={(e) => setUseIconAsAnswerIcon(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="useIconAsAnswerIcon" className="text-sm text-gray-700">
            {t('app.useIconAsAnswerIcon')}
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 p-6 border-t">
        <Button
          variant="secondary"
          onClick={onHide}
        >
          {t('common.operation.cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!name.trim()}
        >
          {isEditModal ? t('common.operation.save') : t('common.operation.create')}
        </Button>
      </div>
    </Modal>
  )
}

export default CreateAppModal