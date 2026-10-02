import type { CloudProvider, CloudService } from '../../types'
import { awsServices } from './aws'
import { azureServices } from './azure'
import { gcpServices } from './gcp'
import { serviceMappings } from './mappings'

const mappingsById = new Map<string, CloudService['equivalents']>()
for (const mapping of serviceMappings) {
  for (const provider of ['aws', 'azure', 'gcp'] as CloudProvider[]) {
    const id = mapping.services[provider]
    if (!id) continue
    mappingsById.set(id, Object.fromEntries(
      (Object.entries(mapping.services) as [CloudProvider, string][])
        .filter(([target]) => target !== provider)
        .map(([target, targetId]) => [target, [targetId]]),
    ))
  }
}

export const cloudServices: CloudService[] = [...awsServices, ...azureServices, ...gcpServices].map((service) => ({
  ...service,
  equivalents: mappingsById.get(service.id),
}))

export const servicesById = new Map(cloudServices.map((service) => [service.id, service]))
export const servicesByProvider: Record<CloudProvider, CloudService[]> = {
  aws: awsServices,
  azure: azureServices,
  gcp: gcpServices,
}

export const categoryLabels: Record<string, string> = {
  compute: 'Compute', storage: 'Storage', database: 'Databases', networking: 'Networking',
  containers: 'Containers', security: 'Security', integration: 'Integration', analytics: 'Analytics',
  'ai-ml': 'AI / ML', devtools: 'Developer tools', monitoring: 'Monitoring', management: 'Management',
  migration: 'Migration', cost: 'Cost management', iot: 'IoT', media: 'Media',
}

export const providerLabels: Record<CloudProvider, string> = { aws: 'AWS', azure: 'Azure', gcp: 'Google Cloud' }