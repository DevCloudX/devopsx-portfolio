import type { CloudProvider, CloudService, ConfigField, ServiceCategory } from '../../types'

export type ServiceSeed = [id: string, shortName: string, category: ServiceCategory, description: string]

const providerColors: Record<CloudProvider, string> = {
  aws: '#e88921',
  azure: '#1686d9',
  gcp: '#4285f4',
}

const categoryFields: Partial<Record<ServiceCategory, Record<string, ConfigField>>> = {
  compute: {
    instanceType: { label: 'Instance size', type: 'select', defaultValue: 'medium', options: ['small', 'medium', 'large', 'xlarge'] },
    desiredCount: { label: 'Desired instances', type: 'number', defaultValue: 2 },
    autoScaling: { label: 'Auto scaling', type: 'boolean', defaultValue: true },
  },
  database: {
    instanceClass: { label: 'Instance class', type: 'select', defaultValue: 'db.medium', options: ['db.small', 'db.medium', 'db.large', 'db.xlarge'] },
    multiAz: { label: 'High availability', type: 'boolean', defaultValue: false },
    encrypted: { label: 'Encryption at rest', type: 'boolean', defaultValue: true },
    publicAccess: { label: 'Public access', type: 'boolean', defaultValue: false },
  },
  storage: {
    versioning: { label: 'Versioning', type: 'boolean', defaultValue: true },
    encrypted: { label: 'Encryption at rest', type: 'boolean', defaultValue: true },
    publicAccess: { label: 'Public access', type: 'boolean', defaultValue: false },
  },
  networking: {
    exposure: { label: 'Network exposure', type: 'select', defaultValue: 'private', options: ['private', 'public'] },
    encrypted: { label: 'Encryption in transit', type: 'boolean', defaultValue: true },
  },
}

const specificFields: Record<string, Record<string, ConfigField>> = {
  'aws-eks': {
    kubernetesVersion: { label: 'Kubernetes version', type: 'select', defaultValue: '1.31', options: ['1.29', '1.30', '1.31'] },
    nodeCount: { label: 'Worker nodes', type: 'number', defaultValue: 3 },
    privateEndpoint: { label: 'Private endpoint', type: 'boolean', defaultValue: true },
    encrypted: { label: 'Secrets encryption', type: 'boolean', defaultValue: true },
  },
  'aws-rds': {
    engine: { label: 'Database engine', type: 'select', defaultValue: 'PostgreSQL', options: ['PostgreSQL', 'MySQL', 'MariaDB'] },
    multiAz: { label: 'Multi-AZ', type: 'boolean', defaultValue: false },
    encrypted: { label: 'Storage encryption', type: 'boolean', defaultValue: true },
    publicAccess: { label: 'Public access', type: 'boolean', defaultValue: false },
  },
  'aws-s3': {
    versioning: { label: 'Versioning', type: 'boolean', defaultValue: true },
    encrypted: { label: 'Default encryption', type: 'boolean', defaultValue: true },
    publicAccess: { label: 'Block public access', type: 'boolean', defaultValue: false },
  },
}

export function makeCatalog(provider: CloudProvider, seeds: ServiceSeed[]): CloudService[] {
  return seeds.map(([slug, shortName, category, description]) => {
    const id = `${provider}-${slug}`
    const schema = { ...(categoryFields[category] ?? {}), ...(specificFields[id] ?? {}) }
    return {
      id,
      provider,
      shortName,
      name: shortName,
      category,
      description,
      icon: category,
      color: providerColors[provider],
      capabilities: [category, ...description.toLowerCase().split(' ').slice(0, 2)],
      dependencies: [],
      recommendedWith: recommendationMap[id] ?? [],
      tags: [provider, category],
      architectureRoles: [category],
      regions: provider === 'aws' ? ['us-east-1', 'us-west-2', 'eu-west-1'] : provider === 'azure' ? ['eastus', 'westeurope', 'southeastasia'] : ['us-central1', 'europe-west1', 'asia-east1'],
      configurationSchema: schema,
    }
  })
}

const recommendationMap: Record<string, string[]> = {
  'aws-eks': ['aws-vpc', 'aws-iam', 'aws-ecr', 'aws-elb', 'aws-cloudwatch', 'aws-kms', 'aws-secrets-manager'],
  'azure-aks': ['azure-vnet', 'azure-managed-identity', 'azure-container-registry', 'azure-application-gateway', 'azure-monitor', 'azure-key-vault'],
  'gcp-gke': ['gcp-vpc', 'gcp-iam', 'gcp-artifact-registry', 'gcp-cloud-load-balancing', 'gcp-cloud-monitoring', 'gcp-cloud-logging'],
  'aws-rds': ['aws-vpc', 'aws-kms', 'aws-secrets-manager', 'aws-backup'],
  'aws-s3': ['aws-kms', 'aws-cloudtrail', 'aws-cloudwatch'],
  'azure-sql-database': ['azure-vnet', 'azure-key-vault', 'azure-monitor'],
  'gcp-cloud-sql': ['gcp-vpc', 'gcp-cloud-kms', 'gcp-secret-manager', 'gcp-cloud-monitoring'],
}