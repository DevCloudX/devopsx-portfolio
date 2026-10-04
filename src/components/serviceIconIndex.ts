import type { CloudProvider } from '../types'

const serviceIconAssets = import.meta.glob('../../icons/*-icons/*.svg', {
  eager: true,
  query: '?url&no-inline',
  import: 'default',
}) as Record<string, string>

function isCloudProvider(value: string): value is CloudProvider {
  return value === 'aws' || value === 'azure' || value === 'gcp'
}

const iconIndexes = new Map<CloudProvider, Map<string, string>>()
for (const [path, url] of Object.entries(serviceIconAssets)) {
  const match = path.match(/icons\/(aws|azure|gcp)-icons\/([^/]+)\.svg$/)
  if (!match) continue
  const [, provider, fileName] = match
  if (!isCloudProvider(provider)) continue
  const name = normalize(fileName.replace(new RegExp(`^${provider}-`), ''))
  const index = iconIndexes.get(provider) ?? new Map<string, string>()
  if (!index.has(name)) index.set(name, url)
  iconIndexes.set(provider, index)
}

const iconAliases: Record<string, string> = {
  'aws-outposts': 'outposts-family',
  'aws-s3': 'simple-storage-service',
  'aws-s3-glacier': 'simple-storage-service-glacier',
  'aws-ebs': 'elastic-block-store',
  'aws-snow-family': 'snowball',
  'aws-subnets': 'public-subnet',
  'aws-route-tables': 'route-table',
  'aws-ecr': 'elastic-container-registry',
  'aws-iam': 'identity-and-access-management',
  'aws-kms': 'key-management-service',
  'aws-sqs': 'simple-queue-service',
  'aws-sns': 'simple-notification-service',
  'aws-vpc-peering': 'vpc-peering-connection',
  'aws-alb': 'elb-application-load-balancer',
  'aws-nlb': 'elb-network-load-balancer',
  'aws-opensearch': 'opensearch-service',
  'azure-virtual-machines': 'virtual-machine',
  'azure-app-service': 'app-services',
  'azure-container-apps': 'container-apps-environments',
  'azure-aks': 'kubernetes-services',
  'azure-batch': 'batch-accounts',
  'azure-blob-storage': 'blob-block',
  'azure-table-storage': 'table',
  'azure-managed-disks': 'disks',
  'azure-backup': 'backup-center',
  'azure-vnet': 'virtual-networks',
  'azure-nsg': 'network-security-groups',
  'azure-load-balancer': 'load-balancers',
  'azure-application-gateway': 'application-gateways',
  'azure-dns': 'dns-zones',
  'azure-private-endpoint': 'private-endpoints',
  'azure-vpn-gateway': 'virtual-network-gateways',
  'azure-nat-gateway': 'nat',
  'azure-firewall': 'firewalls',
  'azure-bastion': 'bastions',
  'azure-container-registry': 'container-registries',
  'azure-key-vault': 'key-vaults',
  'azure-managed-identity': 'managed-identities',
  'azure-defender-cloud': 'microsoft-defender-for-cloud',
  'azure-azure-policy': 'policy',
  'azure-document-intelligence': 'document-intelligence',
  'azure-azure-repos': 'tfs-vc-repository',
  'azure-resource-manager': 'resource-manager',
  'azure-site-recovery': 'recovery-services-vaults',
  'azure-azure-files': 'files',
  'azure-queue-storage': 'storage-queue',
  'azure-data-lake-storage': 'data-lake-storage-gen1',
  'azure-azure-backup': 'backup-center',
  'azure-postgresql': 'database-postgresql-server',
  'azure-mysql': 'database-mysql-server',
  'azure-redis': 'cache-redis',
  'azure-cassandra': 'managed-instance-apache-cassandra',
  'azure-database-migration': 'database-migration-services',
  'azure-front-door': 'front-door-and-cdn-profiles',
  'azure-traffic-manager': 'traffic-manager-profiles',
  'azure-expressroute': 'expressroute-circuits',
  'azure-virtual-wan': 'virtual-wans',
  'azure-azure-firewall': 'firewalls',
  'azure-ddos-protection': 'ddos-protection-plans',
  'azure-entra-id': 'entra-id-protection',
  'azure-purview': 'purview-accounts',
  'azure-event-grid': 'event-grid-domains',
  'azure-api-management': 'api-management-services',
  'azure-stream-analytics': 'stream-analytics-jobs',
  'azure-ai-search': 'cognitive-search',
  'azure-azure-pipelines': 'pipelines',
  'azure-azure-monitor': 'monitor',
  'azure-log-analytics': 'log-analytics-workspaces',
  'azure-automation': 'automation-accounts',
  'azure-azure-migrate': 'migrate',
  'azure-azure-advisor': 'advisor',
  'gcp-gke': 'google-kubernetes-engine',
  'gcp-bare-metal': 'bare-metal-solutions',
  'gcp-hyperdisk': 'persistent-disk',
  'gcp-storage-transfer': 'transfer',
  'gcp-vpc': 'virtual-private-cloud',
  'gcp-subnets': 'virtual-private-cloud',
  'gcp-iam': 'identity-and-access-management',
  'gcp-cloud-kms': 'key-management-service',
  'gcp-sensitive-data-protection': 'data-loss-prevention-api',
  'gcp-api-gateway': 'cloud-api-gateway',
  'gcp-apigee': 'apigee-api-platform',
  'gcp-vertex-ai-search': 'vertexai',
  'gcp-gemini-api': 'ai-platform-unified',
  'gcp-vision-ai': 'automl-vision',
  'gcp-cloud-trace': 'trace',
  'gcp-cloud-profiler': 'profiler',
  'gcp-cloud-billing': 'billing',
  'gcp-resource-manager': 'project',
  'gcp-organization-policy': 'policy-analyzer',
  'gcp-migration-center': 'migrate-for-compute-engine',
  'gcp-finops-hub': 'billing',
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function getServiceIcon(provider: CloudProvider, serviceId: string, shortName: string) {
  const index = iconIndexes.get(provider)
  const alias = iconAliases[serviceId]
  const name = shortName.replace(/^(aws|amazon|azure|microsoft|google)(\s+cloud)?[\s-]*/i, '')
  return (alias && index?.get(normalize(alias)))
    ?? index?.get(normalize(serviceId.slice(provider.length + 1)))
    ?? index?.get(normalize(name))
    ?? index?.get(normalize(shortName))
}
