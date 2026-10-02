import type { Edge, Node } from '@xyflow/react'

export type CloudProvider = 'aws' | 'azure' | 'gcp'
export type ServiceCategory =
  | 'compute' | 'storage' | 'database' | 'networking' | 'containers'
  | 'security' | 'integration' | 'analytics' | 'ai-ml' | 'devtools'
  | 'monitoring' | 'management' | 'migration' | 'cost' | 'iot' | 'media'

export type ConfigField = {
  label: string
  type: 'text' | 'number' | 'boolean' | 'select'
  defaultValue: string | number | boolean
  options?: string[]
}

export type CloudService = {
  id: string
  provider: CloudProvider
  name: string
  shortName: string
  category: ServiceCategory
  description: string
  icon: string
  color: string
  capabilities: string[]
  equivalents?: Partial<Record<CloudProvider, string[]>>
  dependencies: string[]
  recommendedWith: string[]
  tags: string[]
  architectureRoles: string[]
  regions: string[]
  configurationSchema: Record<string, ConfigField>
}

export type CanvasNodeData = {
  serviceId: string
  label: string
  provider: CloudProvider
  category: ServiceCategory
  status: 'healthy' | 'warning' | 'critical'
  config: Record<string, string | number | boolean>
  [key: string]: unknown
}

export type Architecture = {
  nodes: Node<CanvasNodeData>[]
  edges: Edge[]
}

export type Project = {
  id: string
  name: string
  description?: string
  cloudProviders: CloudProvider[]
  architecture: Architecture
  createdAt: string
  updatedAt: string
}

export type Finding = {
  id: string
  severity: 'high' | 'medium' | 'low' | 'info'
  category: 'security' | 'reliability' | 'networking' | 'observability' | 'architecture'
  title: string
  description: string
  nodeId?: string
  remediation: string
}

export type ArchitectureTemplate = {
  id: string
  name: string
  description: string
  icon: string
  services: string[]
  edges: [number, number][]
  tags: string[]
}