import { memo, useMemo, useRef, useState, type DragEvent } from 'react'
import { Activity, ArrowLeftRight, ArrowRight, Blocks, Boxes, Cloud, Code2, Database, Download, FileCode2, GitBranch, Globe2, HardDrive, Layers3, LockKeyhole, Network, Plus, Settings2, Shield, Zap } from 'lucide-react'
import { Background, BackgroundVariant, Controls, Handle, MiniMap, Position, ReactFlow, ReactFlowProvider, useReactFlow, type Node, type NodeProps } from '@xyflow/react'
import { providerLabels, servicesById } from './data/clouds'
import { useWorkspace } from './state/workspace'
import type { CanvasNodeData, CloudProvider } from './types'

const categoryIcons: Record<string, typeof Cloud> = {
  compute: Zap, storage: HardDrive, database: Database, networking: Network, containers: Boxes, security: Shield,
  integration: GitBranch, analytics: Activity, 'ai-ml': Blocks, devtools: Code2, monitoring: Globe2,
  management: Settings2, migration: ArrowLeftRight, cost: Globe2, iot: Globe2, media: Layers3,
}
const providerDefaults: Record<CloudProvider, string> = { aws: 'us-east-1', azure: 'eastus', gcp: 'us-central1' }
const providerColors: Record<CloudProvider, string> = { aws: '#e88921', azure: '#1686d9', gcp: '#4285f4' }

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function downloadFile(name: string, text: string, type = 'text/plain') {
  downloadBlob(new Blob([text], { type }), name)
}

function ServiceNode({ data, selected }: NodeProps<Node<CanvasNodeData>>) {
  const service = servicesById.get(data.serviceId)
  const Icon = categoryIcons[data.category] ?? Cloud
  return <div className={`service-node provider-${data.provider}${selected ? ' is-selected' : ''}`} style={{ '--provider-color': service?.color ?? '#547392' } as React.CSSProperties}>
    <Handle type="target" position={Position.Left} /><div className="node-topline"><span className="node-icon"><Icon size={15} /></span><b>{data.label}</b><span className={`node-health ${data.status}`} /></div>
    <div className="node-description">{service?.description ?? 'Cloud resource'}</div><div className="node-meta">{providerLabels[data.provider]} <i /> {String(data.config.region ?? service?.regions[0] ?? 'Default region')}</div><Handle type="source" position={Position.Right} />
  </div>
}

const nodeTypes = { service: memo(ServiceNode) }

function CanvasContent({ notify }: { notify: (message: string, type?: 'success' | 'error') => void }) {
  const root = useRef<HTMLDivElement>(null)
  const { fitView, screenToFlowPosition } = useReactFlow()
  const nodes = useWorkspace((state) => state.nodes), edges = useWorkspace((state) => state.edges)
  const activeProviders = useWorkspace((state) => state.selectedProviders)
  const selectedId = useWorkspace((state) => state.selectedNodeId)
  const canUndo = useWorkspace((state) => state.past.length > 0), canRedo = useWorkspace((state) => state.future.length > 0)
  const [locked, setLocked] = useState(false), [view, setView] = useState('Design'), [interactionMode, setInteractionMode] = useState<'select' | 'connect'>('select')
  const selected = nodes.find((node) => node.id === selectedId)
  const regionBadges = useMemo(() => activeProviders.flatMap((provider) => {
    const configured = [...new Set(nodes.filter((node) => node.data.provider === provider).map((node) => String(node.data.config.region ?? servicesById.get(node.data.serviceId)?.regions[0] ?? 'Default region')))]
    const regions = configured.length ? configured : [providerDefaults[provider]]
    return regions.map((region) => <span key={`${provider}-${region}`}><Cloud size={13} /> {providerLabels[provider]} · {region}</span>)
  }), [activeProviders, nodes])
  const [initialViewport] = useState(() => {
    const mobile = window.innerWidth <= 640
    const sidebars = mobile ? 18 : window.innerWidth <= 900 ? 246 : 552
    const width = Math.max(280, window.innerWidth - sidebars)
    const height = Math.max(230, window.innerHeight - (mobile ? 365 : 330))
    const minX = Math.min(0, ...nodes.map((node) => node.position.x))
    const minY = Math.min(0, ...nodes.map((node) => node.position.y))
    const maxX = Math.max(220, ...nodes.map((node) => node.position.x + 180))
    const maxY = Math.max(120, ...nodes.map((node) => node.position.y + 90))
    const zoom = Math.min(0.72, (width - 36) / (maxX - minX), (height - 44) / (maxY - minY))
    return { x: (width - (maxX - minX) * zoom) / 2 - minX * zoom, y: (height - (maxY - minY) * zoom) / 2 - minY * zoom, zoom }
  })
  const exportDiagram = async (format: 'png' | 'svg') => {
    const viewport = root.current?.querySelector('.react-flow__viewport') as HTMLElement | null
    if (!viewport) { notify('Unable to export the diagram because the canvas is not ready.', 'error'); return }
    try {
      const { toPng, toSvg } = await import('html-to-image')
      const data = format === 'png' ? await toPng(viewport, { backgroundColor: '#f7f9fc', pixelRatio: 2 }) : await toSvg(viewport, { backgroundColor: '#f7f9fc' })
      downloadFile(`devopsx-architecture.${format}`, data, format === 'png' ? 'image/png' : 'image/svg+xml')
      notify(`${format.toUpperCase()} diagram exported.`)
    } catch {
      notify(`Unable to export the ${format.toUpperCase()} diagram. Try a smaller architecture or another format.`, 'error')
    }
  }
  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    const service = servicesById.get(event.dataTransfer.getData('application/devopsx-service'))
    if (service) {
      const id = useWorkspace.getState().addService(service, screenToFlowPosition({ x: event.clientX, y: event.clientY }))
      useWorkspace.getState().selectNode(id)
    }
  }
  return (
    <section className="canvas-panel">
      <div className="canvas-heading">
        <div>
          <span className="eyebrow">ARCHITECTURE DESIGNER</span>
          <h1>Design your cloud architecture visually.</h1>
          <p>Build, compare, validate, and plan AWS, Azure, and Google Cloud architectures.</p>
        </div>
        <div className="canvas-view-select" role="tablist" aria-label="Architecture view">
          {['Design', 'Network', 'Observability', 'Cost'].map((item) => (
            <button role="tab" aria-selected={view === item} className={view === item ? 'active' : ''} onClick={() => setView(item)} key={item}>{item}</button>
          ))}
        </div>
      </div>
      <div className="canvas-toolbar">
        <div className="toolbar-group">
          <button className={`tool-button${interactionMode === 'select' ? ' active' : ''}`} title="Select and move" aria-label="Select tool" aria-pressed={interactionMode === 'select'} onClick={() => setInteractionMode('select')}><Settings2 size={15} /></button>
          <button className={`tool-button${interactionMode === 'connect' ? ' active' : ''}`} title="Connections" aria-label="Connect resources" aria-pressed={interactionMode === 'connect'} onClick={() => setInteractionMode('connect')}><GitBranch size={15} /></button>
          <button className="tool-button" title="Label selected resource as a group" aria-label="Label selected resource as a group" disabled={!selected} onClick={() => selected && useWorkspace.getState().updateNode(selected.id, { label: `${selected.data.label} group` })}><Layers3 size={15} /></button>
          <span className="toolbar-separator" />
          <button className="tool-button" onClick={() => useWorkspace.getState().undo()} title="Undo" aria-label="Undo" disabled={!canUndo}><ArrowLeftRight size={15} /></button>
          <button className="tool-button" onClick={() => useWorkspace.getState().redo()} title="Redo" aria-label="Redo" disabled={!canRedo}><ArrowRight size={15} /></button>
        </div>
        <div className="toolbar-right">
          <span className="canvas-node-count">{nodes.length} resources <i /> {edges.length} connections</span>
          <button className={`tool-button${locked ? ' active' : ''}`} onClick={() => setLocked(!locked)} title="Lock canvas" aria-label="Lock canvas" aria-pressed={locked}><LockKeyhole size={15} /></button>
          <button className="tool-button" onClick={() => fitView({ padding: 0.2, duration: 250 })} title="Fit view" aria-label="Fit view" disabled={!nodes.length}><Globe2 size={15} /></button>
          <button className="tool-button" onClick={() => void exportDiagram('png')} title="Export PNG"><Download size={15} /></button>
          <button className="tool-button" onClick={() => void exportDiagram('svg')} title="Export SVG"><FileCode2 size={15} /></button>
        </div>
      </div>
      <div className={`flow-frame view-${view.toLowerCase()}`} ref={root} onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={useWorkspace.getState().onNodesChange}
          onEdgesChange={useWorkspace.getState().onEdgesChange}
          onConnect={useWorkspace.getState().onConnect}
          onNodeClick={(_, node) => useWorkspace.getState().selectNode(node.id)}
          onPaneClick={() => useWorkspace.getState().selectNode(null)}
          defaultViewport={initialViewport}
          nodesDraggable={!locked && interactionMode === 'select'}
          nodesConnectable={!locked}
          elementsSelectable
          panOnScroll
          selectionOnDrag
          minZoom={0.15}
          maxZoom={1.8}
          defaultEdgeOptions={{ type: 'smoothstep', style: { stroke: '#91a4ba', strokeWidth: 1.5 } }}
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background variant={BackgroundVariant.Dots} gap={21} size={1} color="#cfdae7" />
          <MiniMap pannable zoomable nodeColor={(node) => providerColors[(node.data as CanvasNodeData).provider] ?? '#67809d'} maskColor="rgba(240,245,250,.72)" />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
        {nodes.length === 0 && <div className="canvas-empty"><span><Plus size={19} /></span><b>Start with a service</b><small>Drag from the catalog or choose a template</small></div>}
        <div className="region-boundary">{regionBadges}</div>
      </div>
      <div className="canvas-caption"><span><i className="live-dot" /> Local architecture model</span><span>Illustrative design · not deployed</span></div>
    </section>
  )
}

export default function Canvas({ notify }: { notify: (message: string, type?: 'success' | 'error') => void }) {
  return <ReactFlowProvider><CanvasContent notify={notify} /></ReactFlowProvider>
}
