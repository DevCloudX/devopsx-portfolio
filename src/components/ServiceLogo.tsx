import { useEffect, useState } from 'react'
import type { CloudService } from '../types'
import ProviderLogo from './ProviderLogo'

export default function ServiceLogo({ service, className }: { service: CloudService; className?: string }) {
  const [icon, setIcon] = useState<{ serviceId: string; source?: string }>()
  useEffect(() => {
    let active = true
    void import('./serviceIconIndex').then(
      ({ getServiceIcon }) => {
        if (active) setIcon({ serviceId: service.id, source: getServiceIcon(service.provider, service.id, service.shortName) })
      },
      (error: unknown) => {
        console.error('Unable to load the cloud service icon index.', error)
      },
    )
    return () => { active = false }
  }, [service.id, service.provider, service.shortName])

  const source = icon?.serviceId === service.id ? icon.source : undefined
  return source
    ? <img className={className ?? 'service-logo'} src={source} alt="" aria-hidden="true" draggable={false} />
    : <ProviderLogo provider={service.provider} />
}
