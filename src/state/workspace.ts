import { create } from 'zustand'
import type { Connection, Edge, Node, OnEdgesChange, OnNodesChange } from '@xyflow/react'
import { applyEdgeChanges, applyNodeChanges, addEdge } from '@xyflow/react'
import type { Architecture, CanvasNodeData, CloudProvider, CloudService } from '../types'
import { createDemoArchitecture, createServiceNode } from '../engine/architecture'
import { parseArchitecture } from '../engine/schema'

type Snapshot = { nodes: Node<CanvasNodeData>[]; edges: Edge[] }
type WorkspaceState = Snapshot & {
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
        projectName: typeof parsed.projectName === 'string' ? parsed.projectName : undefined,
        theme: ['light', 'dark', 'system'].includes(parsed.theme) ? parsed.theme : undefined,
        selectedProviders: Array.isArray(parsed.selectedProviders) && parsed.selectedProviders.every((provider: unknown) => ['aws', 'azure', 'gcp'].includes(String(provider))) ? parsed.selectedProviders : undefined,
      }
    }
  } catch { /* Invalid local data falls back to the demo graph. */ }
  return {}
}

const saved = typeof localStorage === 'undefined' ? {} : readSaved()
const demo = createDemoArchitecture()

export const useWorkspace = create<WorkspaceState>((set) => ({
  nodes: saved.nodes ?? demo.nodes,
  edges: saved.edges ?? demo.edges,
  selectedNodeId: null,
  selectedProviders: saved.selectedProviders ?? ['aws'],
  theme: saved.theme ?? 'light',
  projectName: saved.projectName ?? 'E-Commerce Platform',
  past: [],
  future: [],
  onNodesChange: (changes) => set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) as Node<CanvasNodeData>[] })),
  onEdgesChange: (changes) => set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
  onConnect: (connection) => set((state) => ({
    past: [...state.past.slice(-29), { nodes: state.nodes, edges: state.edges }], future: [],
    edges: addEdge({ ...connection, type: 'smoothstep', animated: false }, state.edges),
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
    set((state) => ({ past: [...state.past.slice(-29), { nodes: state.nodes, edges: state.edges }], future: [], nodes: [...state.nodes, node] }))
    return node.id
  },
  removeNode: (id) => set((state) => ({
    past: [...state.past.slice(-29), { nodes: state.nodes, edges: state.edges }], future: [],
    nodes: state.nodes.filter((node) => node.id !== id), edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
  })),
  updateNode: (id, update) => set((state) => ({ nodes: state.nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, ...update } } : node) })),
  replaceArchitecture: (architecture) => set((state) => ({
    past: [...state.past.slice(-29), { nodes: state.nodes, edges: state.edges }], future: [],
    nodes: architecture.nodes, edges: architecture.edges, selectedNodeId: null,
  })),
  undo: () => set((state) => {
    const previous = state.past.at(-1)
    if (!previous) return state
    return { nodes: previous.nodes, edges: previous.edges, past: state.past.slice(0, -1), future: [...state.future, { nodes: state.nodes, edges: state.edges }] }
  }),
  redo: () => set((state) => {
    const next = state.future.at(-1)
    if (!next) return state
    return { nodes: next.nodes, edges: next.edges, past: [...state.past, { nodes: state.nodes, edges: state.edges }], future: state.future.slice(0, -1) }
  }),
}))

export function saveWorkspaceLocally(state = useWorkspace.getState()) {
  try {
    localStorage.setItem('cloudcanvas.workspace', JSON.stringify({ nodes: state.nodes, edges: state.edges, projectName: state.projectName, theme: state.theme, selectedProviders: state.selectedProviders }))
  } catch { /* Browser storage can be disabled or full. */ }
}