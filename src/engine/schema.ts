import type { Architecture, CloudProvider, Project } from '../types'
import { cloudServices } from '../data/clouds'

const providerIds = new Set<CloudProvider>(['aws', 'azure', 'gcp'])
const categories = new Set(['compute', 'storage', 'database', 'networking', 'containers', 'security', 'integration', 'analytics', 'ai-ml', 'devtools', 'monitoring', 'management', 'migration', 'cost', 'iot', 'media'])
const knownServices = new Map(cloudServices.map((service) => [service.id, service]))

export function parseArchitecture(value: unknown): Architecture {
  if (!value || typeof value !== 'object') throw new Error('Architecture must be an object.')
  const graph = value as Record<string, unknown>
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) throw new Error('Architecture requires node and edge arrays.')
  const nodeIds = new Set<string>()
  const nodes = graph.nodes.map((value) => {
    if (!value || typeof value !== 'object') throw new Error('Architecture contains an invalid node.')
    const node = value as Record<string, unknown>
    const position = node.position as Record<string, unknown> | undefined
    const data = node.data as Record<string, unknown> | undefined
    if (typeof node.id !== 'string' || !node.id || nodeIds.has(node.id)) throw new Error('Architecture node IDs must be unique strings.')
    if (!position || typeof position.x !== 'number' || !Number.isFinite(position.x) || typeof position.y !== 'number' || !Number.isFinite(position.y)) throw new Error('Architecture node positions must be finite numbers.')
    if (!data || typeof data.serviceId !== 'string' || !knownServices.has(data.serviceId)) throw new Error('Architecture references an unknown service.')
    if (typeof data.label !== 'string' || typeof data.provider !== 'string' || !providerIds.has(data.provider as CloudProvider) || typeof data.category !== 'string' || !categories.has(data.category)) throw new Error('Architecture contains invalid service metadata.')
    const service = knownServices.get(data.serviceId)
    if (service?.provider !== data.provider || service.category !== data.category) throw new Error('Architecture service metadata does not match the registry.')
    if (!data.config || typeof data.config !== 'object' || Array.isArray(data.config) || Object.values(data.config as Record<string, unknown>).some((entry) => !['string', 'number', 'boolean'].includes(typeof entry))) throw new Error('Architecture contains invalid service configuration.')
    nodeIds.add(node.id)
    return value as Architecture['nodes'][number]
  })
  const edgeIds = new Set<string>()
  const edges = graph.edges.map((value) => {
    if (!value || typeof value !== 'object') throw new Error('Architecture contains an invalid connection.')
    const edge = value as Record<string, unknown>
    if (typeof edge.id !== 'string' || !edge.id || edgeIds.has(edge.id) || typeof edge.source !== 'string' || typeof edge.target !== 'string' || !nodeIds.has(edge.source) || !nodeIds.has(edge.target) || edge.source === edge.target) throw new Error('Architecture connection endpoints or IDs are invalid.')
    edgeIds.add(edge.id)
    return value as Architecture['edges'][number]
  })
  return { nodes, edges }
}

export function parseProject(value: unknown): Project {
  if (!value || typeof value !== 'object') throw new Error('Project must be an object.')
  const project = value as Record<string, unknown>
  if (typeof project.id !== 'string' || typeof project.name !== 'string' || !project.name.trim() || !Array.isArray(project.cloudProviders) || project.cloudProviders.some((provider) => !providerIds.has(provider as CloudProvider)) || typeof project.createdAt !== 'string' || typeof project.updatedAt !== 'string') throw new Error('Project metadata is invalid.')
  return { ...project, architecture: parseArchitecture(project.architecture) } as Project
}