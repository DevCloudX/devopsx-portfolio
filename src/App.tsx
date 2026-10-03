import { memo, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Activity, ArrowLeftRight, ArrowRight, BadgeCheck, Blocks, Boxes, Braces, Check, ChevronDown, CircleHelp, Cloud, Code2, Copy, Database, Download, FileCode2, FileJson, FileText, Gauge, GitBranch, Globe2, HardDrive, HeartPulse, Layers3, LockKeyhole, Menu, Moon, Network, PanelRightClose, Plus, Search, Settings2, Shield, ShieldAlert, ShieldCheck, Sun, X, Zap } from 'lucide-react'
import { Background, BackgroundVariant, Controls, Handle, MiniMap, Position, ReactFlow, ReactFlowProvider, useReactFlow, type Node, type NodeProps } from '@xyflow/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { toPng, toSvg } from 'html-to-image'
import JSZip from 'jszip'
import { cloudServices, categoryLabels, providerLabels, servicesById } from './data/clouds'
import { architectureTemplates, estimateMonthlyCost, redactCredentialText, scoreFindings, templateArchitecture, validateArchitecture } from './engine/architecture'
import { generateDocumentation, generateHelm, generateKubernetes, generateTerraform } from './engine/generators'
import { parseArchitecture, parseProject } from './engine/schema'
import { saveWorkspaceLocally, useWorkspace } from './state/workspace'
import type { Architecture, CanvasNodeData, CloudProvider, CloudService, Finding, Project, ServiceCategory } from './types'
import '@xyflow/react/dist/style.css'

type View = 'Design' | 'Templates' | 'Compare' | 'Cost' | 'Security' | 'Generate'
type Modal = 'search' | 'projects' | 'ai' | 'convert' | 'help' | 'more' | null
type GeneratorKind = 'Terraform' | 'Kubernetes' | 'Helm' | 'Documentation'
const moduleViews: View[] = ['Design', 'Templates', 'Compare', 'Cost', 'Security', 'Generate']
const providers: CloudProvider[] = ['aws', 'azure', 'gcp']
const providerMark: Record<CloudProvider, string> = { aws: 'A', azure: '◧', gcp: 'G' }
const categoryIcons: Record<string, typeof Cloud> = { compute: Zap, storage: HardDrive, database: Database, networking: Network, containers: Boxes, security: Shield, integration: GitBranch, analytics: Activity, 'ai-ml': Blocks, devtools: Code2, monitoring: Gauge, management: Settings2, migration: ArrowLeftRight, cost: Gauge, iot: Globe2, media: Layers3 }

function viewFromHash(): View {
  const route = window.location.hash.slice(1).toLowerCase()
  return moduleViews.find((item) => item.toLowerCase() === route) ?? 'Design'
}

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

function readProjects(): Project[] {
  const stored = localStorage.getItem('cloudcanvas.projects')
  if (!stored) return []
  const parsed: unknown = JSON.parse(stored)
  if (!Array.isArray(parsed)) throw new Error('The saved project list is invalid.')
  const projects = parsed.map(parseProject)
  const safeStored = JSON.stringify(projects)
  if (safeStored !== stored) localStorage.setItem('cloudcanvas.projects', safeStored)
  return projects
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

function Catalog({ onAdd }: { onAdd: (service: CloudService) => void }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ServiceCategory | 'all'>('all')
  const scrollRef = useRef<HTMLDivElement>(null)
  const active = useWorkspace((state) => state.selectedProviders)
  const results = useMemo(() => cloudServices.filter((service) => active.includes(service.provider) && (category === 'all' || category === service.category) && `${service.name} ${service.description} ${service.category} ${service.provider}`.toLowerCase().includes(search.toLowerCase())), [active, category, search])
  // oxlint-disable-next-line react/incompatible-library
  const list = useVirtualizer({ count: results.length, getScrollElement: () => scrollRef.current, estimateSize: () => 58, overscan: 7, initialRect: { width: 240, height: 300 } })
  const virtualRows = list.getVirtualItems()
  const renderedRows = virtualRows.length ? virtualRows : results.map((_, index) => ({ index, start: index * 58, size: 58 }))
  const totalSize = Math.max(list.getTotalSize(), results.length * 58)
  const categories = [...new Set(cloudServices.filter((service) => active.includes(service.provider)).map((service) => service.category))]
  return <aside className="catalog-panel"><div className="panel-heading"><div><span className="eyebrow">BUILD</span><h2>Service catalog</h2></div></div><div className="provider-selector"><div className="section-label">CLOUD PROVIDERS <small>{active.length} active</small></div><div className="provider-toggles">{providers.map((provider) => <button key={provider} aria-pressed={active.includes(provider)} className={`provider-toggle ${provider}${active.includes(provider) ? ' active' : ''}`} onClick={() => useWorkspace.getState().toggleProvider(provider)}><span className="provider-mark">{providerMark[provider]}</span>{providerLabels[provider]}{active.includes(provider) && <Check size={12} />}</button>)}</div><div className="catalog-count">{cloudServices.filter((service) => active.includes(service.provider)).length} catalog entries</div></div><label className="field-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a service..." aria-label="Search cloud services" /><kbd>/</kbd></label><div className="category-list"><button className={`category${category === 'all' ? ' active' : ''}`} onClick={() => setCategory('all')}><Blocks size={15} /><span>All services</span><b>{cloudServices.filter((service) => active.includes(service.provider)).length}</b></button>{categories.map((item) => { const Icon = categoryIcons[item] ?? Cloud; return <button key={item} className={`category${category === item ? ' active' : ''}`} onClick={() => setCategory(item)}><Icon size={15} /><span>{categoryLabels[item] ?? item}</span><b>{cloudServices.filter((service) => active.includes(service.provider) && service.category === item).length}</b></button> })}</div><div className="catalog-results-head"><span>{search ? `${results.length} RESULTS` : 'POPULAR SERVICES'}</span><Blocks size={13} /></div><div className="service-list" ref={scrollRef}><div style={{ height: totalSize, position: 'relative' }}>{renderedRows.map((row) => { const service = results[row.index]; const Icon = categoryIcons[service.category] ?? Cloud; return <button key={service.id} className="service-row" draggable style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: row.size, transform: `translateY(${row.start}px)` }} onDragStart={(event) => event.dataTransfer.setData('application/devopsx-service', service.id)} onClick={() => onAdd(service)} title={`Add ${service.shortName}`}><span className={`service-icon ${service.provider}`}><Icon size={15} /></span><span className="service-copy"><b>{service.shortName}</b><small>{service.description}</small></span><Plus className="service-add" size={15} /></button> })}{!results.length && <div className="empty-results">No services found.</div>}</div></div><div className="catalog-footer"><span>Extensible service registry</span><b>{cloudServices.length} total</b></div></aside>
}

function Canvas({ notify }: { notify: (message: string, type?: 'success' | 'error') => void }) {
  const root = useRef<HTMLDivElement>(null)
  const { fitView, screenToFlowPosition } = useReactFlow()
  const nodes = useWorkspace((state) => state.nodes), edges = useWorkspace((state) => state.edges)
  const activeProviders = useWorkspace((state) => state.selectedProviders)
  const selectedId = useWorkspace((state) => state.selectedNodeId)
  const canUndo = useWorkspace((state) => state.past.length > 0), canRedo = useWorkspace((state) => state.future.length > 0)
  const [locked, setLocked] = useState(false), [view, setView] = useState('Design'), [interactionMode, setInteractionMode] = useState<'select' | 'connect'>('select')
  const selected = nodes.find((node) => node.id === selectedId)
  const regionBadges = activeProviders.flatMap((provider) => {
    const configured = [...new Set(nodes.filter((node) => node.data.provider === provider).map((node) => String(node.data.config.region ?? servicesById.get(node.data.serviceId)?.regions[0] ?? 'Default region')))]
    const regions = configured.length ? configured : [provider === 'aws' ? 'us-east-1' : provider === 'azure' ? 'eastus' : 'us-central1']
    return regions.map((region) => <span key={`${provider}-${region}`}><Cloud size={13} /> {providerLabels[provider]} · {region}</span>)
  })
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
      const data = format === 'png' ? await toPng(viewport, { backgroundColor: '#f7f9fc', pixelRatio: 2 }) : await toSvg(viewport, { backgroundColor: '#f7f9fc' })
      downloadFile(`devopsx-architecture.${format}`, data, format === 'png' ? 'image/png' : 'image/svg+xml')
      notify(`${format.toUpperCase()} diagram exported.`)
    } catch {
      notify(`Unable to export the ${format.toUpperCase()} diagram. Try a smaller architecture or another format.`, 'error')
    }
  }
  const onDrop = (event: React.DragEvent) => { event.preventDefault(); const service = servicesById.get(event.dataTransfer.getData('application/devopsx-service')); if (service) { const id = useWorkspace.getState().addService(service, screenToFlowPosition({ x: event.clientX, y: event.clientY })); useWorkspace.getState().selectNode(id) } }
  return (
    <section className="canvas-panel">
      <div className="canvas-heading">
        <div>
          <span className="eyebrow">ARCHITECTURE DESIGNER</span>
          <h1>Design your cloud architecture visually.</h1>
          <p>Build, compare, validate and generate AWS, Azure and Google Cloud architectures.</p>
        </div>
        <div className="canvas-view-select" role="tablist" aria-label="Architecture view">
          {['Design', 'Security', 'Network', 'Observability', 'Cost'].map((item) => (
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
          defaultViewport={{ x: initialViewport.x, y: initialViewport.y, zoom: initialViewport.zoom }}
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
          <MiniMap pannable zoomable nodeColor={(node) => ({ aws: '#e88921', azure: '#1686d9', gcp: '#4285f4' }[String((node.data as CanvasNodeData).provider)] ?? '#67809d')} maskColor="rgba(240,245,250,.72)" />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
        {nodes.length === 0 && <div className="canvas-empty"><span><Plus size={19} /></span><b>Start with a service</b><small>Drag from the catalog or choose a template</small></div>}
        <div className="region-boundary">{regionBadges}</div>
      </div>
      <div className="canvas-caption"><span><i className="live-dot" /> Local architecture model</span><span>Illustrative design · not deployed</span></div>
    </section>
  )
}

function Properties({ onRecommend, notify }: { onRecommend: (service: CloudService) => void; notify: (message: string, type?: 'success' | 'error') => void }) {
  const selectedId = useWorkspace((state) => state.selectedNodeId), nodes = useWorkspace((state) => state.nodes)
  const node = nodes.find((entry) => entry.id === selectedId)
  const [tab, setTab] = useState('Configuration')
  if (!node) return <aside className="properties-panel"><div className="panel-heading"><div><span className="eyebrow">INSPECT</span><h2>Properties</h2></div></div><div className="properties-empty"><span><Settings2 size={18} /></span><b>Select a resource</b><p>Click a node to configure its service settings and inspect recommendations.</p><div className="empty-tip"><kbd>⌘</kbd><kbd>K</kbd><span>Quick search</span></div></div><div className="properties-footer"><ShieldCheck size={14} /> Changes stay in this browser</div></aside>
  const service = servicesById.get(node.data.serviceId), Icon = categoryIcons[node.data.category] ?? Cloud
  const related = (service?.recommendedWith ?? []).map((id) => servicesById.get(id)).filter((entry): entry is CloudService => Boolean(entry))
  const fields = Object.entries(service?.configurationSchema ?? {}).filter(([key]) => key !== 'region')
  const updateConfig = (key: string, value: string | number | boolean) => {
    if (typeof value === 'number' && (!Number.isInteger(value) || value < 1 || value > 100)) {
      notify('Resource quantities must be whole numbers between 1 and 100.', 'error')
      return
    }
    useWorkspace.getState().updateNode(node.id, { config: { ...node.data.config, [key]: value } })
  }
  return (
    <aside className="properties-panel">
      <div className="panel-heading"><div><span className="eyebrow">INSPECT</span><h2>Properties</h2></div><button className="icon-button compact" onClick={() => useWorkspace.getState().selectNode(null)} aria-label="Close properties"><PanelRightClose size={15} /></button></div>
      <div className="selected-service"><span className={`selected-service-icon ${node.data.provider}`}><Icon size={18} /></span><div><b>{node.data.label}</b><small>{providerLabels[node.data.provider]} / {categoryLabels[node.data.category]}</small></div><span className={`node-health ${node.data.status}`} /></div>
      <div className="property-tabs">
        <button className={tab === 'Configuration' ? 'active' : ''} onClick={() => setTab('Configuration')}>Configuration</button>
        <button className={tab === 'Related' ? 'active' : ''} onClick={() => setTab('Related')}>Related <small>{related.length}</small></button>
      </div>
      {tab === 'Configuration' ? (
        <div className="property-content">
          <label className="form-field"><span>Resource name</span><input maxLength={80} value={node.data.label} onChange={(event) => useWorkspace.getState().updateNode(node.id, { label: event.target.value })} /></label>
          <label className="form-field"><span>Region</span><select value={String(node.data.config.region ?? service?.regions[0] ?? '')} onChange={(event) => updateConfig('region', event.target.value)}>{(service?.regions ?? []).map((region) => <option key={region}>{region}</option>)}</select></label>
          {fields.map(([key, field]) => (
            <label className={`form-field${field.type === 'boolean' ? ' boolean-field' : ''}`} key={key}>
              <span>{field.label}</span>
              {field.type === 'boolean'
                ? <input type="checkbox" checked={Boolean(node.data.config[key] ?? field.defaultValue)} onChange={(event) => updateConfig(key, event.target.checked)} />
                : field.type === 'select'
                  ? <select value={String(node.data.config[key] ?? field.defaultValue)} onChange={(event) => updateConfig(key, event.target.value)}>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                  : <input type={field.type} value={String(node.data.config[key] ?? field.defaultValue)} min={field.type === 'number' ? 1 : undefined} max={field.type === 'number' ? 100 : undefined} step={field.type === 'number' ? 1 : undefined} onChange={(event) => updateConfig(key, field.type === 'number' ? Number(event.target.value) : event.target.value)} />}
            </label>
          ))}
          {!fields.length && <p className="schema-note">No service-specific settings registered yet.</p>}
          <div className="security-state"><div><ShieldCheck size={15} /> Security posture</div><span><i className={node.data.status === 'healthy' ? '' : 'warning'} />{node.data.status === 'healthy' ? 'No local issues detected' : 'Review configuration'}</span></div>
          <button className="text-action danger-action" onClick={() => useWorkspace.getState().removeNode(node.id)}><X size={14} /> Remove resource</button>
        </div>
      ) : (
        <div className="recommendation-list">
          <p>Common companion services for {node.data.label}.</p>
          {related.map((entry) => {
            const RelatedIcon = categoryIcons[entry.category] ?? Cloud
            return <button key={entry.id} onClick={() => onRecommend(entry)}><span className={`service-icon ${entry.provider}`}><RelatedIcon size={14} /></span><span><b>{entry.shortName}</b><small>{entry.description}</small></span><Plus size={14} /></button>
          })}
          {!related.length && <div className="empty-results">No recommendations registered.</div>}
        </div>
      )}
      <div className="properties-footer"><ShieldCheck size={14} /> Changes stay in this browser</div>
    </aside>
  )
}

function Heading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) { return <div className="module-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{sub}</p></div> }

function TemplatesView({ onLoad }: { onLoad: (index: number) => void }) {
  return <div className="module-view"><Heading eyebrow="START WITH A PATTERN" title="Architecture templates" sub="A practical starting point. Adapt each resource and connection to your requirements." /><div className="template-grid">{architectureTemplates.map((item, index) => <button className="template-card" key={item.id} onClick={() => onLoad(index)}><span className="template-icon"><Layers3 size={18} /></span><span className="template-card-meta"><b>{item.name}</b><small>{item.description}</small></span><span className="template-card-bottom"><span>{item.tags.slice(0, 2).join(' · ')}</span><span>{item.services.length} services <ArrowRight size={13} /></span></span></button>)}</div></div>
}

function CompareView() {
  const [search, setSearch] = useState('kubernetes')
  const families = useMemo(() => { const results = cloudServices.filter((service) => `${service.name} ${service.description} ${service.category}`.toLowerCase().includes(search.toLowerCase())); const ids = new Set(results.map((service) => service.provider === 'aws' ? service.id : service.equivalents?.aws?.[0] ?? service.id)); return [...ids].map((id) => cloudServices.find((service) => service.id === id)!).filter(Boolean).slice(0, 10) }, [search])
  return <div className="module-view"><Heading eyebrow="CROSS-CLOUD REFERENCE" title="Compare services" sub="Capabilities overlap, but implementation details rarely line up exactly." /><label className="module-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search service or capability" /></label><div className="compare-grid compare-head"><span>CAPABILITY</span>{providers.map((provider) => <span key={provider}>{providerLabels[provider]}</span>)}</div>{families.map((reference) => <div className="compare-row" key={reference.id}><div className="compare-capability"><b>{reference.category === 'containers' ? 'Managed Kubernetes' : reference.name}</b><small>{reference.category}</small></div>{providers.map((provider) => { const match = reference.provider === provider ? reference : servicesById.get(reference.equivalents?.[provider]?.[0] ?? ''); return <div className="compare-provider" key={provider}>{match ? <><span className={`provider-mark ${provider}`}>{providerMark[provider]}</span><div><b>{match.shortName}</b><small>{reference.provider === provider ? 'Reference service' : 'Similar capability'}</small></div></> : <span className="no-equivalent">No direct equivalent</span>}</div> })}<div className="compare-note"><CircleHelp size={13} /> Capabilities, configuration, and operating models differ.</div></div>)}{!families.length && <div className="empty-results">No matching service mappings.</div>}</div>
}

function CostView({ architecture, selected }: { architecture: Architecture; selected: CloudProvider[] }) {
  const [traffic, setTraffic] = useState('1')
  const [resilience, setResilience] = useState<'single' | 'multi-az' | 'multi-region'>('single')
  const baseEstimate = estimateMonthlyCost(architecture)
  const resilienceMultiplier = { single: 1, 'multi-az': 1.35, 'multi-region': 2 }[resilience]
  const scenarioMultiplier = Number(traffic) * resilienceMultiplier
  const estimate = {
    total: baseEstimate.total * scenarioMultiplier,
    breakdown: Object.fromEntries(Object.entries(baseEstimate.breakdown).map(([label, amount]) => [label, amount * scenarioMultiplier])),
  }
  return (
    <div className="module-view">
      <Heading eyebrow="CAPACITY PLANNING" title="Cost estimate" sub="Illustrative estimate, not live cloud pricing. Validate with your provider's current quote." />
      {!architecture.nodes.length && <div className="empty-results cost-empty" role="status">Add resources in Design to estimate monthly costs.</div>}
      <div className="cost-total">
        <div><span>ESTIMATED MONTHLY COST</span><b>${Math.round(estimate.total).toLocaleString()}</b><small>{architecture.nodes.length} modeled resources</small></div>
        <span className="estimate-tag">Illustrative only</span>
      </div>
      <div className="cost-provider-grid">{providers.map((provider) => {
        const providerTotal = estimateMonthlyCost(architecture, provider).total * scenarioMultiplier
        return <div className={`cost-provider ${provider}`} key={provider}><span className={`provider-mark ${provider}`}>{providerMark[provider]}</span><b>${Math.round(providerTotal).toLocaleString()}</b><small>{providerLabels[provider]} / mo</small><span className="cost-bar"><i style={{ width: `${estimate.total ? Math.max(5, providerTotal / estimate.total * 100) : 0}%` }} /></span></div>
      })}</div>
      <div className="breakdown-panel">
        <div className="breakdown-head"><b>Monthly cost breakdown</b><span>DEMO PRICING MODEL</span></div>
        {Object.entries(estimate.breakdown).map(([label, amount]) => <div className="breakdown-row" key={label}><span>{label}</span><span className="breakdown-track"><i style={{ width: `${estimate.total ? Math.max(2, amount / estimate.total * 100) : 0}%` }} /></span><b>${Math.round(amount).toLocaleString()}</b></div>)}
      </div>
      <div className="scenario-panel">
        <div><Zap size={16} /><span><b>What-if simulation</b><small>Scenario multipliers are illustrative, not provider quotes.</small></span></div>
        <label>Traffic<select aria-label="Traffic scenario" value={traffic} onChange={(event) => setTraffic(event.target.value)}><option value="1">Baseline</option><option value="2">2× traffic</option><option value="5">5× traffic</option><option value="10">10× traffic</option></select></label>
        <label>Resilience<select aria-label="Resilience scenario" value={resilience} onChange={(event) => { const value = event.target.value; if (value === 'multi-az' || value === 'multi-region' || value === 'single') setResilience(value) }}><option value="single">Single region</option><option value="multi-az">Multi-AZ</option><option value="multi-region">Multi-region</option></select></label>
        <button className="text-action scenario-reset" onClick={() => { setTraffic('1'); setResilience('single') }}>Reset scenario</button>
        <small className="scenario-foot">Clouds selected: {selected.map((provider) => provider.toUpperCase()).join(' + ')}. Region-specific pricing is not modeled.</small>
      </div>
    </div>
  )
}

function SecurityView({ findings, hasResources, onFix }: { findings: Finding[]; hasResources: boolean; onFix: (finding: Finding) => void }) {
  return (
    <div className="module-view">
      <Heading eyebrow="LOCAL RULE ANALYSIS" title="Security & reliability" sub="Local rules check modeled architecture settings and scan configuration values for common credential formats. This is not a compliance certification or full security scanner." />
      <div className="finding-summary">
        {(['high', 'medium', 'low', 'info'] as const).map((level) => <div className={`finding-count ${level}`} key={level}><span>{findings.filter((finding) => finding.severity === level).length}</span><small>{level} findings</small></div>)}
        <div className="finding-count score"><span>{scoreFindings(findings).Security}</span><small>security score</small></div>
      </div>
      <div className="findings-list">
        {findings.map((finding) => (
          <article className={`finding-card ${finding.severity}`} key={finding.id}>
            <span className="finding-icon">{finding.severity === 'high' ? <ShieldAlert size={17} /> : finding.category === 'reliability' ? <HeartPulse size={17} /> : <Shield size={17} />}</span>
            <div className="finding-content">
              <div className="finding-tags"><span className={`severity-tag ${finding.severity}`}>{finding.severity}</span><span>{finding.category}</span></div>
              <b>{finding.title}</b><p>{finding.description}</p><small>RECOMMENDATION · {finding.remediation}</small>
            </div>
            <button className="text-action" onClick={() => onFix(finding)}>{finding.nodeId ? 'Review resource' : 'Add resource'} <ArrowRight size={13} /></button>
          </article>
        ))}
        {!findings.length && hasResources && <div className="all-clear"><BadgeCheck size={22} /><b>No local findings</b><p>No issues were found by the current rule set.</p></div>}
        {!hasResources && <div className="empty-results" role="status">Add resources in Design to run the local security checks.</div>}
      </div>
    </div>
  )
}

function GenerateView({ architecture, name, selected, notify }: { architecture: Architecture; name: string; selected: CloudProvider[]; notify: (message: string, type?: 'success' | 'error') => void }) {
  const [kind, setKind] = useState<GeneratorKind>('Terraform')
  const files: Record<string, string> = useMemo(() => kind === 'Terraform' ? generateTerraform(architecture, selected) : kind === 'Kubernetes' ? generateKubernetes(architecture, name) : kind === 'Helm' ? generateHelm(architecture, name) : { 'ARCHITECTURE.md': generateDocumentation(architecture, name, selected) }, [kind, architecture, name, selected])
  const [selectedFile, setSelectedFile] = useState('')
  const [cleared, setCleared] = useState(false)
  const [busy, setBusy] = useState(false)
  const file = selectedFile in files ? selectedFile : Object.keys(files)[0]
  const content = files[file] ?? Object.values(files)[0] ?? ''
  const makeZip = async () => {
    if (cleared || busy) return
    setBusy(true)
    try {
      const zip = new JSZip()
      Object.entries(files).forEach(([filename, text]) => zip.file(filename, text))
      downloadBlob(await zip.generateAsync({ type: 'blob' }), `devopsx-${kind.toLowerCase()}.zip`)
      notify(`${kind} ZIP downloaded.`)
    } catch {
      notify(`Unable to create the ${kind} ZIP. Please retry.`, 'error')
    } finally {
      setBusy(false)
    }
  }
  const copyFile = async () => {
    if (cleared || busy) return
    try {
      if (!navigator.clipboard) throw new Error('Clipboard access is unavailable.')
      await navigator.clipboard.writeText(content)
      notify(`${file} copied to the clipboard.`)
    } catch {
      notify('Clipboard access failed. Select the code block and copy it manually.', 'error')
    }
  }
  return (
    <div className="module-view generate-view">
      <Heading eyebrow="LOCAL CODE GENERATION" title="Generate project files" sub="Generated locally from this graph. Review provider-specific settings before use." />
      <div className="generator-types">{(['Terraform', 'Kubernetes', 'Helm', 'Documentation'] as GeneratorKind[]).map((item) => <button key={item} className={kind === item ? 'active' : ''} onClick={() => { setKind(item); setCleared(false) }}>{item === 'Documentation' ? <FileText size={15} /> : item === 'Terraform' ? <Braces size={15} /> : <Code2 size={15} />}{item}</button>)}</div>
      <div className="code-workspace">
        <div className="file-list"><span>GENERATED FILES</span>{Object.keys(files).map((filename) => <button className={file === filename ? 'active' : ''} key={filename} onClick={() => setSelectedFile(filename)}><FileCode2 size={14} />{filename}</button>)}</div>
        <div className="code-preview">
          <div className="code-header"><span><i className="live-dot" />{file}</span><button className="text-action" onClick={() => void copyFile()} disabled={cleared || busy}><Copy size={13} /> Copy</button></div>
          {cleared ? <div className="code-cleared">Output cleared. Regenerate the preview to use the current architecture.</div> : <pre><code>{content}</code></pre>}
        </div>
      </div>
      <div className="generator-footer">
        <span><ShieldCheck size={14} /> Generated locally from architecture</span>
        <div className="generator-footer-actions">
          <button className="secondary-button" onClick={() => { setCleared(true); notify('Generated preview cleared.') }} disabled={cleared || busy}>Clear output</button>
          <button className="secondary-button" onClick={() => { setCleared(false); notify('Preview regenerated from the current architecture.') }} disabled={!cleared || busy}>Regenerate</button>
          <button className="primary-button" onClick={() => void makeZip()} disabled={cleared || busy}><Download size={15} />{busy ? 'Preparing ZIP…' : `Download ${kind} ZIP`}</button>
        </div>
      </div>
    </div>
  )
}

function AppWorkspace() {
  const [view, setView] = useState<View>(viewFromHash), [modal, setModal] = useState<Modal>(null), [search, setSearch] = useState('')
  const [toast, setToast] = useState(''), [toastType, setToastType] = useState<'success' | 'error'>('success'), [suggest, setSuggest] = useState<CloudService | null>(null), [prompt, setPrompt] = useState('Build a highly available e-commerce platform.'), [aiProvider, setAiProvider] = useState<CloudProvider>('aws')
  const [mobilePanel, setMobilePanel] = useState('canvas')
  const fileRef = useRef<HTMLInputElement>(null)
  const storageErrorNotified = useRef(false)
  const nodes = useWorkspace((state) => state.nodes), edges = useWorkspace((state) => state.edges), theme = useWorkspace((state) => state.theme), projectName = useWorkspace((state) => state.projectName), selected = useWorkspace((state) => state.selectedProviders), selectedId = useWorkspace((state) => state.selectedNodeId)
  const architecture = useMemo<Architecture>(() => ({ nodes, edges }), [nodes, edges])
  const findings = useMemo(() => validateArchitecture(architecture), [architecture]), health = scoreFindings(findings)
  const notify = (message: string, type: 'success' | 'error' = 'success') => { setToast(message); setToastType(type) }
  const navigateView = (next: View) => {
    setView(next)
    const hash = `#${next.toLowerCase()}`
    if (window.location.hash !== hash) window.location.hash = hash
  }
  useEffect(() => {
    const syncView = () => {
      const route = moduleViews.find((item) => item.toLowerCase() === window.location.hash.slice(1).toLowerCase())
      if (window.location.hash && !route) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#design`)
      setView(route ?? 'Design')
    }
    window.addEventListener('hashchange', syncView)
    window.addEventListener('popstate', syncView)
    syncView()
    return () => {
      window.removeEventListener('hashchange', syncView)
      window.removeEventListener('popstate', syncView)
    }
  }, [])
  useEffect(() => { document.documentElement.dataset.theme = theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme }, [theme])
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (saveWorkspaceLocally()) storageErrorNotified.current = false
      else if (!storageErrorNotified.current) {
        storageErrorNotified.current = true
        notify('Unable to save this workspace in browser storage. Export a JSON backup.', 'error')
      }
    }, 350)
    return () => window.clearTimeout(timer)
  }, [nodes, edges, theme, projectName, selected])
  useEffect(() => { const keydown = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setModal('search') } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) { useWorkspace.getState().redo() } else { useWorkspace.getState().undo() } } else if (event.key === 'Escape') setModal(null); else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId && !['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)) useWorkspace.getState().removeNode(selectedId) }; window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown) }, [selectedId])
  useEffect(() => { if (toast) { const timer = window.setTimeout(() => setToast(''), 2800); return () => window.clearTimeout(timer) } }, [toast])

  const saveProject = () => {
    try {
      const projects = readProjects()
      const now = new Date().toISOString()
      const project: Project = { id: crypto.randomUUID(), name: projectName, cloudProviders: selected, architecture, createdAt: now, updatedAt: now }
      const index = projects.findIndex((item) => item.name === project.name)
      if (index >= 0) {
        project.id = projects[index].id
        project.createdAt = projects[index].createdAt
        projects[index] = project
      } else projects.unshift(project)
      localStorage.setItem('cloudcanvas.projects', JSON.stringify(projects))
      notify('Architecture saved in this browser.')
    } catch {
      notify('Unable to save the project. Browser storage may be unavailable or saved project data may be invalid.', 'error')
    }
  }
  const addService = (service: CloudService) => { const id = useWorkspace.getState().addService(service, { x: 110 + Math.random() * 250, y: 80 + Math.random() * 240 }); useWorkspace.getState().selectNode(id); if (service.recommendedWith.length) setSuggest(service); setMobilePanel('canvas') }
  const loadTemplate = (index: number) => { const template = architectureTemplates[index]; if (!template) { notify('That architecture template is not available.', 'error'); return } useWorkspace.getState().replaceArchitecture(templateArchitecture(template, selected[0] ?? 'aws')); useWorkspace.getState().setProjectName(template.name); navigateView('Design'); notify(`${template.name} loaded. Review the generated configuration.`) }
  const createArchitecture = () => { if (nodes.length && !window.confirm('Start a new architecture? Unsaved changes to the current canvas will be lost.')) return; useWorkspace.getState().replaceArchitecture({ nodes: [], edges: [] }); useWorkspace.getState().setProjectName('Untitled Architecture'); navigateView('Design'); notify('New architecture created.') }
  const generateAI = (event: FormEvent) => { event.preventDefault(); const template = architectureTemplates.find((item) => item.id === 'ecommerce'); if (!template) { notify('The local architecture draft template is unavailable.', 'error'); return } useWorkspace.getState().replaceArchitecture(templateArchitecture(template, aiProvider)); if (!useWorkspace.getState().selectedProviders.includes(aiProvider)) useWorkspace.getState().toggleProvider(aiProvider); useWorkspace.getState().setProjectName(/e-?commerce/i.test(prompt) ? 'E-Commerce Platform' : 'AI Architecture Draft'); setModal(null); navigateView('Design'); notify('Local architecture draft generated. Review all service mappings.') }
  const importFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<Project> & Partial<Architecture>
      const graph = parseArchitecture(parsed.architecture ?? parsed)
      useWorkspace.getState().replaceArchitecture(graph)
      const name = typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : file.name.replace(/\.json$/i, '')
      useWorkspace.getState().setProjectName(redactCredentialText(name))
      setModal(null)
      navigateView('Design')
      const redacted = graph.nodes.some((node) => node.data.label === '[REDACTED]' || Object.values(node.data.config).includes('[REDACTED]')) || redactCredentialText(name) !== name
      notify(redacted ? 'Architecture imported. Credential-like values were redacted; rotate any values that were shared.' : 'Architecture imported and validated.')
    } catch (error) {
      notify(`Import failed: ${error instanceof Error ? error.message : 'Choose a valid DevOpsX JSON file.'}`, 'error')
    }
  }
  const exportJson = () => {
    try {
      downloadFile(`${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'architecture'}.json`, JSON.stringify({ name: projectName, cloudProviders: selected, architecture }, null, 2), 'application/json')
      notify('Architecture JSON exported.')
    } catch {
      notify('Unable to export the architecture JSON. Please retry.', 'error')
    }
  }
  const fixFinding = (finding: Finding) => {
    if (finding.nodeId) {
      const node = useWorkspace.getState().nodes.find((item) => item.id === finding.nodeId)
      if (!node) { notify('This finding no longer refers to a resource in the architecture.', 'error'); return }
      const config = { ...node.data.config }
      const canFix = /public access/i.test(finding.title) || /encryption/i.test(finding.title) || /single-zone/i.test(finding.title)
      if (!canFix) {
        useWorkspace.getState().selectNode(node.id)
        setMobilePanel('properties')
        navigateView('Design')
        notify('Review this resource configuration and make the recommended change manually.')
        return
      }
      if (/public access/i.test(finding.title)) config.publicAccess = false
      if (/encryption/i.test(finding.title)) config.encrypted = true
      if (/single-zone/i.test(finding.title)) config.multiAz = true
      useWorkspace.getState().updateNode(node.id, { config, status: 'healthy' })
      notify(`Updated ${node.data.label}; verify the provider-specific requirements.`)
      return
    }
    const suffix = finding.category === 'networking' ? '-vpc' : finding.category === 'observability' ? '-cloudwatch' : finding.category === 'security' ? '-iam' : '-backup'
    const service = cloudServices.find((item) => item.provider === (selected[0] ?? 'aws') && item.id.endsWith(suffix))
    if (service) addService(service)
    else notify('No matching service is registered for this recommendation.', 'error')
  }

  const center = view === 'Design' ? <ReactFlowProvider><Canvas notify={notify} /></ReactFlowProvider> : view === 'Templates' ? <TemplatesView onLoad={loadTemplate} /> : view === 'Compare' ? <CompareView /> : view === 'Cost' ? <CostView architecture={architecture} selected={selected} /> : view === 'Security' ? <SecurityView findings={findings} hasResources={architecture.nodes.length > 0} onFix={fixFinding} /> : <GenerateView architecture={architecture} name={projectName} selected={selected} notify={notify} />
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#design" onClick={(event) => { event.preventDefault(); navigateView('Design') }} aria-label="DevOpsX home">
          <span className="brand-symbol"><i /><i /><i /></span>
          <span className="brand-copy"><b>DevOpsX</b><small>ARCHITECTURE STUDIO</small></span>
        </a>
        <span className="top-divider" />
        <nav className="primary-nav" aria-label="Main navigation">
          {moduleViews.map((item) => <button className={view === item ? 'active' : ''} aria-current={view === item ? 'page' : undefined} onClick={() => navigateView(item)} key={item}>{item}</button>)}
        </nav>
        <div className="top-actions">
          <button className="global-search" onClick={() => setModal('search')}><Search size={15} /><span>Search anything</span><kbd>⌘ K</kbd></button>
          <button className="icon-button" onClick={() => useWorkspace.getState().setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme" aria-label="Toggle theme">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
          <button className="icon-button" onClick={() => setModal('help')} title="Help" aria-label="Help"><CircleHelp size={16} /></button>
          <span className="avatar" title="Local workspace" aria-label="Local workspace">C</span>
        </div>
      </header>
      <div className="project-strip">
        <div className="project-crumb"><i className="crumb-dot" /><button className="project-name" onClick={() => setModal('projects')}>{projectName}<ChevronDown size={13} /></button><span className="project-status">Saved locally</span><span className="project-updated">Last edited just now</span></div>
        <div className="project-actions">
          <button className="text-action new-architecture-action" onClick={createArchitecture} title="Create a new architecture" aria-label="Create a new architecture"><Plus size={14} /><span>New architecture</span></button>
          <button className="text-action" onClick={() => setModal('projects')}><Menu size={14} /> My projects</button>
          <button className="text-action" onClick={() => setModal('convert')}><ArrowLeftRight size={14} /> Convert</button>
          <button className="text-action" onClick={() => setModal('ai')}><Zap size={14} /> AI architect</button>
          <button className="icon-button compact" onClick={exportJson} title="Export JSON" aria-label="Export JSON"><FileJson size={15} /></button>
          <button className="primary-button small" onClick={saveProject}><Check size={14} /> Save project</button>
          <input ref={fileRef} hidden type="file" accept=".json,application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); event.target.value = '' }} />
        </div>
      </div>
      <div className={`workspace-grid mobile-${mobilePanel}`}>
        <Catalog onAdd={addService} />
        <main className="workspace-main">
          {center}
          <div className="bottom-insights">
            <button className="insight-health" onClick={() => navigateView('Security')}><span className="health-ring"><HeartPulse size={14} /></span><span><b>Architecture health</b><small>{findings.length} findings to review</small></span><span className="health-value">{Math.round(Object.values(health).reduce((sum, score) => sum + score, 0) / 4)}<small>/100</small></span></button>
            <div className="insight-score-list">{Object.entries(health).map(([label, score]) => <button key={label} onClick={() => navigateView(label === 'Security' ? 'Security' : 'Design')}><span>{label}</span><b>{score}</b></button>)}</div>
            <button className="bottom-cost" onClick={() => navigateView('Cost')}><span>MONTHLY ESTIMATE</span><b>${Math.round(estimateMonthlyCost(architecture).total).toLocaleString()}<small> / mo</small></b><ArrowRight size={14} /></button>
          </div>
        </main>
        <Properties onRecommend={addService} notify={notify} />
      </div>
      <nav className="mobile-nav" aria-label="Mobile workspace navigation">
        {(['canvas', 'services', 'properties', 'ai', 'more'] as const).map((item) => (
          <button key={item} className={mobilePanel === item || (item === 'more' && modal === 'more') ? 'active' : ''} aria-pressed={mobilePanel === item || (item === 'more' && modal === 'more')} onClick={() => {
            if (item === 'ai') setModal('ai')
            else if (item === 'more') setModal('more')
            else { setMobilePanel(item); navigateView('Design') }
          }}>
            {item === 'canvas' ? <Layers3 size={17} /> : item === 'services' ? <Blocks size={17} /> : item === 'properties' ? <Settings2 size={17} /> : item === 'ai' ? <Zap size={17} /> : <Menu size={17} />}
            <span>{item}</span>
          </button>
        ))}
      </nav>
      {toast && <div className={`app-toast ${toastType}`} role={toastType === 'error' ? 'alert' : 'status'}>{toastType === 'error' ? <ShieldAlert size={15} /> : <Check size={15} />}{toast}<button onClick={() => setToast('')} aria-label="Dismiss"><X size={13} /></button></div>}
      {modal && modal !== 'more' && modal !== 'help' && <WorkspaceModal type={modal} close={() => setModal(null)} search={search} setSearch={setSearch} onTemplate={loadTemplate} onImport={() => fileRef.current?.click()} onExport={exportJson} onAI={generateAI} onNavigate={navigateView} prompt={prompt} setPrompt={setPrompt} aiProvider={aiProvider} setAiProvider={setAiProvider} architecture={architecture} selected={selected} toast={notify} />}
      {modal === 'help' && <HelpDialog onClose={() => setModal(null)} />}
      {modal === 'more' && <MoreDialog onClose={() => setModal(null)} onSelect={(destination) => { navigateView(destination); setMobilePanel('canvas'); setModal(null) }} />}
      {suggest && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSuggest(null) }}><section className="dialog recommendation-dialog" role="dialog" aria-modal="true" aria-labelledby="recommend-title"><div className="dialog-head"><div><span className="eyebrow">ARCHITECTURE PATTERN</span><h2 id="recommend-title">Build around {suggest.shortName}</h2></div><button className="icon-button" onClick={() => setSuggest(null)} aria-label="Close"><X size={17} /></button></div><p>Common companion services registered for this resource.</p><div className="suggestion-chips">{suggest.recommendedWith.map((id) => { const service = servicesById.get(id); if (!service) return null; const Icon = categoryIcons[service.category] ?? Cloud; return <button key={id} onClick={() => { const added = useWorkspace.getState().addService(service); useWorkspace.getState().selectNode(added); setSuggest(null) }}><Icon size={14} />{service.shortName}<Plus size={13} /></button> })}</div><div className="dialog-footer"><span>Starting points, not mandatory dependencies.</span><button className="primary-button" onClick={() => setSuggest(null)}>Done</button></div></section></div>}
    </div>
  )
}

function MoreDialog({ onClose, onSelect }: { onClose: () => void; onSelect: (view: View) => void }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="dialog more-dialog" role="dialog" aria-modal="true" aria-labelledby="more-title"><div className="dialog-head"><div><span className="eyebrow">WORKSPACE</span><h2 id="more-title">Explore DevOpsX</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={17} /></button></div><div className="more-view-list">{(['Design', 'Templates', 'Compare', 'Cost', 'Security', 'Generate'] as View[]).map((view) => <button key={view} onClick={() => onSelect(view)}><span>{view === 'Design' ? <Layers3 size={16} /> : view === 'Templates' ? <Blocks size={16} /> : view === 'Compare' ? <ArrowLeftRight size={16} /> : view === 'Cost' ? <Gauge size={16} /> : view === 'Security' ? <ShieldCheck size={16} /> : <Code2 size={16} />}</span><b>{view}</b><ArrowRight size={14} /></button>)}</div></section></div>
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="dialog help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title"><div className="dialog-head"><div><span className="eyebrow">QUICK GUIDE</span><h2 id="help-title">Working with DevOpsX</h2></div><button className="icon-button" onClick={onClose} aria-label="Close help"><X size={17} /></button></div><div className="help-content"><p>Build and review a local architecture. Nothing is deployed and no cloud credentials are requested.</p><ul><li>Add services from the catalog or choose an architecture template.</li><li>Connect resources by dragging between node handles; configure regions and capacity in Properties.</li><li>Review local security rules and illustrative cost scenarios before generating files.</li><li>Save in this browser or export a JSON backup. Generated files are scaffolds and need provider review.</li></ul><div className="help-shortcuts"><span><kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd> Search services</span><span><kbd>Esc</kbd> Close dialogs</span><span><kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>Z</kbd> Undo</span></div></div><div className="dialog-footer"><span>Changes stay in this browser.</span><button className="primary-button" onClick={onClose}>Done</button></div></section></div>
}

function ProjectsDialog({ close, onImport, onExport, onNavigate, toast }: { close: () => void; onImport: () => void; onExport: () => void; onNavigate: (view: View) => void; toast: (value: string, type?: 'success' | 'error') => void }) {
  const [saved, setSaved] = useState(() => {
    try {
      return { projects: readProjects(), error: '' }
    } catch {
      return { projects: [], error: 'Saved architectures could not be read. Browser storage may be unavailable or the project data may be invalid.' }
    }
  })
  const { projects, error } = saved
  const duplicateProject = (project: Project) => {
    try {
      const copy = { ...project, id: crypto.randomUUID(), name: `${project.name} copy` }
      const next = [copy, ...readProjects()]
      localStorage.setItem('cloudcanvas.projects', JSON.stringify(next))
      setSaved({ projects: next, error: '' })
      toast('Project duplicated locally.')
    } catch {
      toast('Unable to duplicate this project. Check browser storage and saved project data.', 'error')
    }
  }
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
      <section className="dialog projects-dialog" role="dialog" aria-modal="true" aria-labelledby="projects-title">
        <div className="dialog-head"><div><span className="eyebrow">LOCAL WORKSPACE</span><h2 id="projects-title">My architectures</h2></div><button className="icon-button" onClick={close} aria-label="Close"><X size={17} /></button></div>
        <div className="project-modal-actions"><button className="secondary-button" onClick={onImport}><Download size={14} /> Import JSON</button><button className="secondary-button" onClick={onExport}><FileJson size={14} /> Export current</button></div>
        <div className="saved-project-list">
          {error && <div className="empty-results" role="alert">{error}</div>}
          {!error && projects.map((project) => (
            <div className="saved-project" key={project.id}>
              <button className="saved-project-main" onClick={() => {
                useWorkspace.getState().replaceArchitecture(project.architecture)
                useWorkspace.getState().setProjectName(project.name)
                providers.forEach((provider) => {
                  const active = useWorkspace.getState().selectedProviders.includes(provider)
                  if (project.cloudProviders.includes(provider) !== active) useWorkspace.getState().toggleProvider(provider)
                })
                onNavigate('Design')
                close()
              }}>
                <span className="saved-project-icon"><Layers3 size={17} /></span>
                <span><b>{project.name}</b><small>{project.cloudProviders.map((entry) => entry.toUpperCase()).join(' + ')} · {project.architecture.nodes.length} resources</small></span>
              </button>
              <button className="icon-button compact" title="Duplicate project" aria-label={`Duplicate ${project.name}`} onClick={() => duplicateProject(project)}><Copy size={14} /></button>
            </div>
          ))}
          {!error && !projects.length && <div className="empty-projects"><Layers3 size={20} /><b>No saved architectures yet</b><small>Use Save project to keep one in this browser.</small></div>}
        </div>
        <div className="dialog-footer"><span>Browser storage only. No account or sync service.</span><button className="primary-button" onClick={close}>Done</button></div>
      </section>
    </div>
  )
}

function WorkspaceModal({ type, close, search, setSearch, onTemplate, onImport, onExport, onAI, onNavigate, prompt, setPrompt, aiProvider, setAiProvider, architecture, selected, toast }: { type: Exclude<Modal, null | 'more' | 'help'>; close: () => void; search: string; setSearch: (value: string) => void; onTemplate: (index: number) => void; onImport: () => void; onExport: () => void; onAI: (event: FormEvent) => void; onNavigate: (view: View) => void; prompt: string; setPrompt: (value: string) => void; aiProvider: CloudProvider; setAiProvider: (provider: CloudProvider) => void; architecture: Architecture; selected: CloudProvider[]; toast: (value: string, type?: 'success' | 'error') => void }) {
  const [targets, setTargets] = useState<CloudProvider[]>(['azure']), [mapping, setMapping] = useState<Record<string, string>>({})
  const results = useMemo(() => cloudServices.filter((service) => `${service.name} ${service.description} ${service.category}`.toLowerCase().includes(search.toLowerCase())).slice(0, 8), [search])
  if (type === 'search') return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}><section className="dialog search-dialog" role="dialog" aria-modal="true" aria-label="Global search"><label className="dialog-search"><Search size={18} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search services and architectures" /><kbd>ESC</kbd></label><div className="search-results"><span className="section-label">SERVICES</span>{results.map((service) => { const Icon = categoryIcons[service.category] ?? Cloud; return <button key={service.id} onClick={() => { const id = useWorkspace.getState().addService(service); useWorkspace.getState().selectNode(id); onNavigate('Design'); close() }}><span className={`service-icon ${service.provider}`}><Icon size={14} /></span><span><b>{service.shortName}</b><small>{providerLabels[service.provider]} · {categoryLabels[service.category]}</small></span><ArrowRight size={14} /></button> })}<span className="section-label search-template-label">TEMPLATES</span>{architectureTemplates.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase())).slice(0, 3).map((item) => <button key={item.id} onClick={() => { onTemplate(architectureTemplates.indexOf(item)); close() }}><span className="service-icon aws"><Layers3 size={14} /></span><span><b>{item.name}</b><small>Architecture template</small></span><ArrowRight size={14} /></button>)}</div><div className="search-footer"><span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span><span><kbd>↵</kbd> to open</span></div></section></div>
  if (type === 'ai') return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}><section className="dialog ai-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-title"><div className="dialog-head"><div><span className="eyebrow">AI-READY INTERFACE</span><h2 id="ai-title">AI Architect</h2></div><button className="icon-button" onClick={close} aria-label="Close"><X size={17} /></button></div><p>Describe a system to create a local architecture draft. No AI service is called.</p><form onSubmit={onAI}><label className="form-field"><span>What are you building?</span><textarea rows={4} value={prompt} onChange={(event) => setPrompt(event.target.value)} /></label><div className="dialog-provider-select"><span>Target cloud</span>{providers.map((provider) => <button type="button" className={aiProvider === provider ? 'active' : ''} key={provider} onClick={() => setAiProvider(provider)}><span className={`provider-mark ${provider}`}>{providerMark[provider]}</span>{providerLabels[provider]}</button>)}</div><div className="ai-local-note"><ShieldCheck size={15} />Local demo response · Review the generated graph.</div><button className="primary-button full-button" type="submit"><Zap size={15} /> Generate local architecture</button></form></section></div>
  if (type === 'convert') return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}><section className="dialog convert-dialog" role="dialog" aria-modal="true" aria-labelledby="convert-title"><div className="dialog-head"><div><span className="eyebrow">SERVICE MAPPING REVIEW</span><h2 id="convert-title">Convert architecture</h2></div><button className="icon-button" onClick={close} aria-label="Close"><X size={17} /></button></div><p>Review every proposal. Similar capabilities are not exact equivalents.</p><div className="convert-targets"><span>Convert to</span>{providers.filter((provider) => !selected.includes(provider)).map((provider) => <button key={provider} className={targets.includes(provider) ? 'active' : ''} onClick={() => setTargets((current) => current.includes(provider) ? current.filter((entry) => entry !== provider) : [...current, provider])}><span className={`provider-mark ${provider}`}>{providerMark[provider]}</span>{providerLabels[provider]}</button>)}</div><div className="mapping-list">{architecture.nodes.map((node) => { const original = servicesById.get(node.data.serviceId), targetId = original?.equivalents?.[targets[0]]?.[0], candidate = servicesById.get(mapping[node.id] ?? targetId ?? ''); return <div className="mapping-row" key={node.id}><b>{node.data.label}</b><ArrowRight size={14} /><div><strong>{candidate?.shortName ?? 'Map manually'}</strong><small>{candidate ? 'Similar capability · verify settings' : 'No direct equivalent in registry'}</small></div>{candidate && <select aria-label={`Map ${node.data.label}`} value={mapping[node.id] ?? candidate.id} onChange={(event) => setMapping((current) => ({ ...current, [node.id]: event.target.value }))}>{[candidate.id, ...(original?.equivalents?.[targets[0]] ?? []).filter((id) => id !== candidate.id)].map((id) => <option key={id} value={id}>{servicesById.get(id)?.shortName}</option>)}</select>}</div> })}</div><div className="dialog-footer"><span>Unmapped services remain flagged.</span><button className="primary-button" onClick={() => { const updated = architecture.nodes.map((node) => { if (!targets.length || targets.includes(node.data.provider)) return node; const source = servicesById.get(node.data.serviceId), target = servicesById.get(mapping[node.id] ?? source?.equivalents?.[targets[0]]?.[0] ?? ''); return target ? { ...node, id: `${target.id}-${crypto.randomUUID()}`, position: { ...node.position, x: node.position.x + 70 }, data: { ...node.data, serviceId: target.id, provider: target.provider, category: target.category, label: target.shortName, status: 'warning' as const } } : { ...node, data: { ...node.data, status: 'warning' as const, label: `${node.data.label} · map manually` } } }); useWorkspace.getState().replaceArchitecture({ nodes: updated, edges: architecture.edges.map((edge) => ({ ...edge, source: updated.find((node) => node.id === edge.source)?.id ?? edge.source, target: updated.find((node) => node.id === edge.target)?.id ?? edge.target })) }); targets.forEach((entry) => { if (!useWorkspace.getState().selectedProviders.includes(entry)) useWorkspace.getState().toggleProvider(entry) }); close(); toast('Conversion draft created. Review proposed and unresolved mappings.') }}><ArrowLeftRight size={15} /> Create draft</button></div></section></div>
  if (type === 'projects') return <ProjectsDialog close={close} onImport={onImport} onExport={onExport} onNavigate={onNavigate} toast={toast} />
  return null
}

function App() { return <AppWorkspace /> }
export default App