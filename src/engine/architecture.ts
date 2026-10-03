import type { Architecture, ArchitectureTemplate, CanvasNodeData, CloudProvider, CloudService, Finding } from '../types'
import { cloudServices, servicesById } from '../data/clouds'

const defaultPosition = { x: 80, y: 100 }

export function createServiceNode(service: CloudService, position = defaultPosition, overrides: Partial<CanvasNodeData> = {}) {
  const config = Object.fromEntries(Object.entries(service.configurationSchema).map(([key, field]) => [key, field.defaultValue]))
  if (service.regions.length) config.region = service.regions[0]
  if (service.id === 'aws-rds') Object.assign(config, { publicAccess: true, encrypted: false })
  if (service.id === 'aws-s3') Object.assign(config, { publicAccess: true })
  return {
    id: `${service.id}-${crypto.randomUUID()}`,
    type: 'service',
    position,
    data: {
      serviceId: service.id,
      label: service.shortName,
      provider: service.provider,
      category: service.category,
      status: service.id === 'aws-rds' || service.id === 'aws-s3' ? 'warning' as const : 'healthy' as const,
      config: { ...config, ...overrides.config },
      ...overrides,
    },
  }
}

const demoSpec: [string, number, number][] = [
  ['aws-cloudfront', 50, 175], ['aws-waf', 255, 175], ['aws-alb', 465, 175],
  ['aws-eks', 690, 175], ['aws-eks', 690, 350], ['aws-rds', 935, 65],
  ['aws-elasticache', 935, 215], ['aws-s3', 935, 365], ['aws-vpc', 465, 460],
]

export function createDemoArchitecture(): Architecture {
  const nodes = demoSpec.map(([serviceId, x, y], index) => {
    const service = servicesById.get(serviceId)!
    const node = createServiceNode(service, { x, y })
    if (index === 4) node.data.label = 'EKS worker'
    return node
  })
  const connect = (source: number, target: number) => ({
    id: `demo-${source}-${target}`, source: nodes[source].id, target: nodes[target].id,
    type: 'smoothstep', animated: false,
  })
  return {
    nodes,
    edges: [connect(0, 1), connect(1, 2), connect(2, 3), connect(3, 4), connect(3, 5), connect(3, 6), connect(3, 7), connect(8, 2), connect(8, 3), connect(8, 5)],
  }
}

export const architectureTemplates: ArchitectureTemplate[] = [
  { id: 'three-tier', name: '3-Tier Web Application', description: 'A classic web, application, and database stack.', icon: 'Layers3', services: ['aws-cloudfront', 'aws-alb', 'aws-ec2', 'aws-rds'], edges: [[0, 1], [1, 2], [2, 3]], tags: ['web', 'networking'] },
  { id: 'microservices', name: 'Microservices Platform', description: 'Containerized services with managed messaging and data.', icon: 'Boxes', services: ['aws-ecr', 'aws-eks', 'aws-rds', 'aws-sqs', 'aws-cloudwatch'], edges: [[0, 1], [1, 2], [1, 3], [1, 4]], tags: ['containers', 'platform'] },
  { id: 'ecommerce', name: 'E-Commerce Platform', description: 'A resilient storefront with edge protection and managed data.', icon: 'ShoppingBag', services: ['aws-cloudfront', 'aws-waf', 'aws-alb', 'aws-eks', 'aws-auto-scaling', 'aws-rds', 'aws-elasticache', 'aws-s3'], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [3, 6], [3, 7]], tags: ['web', 'security'] },
  { id: 'saas', name: 'SaaS Platform', description: 'A multi-tenant application foundation with identity and observability.', icon: 'Workflow', services: ['aws-api-gateway', 'aws-lambda', 'aws-dynamodb', 'aws-cognito', 'aws-cloudwatch'], edges: [[0, 1], [1, 2], [0, 3], [1, 4]], tags: ['serverless', 'saas'] },
  { id: 'serverless-api', name: 'Serverless API', description: 'API routing, event-driven compute, and durable storage.', icon: 'Zap', services: ['aws-api-gateway', 'aws-lambda', 'aws-dynamodb', 'aws-sqs'], edges: [[0, 1], [1, 2], [1, 3]], tags: ['serverless'] },
  { id: 'data-platform', name: 'Data Platform', description: 'Ingest, store, transform, and analyze operational data.', icon: 'Database', services: ['aws-s3', 'aws-glue', 'aws-athena', 'aws-redshift', 'aws-kinesis'], edges: [[4, 0], [0, 1], [1, 2], [1, 3]], tags: ['analytics'] },
  { id: 'ai-app', name: 'AI Application', description: 'Application services connected to managed foundation models.', icon: 'Sparkles', services: ['aws-cloudfront', 'aws-api-gateway', 'aws-lambda', 'aws-bedrock', 'aws-s3'], edges: [[0, 1], [1, 2], [2, 3], [2, 4]], tags: ['ai'] },
  { id: 'ml-platform', name: 'Machine Learning Platform', description: 'Model training, artifact storage, and inference services.', icon: 'BrainCircuit', services: ['aws-s3', 'aws-sagemaker', 'aws-ecr', 'aws-cloudwatch'], edges: [[0, 1], [2, 1], [1, 3]], tags: ['ai', 'analytics'] },
  { id: 'kubernetes', name: 'Kubernetes Platform', description: 'A managed Kubernetes foundation with registry and monitoring.', icon: 'Boxes', services: ['aws-vpc', 'aws-eks', 'aws-ecr', 'aws-alb', 'aws-cloudwatch'], edges: [[0, 1], [2, 1], [3, 1], [1, 4]], tags: ['containers'] },
  { id: 'ha', name: 'Highly Available Application', description: 'Redundant compute and data components for improved resilience.', icon: 'ShieldCheck', services: ['aws-alb', 'aws-auto-scaling', 'aws-ec2', 'aws-rds', 'aws-backup'], edges: [[0, 1], [1, 2], [2, 3], [3, 4]], tags: ['reliability'] },
  { id: 'multi-region', name: 'Multi-Region Application', description: 'Global traffic routing across independent regional stacks.', icon: 'Globe2', services: ['aws-route53', 'aws-cloudfront', 'aws-alb', 'aws-rds', 'aws-s3'], edges: [[0, 1], [1, 2], [2, 3], [2, 4]], tags: ['reliability', 'networking'] },
  { id: 'disaster-recovery', name: 'Disaster Recovery Architecture', description: 'Backup, replication, and recovery building blocks.', icon: 'LifeBuoy', services: ['aws-route53', 'aws-rds', 'aws-backup', 'aws-s3', 'aws-cloudwatch'], edges: [[0, 1], [1, 2], [2, 3], [1, 4]], tags: ['reliability'] },
  { id: 'event-driven', name: 'Event-Driven Architecture', description: 'Decoupled producers, event routing, and asynchronous workers.', icon: 'GitBranch', services: ['aws-eventbridge', 'aws-sqs', 'aws-lambda', 'aws-dynamodb'], edges: [[0, 1], [1, 2], [2, 3]], tags: ['integration'] },
  { id: 'data-lake', name: 'Data Lake', description: 'Governed object storage with catalog and query services.', icon: 'Waves', services: ['aws-s3', 'aws-lake-formation', 'aws-glue', 'aws-athena'], edges: [[0, 1], [1, 2], [2, 3]], tags: ['analytics'] },
  { id: 'analytics', name: 'Analytics Platform', description: 'Streaming, transformation, warehousing, and dashboards.', icon: 'ChartNoAxesCombined', services: ['aws-kinesis', 'aws-glue', 'aws-redshift', 'aws-quicksight'], edges: [[0, 1], [1, 2], [2, 3]], tags: ['analytics'] },
  { id: 'cicd', name: 'CI/CD Platform', description: 'Build, release, and deploy application changes.', icon: 'Workflow', services: ['aws-codepipeline', 'aws-codebuild', 'aws-codedeploy', 'aws-ecr'], edges: [[0, 1], [1, 2], [1, 3]], tags: ['devops'] },
  { id: 'devsecops', name: 'DevSecOps Platform', description: 'A delivery pipeline with image, identity, and audit controls.', icon: 'LockKeyhole', services: ['aws-codepipeline', 'aws-ecr', 'aws-iam', 'aws-security-hub', 'aws-cloudtrail'], edges: [[0, 1], [0, 2], [1, 3], [2, 4]], tags: ['security', 'devops'] },
]

export function templateArchitecture(template: ArchitectureTemplate, provider: CloudProvider): Architecture {
  const nodes = template.services.map((sourceId, index) => {
    const source = servicesById.get(sourceId)!
    const mapped = source.equivalents?.[provider]?.[0]
    const service = servicesById.get(source.provider === provider ? sourceId : mapped ?? '')
      ?? cloudServices.find((entry) => entry.provider === provider && entry.category === source.category)
      ?? source
    const column = index % 3
    const row = Math.floor(index / 3)
    return createServiceNode(service, { x: 80 + column * 245, y: 80 + row * 155 })
  })
  return {
    nodes,
    edges: template.edges.flatMap(([source, target]) => nodes[source] && nodes[target]
      ? [{ id: `edge-${source}-${target}-${crypto.randomUUID()}`, source: nodes[source].id, target: nodes[target].id, type: 'smoothstep' }]
      : []),
  }
}

function hasService(nodes: Architecture['nodes'], ids: string[]) {
  return nodes.some((node) => ids.some((id) => node.data.serviceId.includes(id)))
}

function containsCredential(value: string) {
  return /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|\bAIza[0-9A-Za-z_-]{35}\b|\bgh[pousr]_[A-Za-z0-9_]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b|\bsk-[A-Za-z0-9_-]{20,}\b/.test(value)
}

function isCredentialPlaceholder(value: string) {
  return !value.trim() || /^(?:replace(?:[-_ ]with)?(?:[-_ ].*)?|your(?:[-_ ].*)?|example(?:[-_ ].*)?|dummy(?:[-_ ].*)?|changeme|<[^>]+>|\*+|x+)$/i.test(value.trim())
}

function isSensitiveConfigValue(key: string, value: string) {
  return value === '[REDACTED]' || (!isCredentialPlaceholder(value) && (
    /(?:secret(?!ref|name)|token|password|passwd|api[_-]?key|credential|private[_-]?key)/i.test(key) || containsCredential(value)
  ))
}

export function redactCredentialValues(architecture: Architecture) {
  let redacted = false
  const nodes = architecture.nodes.map((node) => {
    const label = containsCredential(node.data.label) ? '[REDACTED]' : node.data.label
    if (label !== node.data.label) redacted = true
    const config = Object.fromEntries(Object.entries(node.data.config).map(([key, value]) => {
      if (typeof value === 'string' && isSensitiveConfigValue(key, value)) {
        redacted = true
        return [key, '[REDACTED]']
      }
      return [key, value]
    }))
    return { ...node, data: { ...node.data, label, config } }
  })
  return { architecture: { nodes, edges: architecture.edges }, redacted }
}

export function redactCredentialText(value: string) {
  return containsCredential(value) ? '[REDACTED]' : value
}

export function validateArchitecture(architecture: Architecture): Finding[] {
  const { nodes, edges } = architecture
  const findings: Finding[] = []
  const add = (finding: Omit<Finding, 'id'>) => findings.push({ ...finding, id: `${finding.category}-${findings.length}` })
  const hasNetwork = hasService(nodes, ['-vpc', '-vnet'])
  const hasMonitor = hasService(nodes, ['cloudwatch', 'azure-monitor', 'cloud-monitoring', 'prometheus', 'grafana'])
  const hasSecrets = hasService(nodes, ['secrets-manager', 'key-vault', 'secret-manager'])
  const hasIdentity = hasService(nodes, ['-iam', 'entra-id', 'managed-identity'])
  const hasBackup = hasService(nodes, ['backup', 'site-recovery'])

  if (!hasNetwork && nodes.length) add({ severity: 'medium', category: 'networking', title: 'No network boundary defined', description: 'Compute and data services have no explicit VPC, VNet, or VPC network in this design.', remediation: 'Add a provider network and place workloads in appropriately scoped subnets.' })
  if (!hasMonitor && nodes.length) add({ severity: 'medium', category: 'observability', title: 'No centralized monitoring', description: 'No cloud monitoring or telemetry service is present in the architecture.', remediation: 'Add a monitoring service and define metrics, logs, and alert ownership.' })
  if (!hasIdentity && nodes.some((node) => ['compute', 'containers'].includes(node.data.category))) add({ severity: 'medium', category: 'security', title: 'Workload identity is not modeled', description: 'Compute workloads have no explicit identity or access management component.', remediation: 'Add workload identity and scope permissions to the minimum required actions.' })
  if (!hasSecrets && nodes.some((node) => ['compute', 'containers', 'database'].includes(node.data.category))) add({ severity: 'low', category: 'security', title: 'Secrets management is not modeled', description: 'No managed secrets service is connected to application workloads.', remediation: 'Add a secrets manager and avoid storing credentials in source or images.' })
  if (!hasBackup && nodes.some((node) => node.data.category === 'database')) add({ severity: 'medium', category: 'reliability', title: 'Database recovery is not modeled', description: 'Database backups and restore procedures are not represented.', remediation: 'Add backup policy, retention, restore testing, and recovery objectives.' })

  for (const node of nodes) {
    const service = servicesById.get(node.data.serviceId)
    const config = node.data.config
    const hasCredential = node.data.label === '[REDACTED]' || Object.entries(config).some(([key, value]) => typeof value === 'string' && isSensitiveConfigValue(key, value))
    if (hasCredential) add({
      severity: 'high',
      category: 'security',
      title: 'Possible credential in service configuration',
      description: 'A credential-like value was detected. Its value is hidden; remove it and rotate it if it has been shared.',
      remediation: 'Remove credentials from the architecture and use a managed secret reference instead.',
      nodeId: node.id,
    })
    if (node.data.category === 'database' && config.publicAccess === true) add({ severity: 'high', category: 'security', title: `${node.data.label} allows public access`, description: 'A database node is configured with public access enabled.', remediation: 'Disable public access and use private network connectivity.', nodeId: node.id })
    if (node.data.category === 'storage' && config.publicAccess === true) add({ severity: 'high', category: 'security', title: `${node.data.label} allows public access`, description: 'A storage node is configured to allow public access.', remediation: 'Block public access and use scoped identity-based permissions.', nodeId: node.id })
    if ((node.data.category === 'database' || node.data.category === 'storage') && config.encrypted === false) add({ severity: 'medium', category: 'security', title: `${node.data.label} encryption is disabled`, description: 'Encryption at rest is disabled for this data service.', remediation: 'Enable encryption and review key ownership and rotation.', nodeId: node.id })
    if (node.data.category === 'database' && config.multiAz === false) add({ severity: 'low', category: 'reliability', title: `${node.data.label} is single-zone`, description: 'The database is not configured for multi-zone failover.', remediation: 'Evaluate multi-zone deployment against the service-level objective.', nodeId: node.id })
    if (service?.dependencies.some((dependency) => !nodes.some((candidate) => candidate.data.serviceId === dependency))) add({ severity: 'low', category: 'architecture', title: `${node.data.label} has an unmet dependency`, description: 'A catalog-declared dependency is missing from the architecture.', remediation: 'Add the required dependency or document why it is not applicable.', nodeId: node.id })
    if (edges.every((edge) => edge.source !== node.id && edge.target !== node.id)) add({ severity: 'low', category: 'architecture', title: `${node.data.label} is not connected`, description: 'This resource is isolated from the rest of the architecture graph.', remediation: 'Connect the resource to its upstream or downstream dependency.', nodeId: node.id })
  }
  if (nodes.some((node) => node.data.category === 'compute') && !hasService(nodes, ['auto-scaling', 'scale-sets'])) add({ severity: 'low', category: 'reliability', title: 'Autoscaling is not modeled', description: 'Compute capacity has no explicit scaling policy.', remediation: 'Add autoscaling or document fixed-capacity operating assumptions.' })
  return findings
}

const monthlyRates: Record<string, number> = { compute: 145, containers: 185, database: 210, storage: 24, networking: 42, security: 18, monitoring: 28, integration: 16, analytics: 125, 'ai-ml': 95, devtools: 14, management: 8, migration: 40, cost: 0, iot: 30, media: 55 }
const providerMultipliers: Record<CloudProvider, number> = { aws: 1, azure: 1.035, gcp: 0.965 }

export function estimateMonthlyCost(architecture: Architecture, provider?: CloudProvider) {
  const breakdown = { Compute: 0, Database: 0, Storage: 0, Networking: 0, 'Load balancing': 0, Monitoring: 0, Security: 0, Other: 0 }
  for (const node of architecture.nodes) {
    const category = node.data.category
    const base = monthlyRates[category] ?? 20
    const requestedCount = Number(node.data.config.desiredCount ?? node.data.config.nodeCount ?? 1)
    const multiplier = Number.isFinite(requestedCount) ? Math.min(100, Math.max(1, requestedCount)) : 1
    const amount = base * multiplier * (provider ? providerMultipliers[provider] : 1)
    const bucket = category === 'compute' || category === 'containers' ? 'Compute'
      : category === 'database' ? 'Database' : category === 'storage' ? 'Storage'
        : category === 'networking' ? (node.data.label.toLowerCase().includes('load') || node.data.label === 'ALB' ? 'Load balancing' : 'Networking')
          : category === 'monitoring' ? 'Monitoring' : category === 'security' ? 'Security' : 'Other'
    breakdown[bucket] += amount
  }
  return { total: Object.values(breakdown).reduce((sum, amount) => sum + amount, 0), breakdown }
}

export function scoreFindings(findings: Finding[]) {
  const score = (category: Finding['category']) => Math.max(0, 100 - findings.filter((finding) => finding.category === category).reduce((sum, finding) => sum + ({ high: 24, medium: 13, low: 6, info: 0 }[finding.severity]), 0))
  return {
    Security: score('security'), Reliability: score('reliability'), Networking: score('networking'),
    Observability: score('observability'),
  }
}