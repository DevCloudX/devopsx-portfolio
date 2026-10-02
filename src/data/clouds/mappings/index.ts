import type { CloudProvider } from '../../../types'

export type ServiceMapping = {
  family: string
  label: string
  equivalence: 'Exact equivalent' | 'Similar capability' | 'Partial equivalent' | 'No direct equivalent'
  services: Partial<Record<CloudProvider, string>>
  notes: string
}

export const serviceMappings: ServiceMapping[] = [
  { family: 'kubernetes', label: 'Managed Kubernetes', equivalence: 'Similar capability', services: { aws: 'aws-eks', azure: 'azure-aks', gcp: 'gcp-gke' }, notes: 'All manage upstream Kubernetes; identity, networking, upgrades, and add-on models differ.' },
  { family: 'object-storage', label: 'Object storage', equivalence: 'Similar capability', services: { aws: 'aws-s3', azure: 'azure-blob-storage', gcp: 'gcp-cloud-storage' }, notes: 'Comparable object storage; APIs, tiers, lifecycle, and access policy models differ.' },
  { family: 'serverless', label: 'Serverless functions', equivalence: 'Similar capability', services: { aws: 'aws-lambda', azure: 'azure-functions', gcp: 'gcp-cloud-functions' }, notes: 'Event integration, execution limits, and deployment models vary by provider.' },
  { family: 'managed-sql', label: 'Managed relational database', equivalence: 'Partial equivalent', services: { aws: 'aws-rds', azure: 'azure-sql-database', gcp: 'gcp-cloud-sql' }, notes: 'Engine compatibility and high-availability semantics are not one-to-one.' },
  { family: 'global-delivery', label: 'Global application delivery', equivalence: 'Similar capability', services: { aws: 'aws-cloudfront', azure: 'azure-front-door', gcp: 'gcp-cloud-cdn' }, notes: 'Products combine different CDN, routing, and security capabilities.' },
  { family: 'virtual-network', label: 'Virtual network', equivalence: 'Similar capability', services: { aws: 'aws-vpc', azure: 'azure-vnet', gcp: 'gcp-vpc' }, notes: 'Addressing scope and subnet behavior differ significantly, especially for GCP VPCs.' },
  { family: 'secrets', label: 'Secrets management', equivalence: 'Similar capability', services: { aws: 'aws-secrets-manager', azure: 'azure-key-vault', gcp: 'gcp-secret-manager' }, notes: 'Rotation, key management, and access integrations differ.' },
  { family: 'identity', label: 'Workload identity', equivalence: 'Partial equivalent', services: { aws: 'aws-iam', azure: 'azure-managed-identity', gcp: 'gcp-iam' }, notes: 'Identity primitives and policy evaluation are provider-specific.' },
  { family: 'message-bus', label: 'Managed messaging', equivalence: 'Partial equivalent', services: { aws: 'aws-sqs', azure: 'azure-service-bus', gcp: 'gcp-pub-sub' }, notes: 'Queue, topic, delivery, and ordering guarantees differ.' },
  { family: 'monitoring', label: 'Cloud monitoring', equivalence: 'Similar capability', services: { aws: 'aws-cloudwatch', azure: 'azure-azure-monitor', gcp: 'gcp-cloud-monitoring' }, notes: 'Signals, query languages, retention, and pricing models differ.' },
]