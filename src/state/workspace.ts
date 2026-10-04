import { create } from 'zustand'
import type { Connection, Edge, EdgeChange, Node, NodeChange, OnEdgesChange, OnNodesChange } from '@xyflow/react'
import type { Architecture, CanvasNodeData, CloudProvider, CloudService } from '../types'
import { createDemoArchitecture, createServiceNode, redactCredentialText } from '../engine/architecture'
import { parseArchitecture } from '../engine/schema'

type Snapshot = { nodes: Node<CanvasNodeData>[]; edges: Edge[] }

function applyNodeChanges(changes: NodeChange<Node<CanvasNodeData>>[], nodes: Node<CanvasNodeData>[]) {
  const changesById = new Map<string, NodeChange<Node<CanvasNodeData>>[]>()
  const additions: Extract<NodeChange<Node<CanvasNodeData>>, { type: 'add' }>[] = []
  for (const change of changes) {
    if (change.type === 'add') {
      additions.push(change)
    } else if (change.type === 'remove' || change.type === 'replace') {
      changesById.set(change.id, [change])
    } else {
      changesById.set(change.id, [...(changesById.get(change.id) ?? []), change])
    }
  }

  const updatedNodes = nodes.flatMap((node) => {
    const nodeChanges = changesById.get(node.id)
    if (!nodeChanges) return [node]
    if (nodeChanges[0].type === 'remove') return []
    if (nodeChanges[0].type === 'replace') return [{ ...nodeChanges[0].item }]
    const updatedNode = { ...node }
    for (const change of nodeChanges) {
      if (change.type === 'select') {
        updatedNode.selected = change.selected
      } else if (change.type === 'position') {
        if (change.position !== undefined) updatedNode.position = change.position
        if (change.dragging !== undefined) updatedNode.dragging = change.dragging
      } else if (change.type === 'dimensions') {
        if (change.dimensions !== undefined) {
          updatedNode.measured = { ...change.dimensions }
          if (change.setAttributes === true || change.setAttributes === 'width') updatedNode.width = change.dimensions.width
          if (change.setAttributes === true || change.setAttributes === 'height') updatedNode.height = change.dimensions.height
        }
        if (typeof change.resizing === 'boolean') updatedNode.resizing = change.resizing
      }
    }
    return [updatedNode]
  })

  for (const change of additions) {
    const item = { ...change.item }
    if (change.index === undefined) updatedNodes.push(item)
    else updatedNodes.splice(change.index, 0, item)
  }
  return updatedNodes
}

function applyEdgeChanges(changes: EdgeChange[], edges: Edge[]) {
  const changesById = new Map<string, EdgeChange[]>()
  const additions: Extract<EdgeChange, { type: 'add' }>[] = []
  for (const change of changes) {
    if (change.type === 'add') additions.push(change)
    else if (change.type === 'remove' || change.type === 'replace') changesById.set(change.id, [change])
    else changesById.set(change.id, [...(changesById.get(change.id) ?? []), change])
  }
  const updatedEdges = edges.flatMap((edge) => {
    const edgeChanges = changesById.get(edge.id)
    if (!edgeChanges) return [edge]
    if (edgeChanges[0].type === 'remove') return []
    if (edgeChanges[0].type === 'replace') return [{ ...edgeChanges[0].item }]
    const updatedEdge = { ...edge }
    for (const change of edgeChanges) {
      if (change.type === 'select') updatedEdge.selected = change.selected
    }
    return [updatedEdge]
  })
  for (const change of additions) {
    const item = { ...change.item }
    if (change.index === undefined) updatedEdges.push(item)
    else updatedEdges.splice(change.index, 0, item)
  }
  return updatedEdges
}

function connectEdge(connection: Connection, edges: Edge[]) {
  if (!connection.source || !connection.target || edges.some((edge) =>
    edge.source === connection.source &&
    edge.target === connection.target &&
    (edge.sourceHandle === connection.sourceHandle || (!edge.sourceHandle && !connection.sourceHandle)) &&
    (edge.targetHandle === connection.targetHandle || (!edge.targetHandle && !connection.targetHandle))
  )) return edges

  const sourceHandle = connection.sourceHandle || ''
  const targetHandle = connection.targetHandle || ''
  return [...edges, {
    id: `xy-edge__${connection.source}${sourceHandle}-${connection.target}${targetHandle}`,
    source: connection.source,
    target: connection.target,
    ...(connection.sourceHandle != null ? { sourceHandle: connection.sourceHandle } : {}),
    ...(connection.targetHandle != null ? { targetHandle: connection.targetHandle } : {}),
    type: 'smoothstep',
    animated: false,
  }]
}

type WorkspaceState = Snapshot & {
  analysisNodes: Node<CanvasNodeData>[]
  selectedNodeId: string | null
  selectedProviders: CloudProvider[]
  theme: 'light' | 'dark' | 'system'
  projectName: string
  past: Snapshot[]
  future: Snapshot[]
  onNodesChange: OnNodesChange<Node<CanvasNodeData>>
  onEdgesChange: OnEdgesChange
  onConnect: (connection: Connection) => void
  selectNode: (id: string | null) => void
  toggleProvider: (provider: CloudProvider) => void
  setTheme: (theme: WorkspaceState['theme']) => void
  setProjectName: (name: string) => void
  addService: (service: CloudService, position?: { x: number; y: number }) => string
  removeNode: (id: string) => void
  updateNode: (id: string, update: Partial<CanvasNodeData>) => void
  replaceArchitecture: (architecture: Architecture) => void
  undo: () => void
  redo: () => void
}

function readSaved(): Partial<Snapshot & Pick<WorkspaceState, 'projectName' | 'theme' | 'selectedProviders'>> {
  try {
    const parsed = JSON.parse(localStorage.getItem('cloudcanvas.workspace') ?? 'null')
    if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      const architecture = parseArchitecture(parsed)
      return {
        ...architecture,
        projectName: typeof parsed.projectName === 'string' ? redactCredentialText(parsed.projectName) : undefined,
        theme: ['light', 'dark', 'system'].includes(parsed.theme) ? parsed.theme : undefined,
        selectedProviders: Array.isArray(parsed.selectedProviders) && parsed.selectedProviders.every((provider: unknown) => ['aws', 'azure', 'gcp'].includes(String(provider))) ? parsed.selectedProviders : undefined,
      }
    }
  } catch { /* Invalid local data falls back to the demo graph. */ }
  return {}
}

const saved = typeof localStorage === 'undefined' ? {} : readSaved()
const demo = createDemoArchitecture()
const initialNodes = saved.nodes ?? demo.nodes

export const useWorkspace = create<WorkspaceState>((set) => ({
  nodes: initialNodes,
  analysisNodes: initialNodes,
  edges: saved.edges ?? demo.edges,
  selectedNodeId: null,
  selectedProviders: saved.selectedProviders ?? ['aws'],
  theme: saved.theme ?? 'light',
  projectName: saved.projectName ?? 'E-Commerce Platform',
  past: [],
  future: [],
  onNodesChange: (changes) => set((state) => {
    const nodes = applyNodeChanges(changes, state.nodes)
    return changes.some((change) => change.type === 'add' || change.type === 'remove' || change.type === 'replace')
      ? { nodes, analysisNodes: nodes }
      : { nodes }
  }),
  onEdgesChange: (changes) => set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
  onConnect: (connection) => set((state) => ({
    past: [...state.past.slice(-29), { nodes: state.nodes, edges: state.edges }], future: [],
    edges: connectEdge(connection, state.edges),
  })),
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  toggleProvider: (provider) => set((state) => {
    const selectedProviders = state.selectedProviders.includes(provider)
      ? state.selectedProviders.length > 1 ? state.selectedProviders.filter((entry) => entry !== provider) : state.selectedProviders
      : [...state.selectedProviders, provider]
    return { selectedProviders }
  }),
  setTheme: (theme) => set({ theme }),
  setProjectName: (projectName) => set({ projectName }),
  addService: (service, position = { x: 180, y: 180 }) => {
    const node = createServiceNode(service, position)
    set((state) => {
      const nodes = [...state.nodes, node]
      return { past: [...state.past.slice(-29), { nodes: state.nodes, edges: state.edges }], future: [], nodes, analysisNodes: nodes }
    })
    return node.id
  },
  removeNode: (id) => set((state) => ({
    past: [...state.past.slice(-29), { nodes: state.nodes, edges: state.edges }], future: [],
    nodes: state.nodes.filter((node) => node.id !== id), edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
    analysisNodes: state.analysisNodes.filter((node) => node.id !== id),
    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
  })),
  updateNode: (id, update) => set((state) => {
    const nodes = state.nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, ...update } } : node)
    return { nodes, analysisNodes: nodes }
  }),
  replaceArchitecture: (architecture) => set((state) => ({
    past: [...state.past.slice(-29), { nodes: state.nodes, edges: state.edges }], future: [],
    nodes: architecture.nodes, edges: architecture.edges, selectedNodeId: null,
    analysisNodes: architecture.nodes,
  })),
  undo: () => set((state) => {
    const previous = state.past.at(-1)
    if (!previous) return state
    return { nodes: previous.nodes, analysisNodes: previous.nodes, edges: previous.edges, past: state.past.slice(0, -1), future: [...state.future, { nodes: state.nodes, edges: state.edges }] }
  }),
  redo: () => set((state) => {
    const next = state.future.at(-1)
    if (!next) return state
    return { nodes: next.nodes, analysisNodes: next.nodes, edges: next.edges, past: [...state.past, { nodes: state.nodes, edges: state.edges }], future: state.future.slice(0, -1) }
  }),
}))

export function saveWorkspaceLocally(state = useWorkspace.getState()) {
  try {
    localStorage.setItem('cloudcanvas.workspace', JSON.stringify({ nodes: state.nodes, edges: state.edges, projectName: state.projectName, theme: state.theme, selectedProviders: state.selectedProviders }))
    return true
  } catch {
    return false
  }
}