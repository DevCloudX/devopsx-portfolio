import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Activity, ArrowLeftRight, ArrowRight, BadgeCheck, Blocks, Boxes, Braces, Check, ChevronDown, CircleHelp, Cloud, Code2, Copy, Database, Download, FileCode2, FileJson, FileText, Gauge, GitBranch, Globe2, HardDrive, HeartPulse, Layers3, LockKeyhole, Menu, Moon, Network, PanelRightClose, Plus, Search, Settings2, Shield, ShieldAlert, ShieldCheck, Sun, X, Zap } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cloudServices, categoryLabels, providerLabels, servicesById } from './data/clouds'
import { architectureTemplates, estimateMonthlyCost, redactCredentialText, scoreFindings, templateArchitecture, validateArchitecture } from './engine/architecture'
import { generateDocumentation, generateHelm, generateKubernetes, generateTerraform } from './engine/generators'
import { parseArchitecture, parseProject } from './engine/schema'
import { saveWorkspaceLocally, useWorkspace } from './state/workspace'
import type { Architecture, CloudProvider, CloudService, Finding, Project, ServiceCategory } from './types'
import '@xyflow/react/dist/style.css'

type View = 'Home' | 'Design' | 'Templates' | 'Compare' | 'Cost' | 'Security' | 'Generate'
type Modal = 'search' | 'projects' | 'ai' | 'convert' | 'help' | 'more' | null
type GeneratorKind = 'Terraform' | 'Kubernetes' | 'Helm' | 'Documentation'
const moduleViews: View[] = ['Design', 'Templates', 'Compare', 'Cost']
const routableViews: View[] = [...moduleViews, 'Security', 'Generate']
const providers: CloudProvider[] = ['aws', 'azure', 'gcp']
const Canvas = lazy(() => import('./Canvas'))
const providerMark: Record<CloudProvider, string> = { aws: 'A', azure: '◧', gcp: 'G' }
const categoryIcons: Record<string, typeof Cloud> = { compute: Zap, storage: HardDrive, database: Database, networking: Network, containers: Boxes, security: Shield, integration: GitBranch, analytics: Activity, 'ai-ml': Blocks, devtools: Code2, monitoring: Gauge, management: Settings2, migration: ArrowLeftRight, cost: Gauge, iot: Globe2, media: Layers3 }

function viewFromHash(): View {
  const route = window.location.hash.slice(1).toLowerCase()
  if (route === 'home') return 'Home'
  return route ? routableViews.find((item) => item.toLowerCase() === route) ?? 'Home' : 'Home'
}

function LandingView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const areas: { name: View; description: string; icon: typeof Layers3 }[] = [
    { name: 'Design', description: 'Compose cloud systems visually.', icon: Layers3 },
    { name: 'Templates', description: 'Start from a reusable architecture.', icon: Blocks },
    { name: 'Compare', description: 'Explore equivalent cloud services.', icon: ArrowLeftRight },
    { name: 'Cost', description: 'Review illustrative cost estimates.', icon: Gauge },
  ]
  return (
    <div className="landing-page">
      <main className="landing-main">
        <section className="landing-hero">
        <div className="landing-copy">
          <div className="landing-kicker"><span /> MULTI-CLOUD ARCHITECTURE STUDIO</div>
          <h1>Make your cloud<br /><span>architecture</span> make sense.</h1>
          <p>Map services across AWS, Azure, and Google Cloud. Review your design and explore illustrative cost estimates—all in one workspace.</p>
          <div className="landing-actions">
            <button className="primary-button landing-primary" onClick={() => onNavigate('Design')}>Start designing <ArrowRight size={16} /></button>
            <button className="secondary-button landing-secondary" onClick={() => onNavigate('Templates')}>Explore templates</button>
          </div>
          <div className="landing-proof"><span><i /> AWS</span><span><i /> Azure</span><span><i /> Google Cloud</span><small>One workspace. Your browser.</small></div>
        </div>
        <div className="landing-art" aria-label="Animated illustration of connected cloud services" role="img">
          <div className="art-topline"><span><i /> SYSTEM MAP</span><b><Cloud size={12} /> 3 CLOUDS</b></div>
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <svg className="art-connections" viewBox="0 0 600 440" aria-hidden="true">
            <path className="connection-line" d="M300 220 165 105M300 220 440 105M300 220 155 330M300 220 450 330M165 105 440 105M155 330 450 330" />
            <path className="connection-signal signal-one" d="M300 220 165 105" />
            <path className="connection-signal signal-two" d="M300 220 440 105" />
            <path className="connection-signal signal-three" d="M300 220 155 330" />
            <path className="connection-signal signal-four" d="M300 220 450 330" />
            <circle className="art-pulse pulse-one" cx="232" cy="163" r="4" /><circle className="art-pulse pulse-two" cx="369" cy="162" r="4" /><circle className="art-pulse pulse-three" cx="226" cy="274" r="4" /><circle className="art-pulse pulse-four" cx="376" cy="276" r="4" />
          </svg>
          <div className="art-center"><span className="art-center-mark"><i /><i /><i /></span><b>Your architecture</b><small>DESIGN · VALIDATE · PLAN</small></div>
          <div className="art-card art-aws"><span className="art-provider aws">A</span><div><b>Compute</b><small>Amazon Web Services</small></div><i className="art-status" /></div>
          <div className="art-card art-azure"><span className="art-provider azure">◧</span><div><b>Networking</b><small>Microsoft Azure</small></div><i className="art-status" /></div>
          <div className="art-card art-gcp"><span className="art-provider gcp">G</span><div><b>Data platform</b><small>Google Cloud</small></div><i className="art-status" /></div>
          <div className="art-caption"><span className="art-caption-dot" /> A clearer view of what you're building</div>
        </div>
        </section>
        <section className="landing-areas" aria-labelledby="landing-areas-title">
        <div className="landing-section-heading"><div><span className="eyebrow">FROM FIRST SKETCH TO COST ESTIMATES</span><h2 id="landing-areas-title">Everything around your architecture.</h2></div><span>Pick a place to begin <ArrowRight size={14} /></span></div>
        <div className="landing-area-grid">{areas.map(({ name, description, icon: Icon }) => <button className="landing-area-card" key={name} onClick={() => onNavigate(name)}><span className="landing-area-icon"><Icon size={17} /></span><b>{name}</b><small>{description}</small><ArrowRight className="landing-area-arrow" size={15} /></button>)}</div>
          <div className="landing-footnote"><LockKeyhole size={13} /> Your workspace runs locally in this browser. Nothing is deployed to your cloud.</div>
        </section>
      </main>
      <footer className="landing-footer">
        <a className="landing-footer-brand" href="/" aria-label="DevOpsX home">
          <span className="brand-symbol"><i /><i /><i /></span>
          <span><b>DevOpsX</b><small>ARCHITECTURE STUDIO</small></span>
        </a>
        <nav className="landing-footer-nav" aria-label="Footer navigation">
          {moduleViews.map((area) => <a key={area} href={`#${area.toLowerCase()}`}>{area}</a>)}
        </nav>
        <span className="landing-footer-note"><LockKeyhole size={13} /> Runs locally in your browser</span>
      </footer>
    </div>
  )
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

const Catalog = memo(function Catalog({ onAdd }: { onAdd: (service: CloudService) => void }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ServiceCategory | 'all'>('all')
  const scrollRef = useRef<HTMLDivElement>(null)
  const active = useWorkspace((state) => state.selectedProviders)
  const activeServices = useMemo(() => cloudServices.filter((service) => active.includes(service.provider)), [active])
  const categoryCounts = useMemo(() => {
    const counts = new Map<ServiceCategory, number>()
    for (const service of activeServices) counts.set(service.category, (counts.get(service.category) ?? 0) + 1)
    return counts
  }, [activeServices])
  const categories = [...categoryCounts.keys()]
  const query = search.toLowerCase()
  const results = useMemo(() => activeServices.filter((service) => (category === 'all' || category === service.category) && `${service.name} ${service.description} ${service.category} ${service.provider}`.toLowerCase().includes(query)), [activeServices, category, query])
  // oxlint-disable-next-line react/incompatible-library
  const list = useVirtualizer({ count: results.length, getScrollElement: () => scrollRef.current, estimateSize: () => 58, overscan: 7, initialRect: { width: 240, height: 300 } })
  const virtualRows = list.getVirtualItems()
  const renderedRows = virtualRows.length ? virtualRows : results.map((_, index) => ({ index, start: index * 58, size: 58 }))
  const totalSize = Math.max(list.getTotalSize(), results.length * 58)
  return <aside className="catalog-panel"><div className="panel-heading"><div><span className="eyebrow">BUILD</span><h2>Service catalog</h2></div></div><div className="provider-selector"><div className="section-label">CLOUD PROVIDERS <small>{active.length} active</small></div><div className="provider-toggles">{providers.map((provider) => <button key={provider} aria-pressed={active.includes(provider)} className={`provider-toggle ${provider}${active.includes(provider) ? ' active' : ''}`} onClick={() => useWorkspace.getState().toggleProvider(provider)}><span className="provider-mark">{providerMark[provider]}</span>{providerLabels[provider]}{active.includes(provider) && <Check size={12} />}</button>)}</div><div className="catalog-count">{activeServices.length} catalog entries</div></div><label className="field-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a service..." aria-label="Search cloud services" /><kbd>/</kbd></label><div className="category-list"><button className={`category${category === 'all' ? ' active' : ''}`} onClick={() => setCategory('all')}><Blocks size={15} /><span>All services</span><b>{activeServices.length}</b></button>{categories.map((item) => { const Icon = categoryIcons[item] ?? Cloud; return <button key={item} className={`category${category === item ? ' active' : ''}`} onClick={() => setCategory(item)}><Icon size={15} /><span>{categoryLabels[item] ?? item}</span><b>{categoryCounts.get(item)}</b></button> })}</div><div className="catalog-results-head"><span>{search ? `${results.length} RESULTS` : 'POPULAR SERVICES'}</span><Blocks size={13} /></div><div className="service-list" ref={scrollRef}><div style={{ height: totalSize, position: 'relative' }}>{renderedRows.map((row) => { const service = results[row.index]; const Icon = categoryIcons[service.category] ?? Cloud; return <button key={service.id} className="service-row" draggable style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: row.size, transform: `translateY(${row.start}px)` }} onDragStart={(event) => event.dataTransfer.setData('application/devopsx-service', service.id)} onClick={() => onAdd(service)} title={`Add ${service.shortName}`}><span className={`service-icon ${service.provider}`}><Icon size={15} /></span><span className="service-copy"><b>{service.shortName}</b><small>{service.description}</small></span><Plus className="service-add" size={15} /></button> })}{!results.length && <div className="empty-results">No services found.</div>}</div></div><div className="catalog-footer"><span>Extensible service registry</span><b>{cloudServices.length} total</b></div></aside>
})

const Properties = memo(function Properties({ onRecommend, notify }: { onRecommend: (service: CloudService) => void; notify: (message: string, type?: 'success' | 'error') => void }) {
  const node = useWorkspace((state) => state.nodes.find((entry) => entry.id === state.selectedNodeId))
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
})

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
  const baseEstimate = useMemo(() => estimateMonthlyCost(architecture), [architecture])
  const resilienceMultiplier = { single: 1, 'multi-az': 1.35, 'multi-region': 2 }[resilience]
  const scenarioMultiplier = Number(traffic) * resilienceMultiplier
  const estimate = useMemo(() => ({
    total: baseEstimate.total * scenarioMultiplier,
    breakdown: Object.fromEntries(Object.entries(baseEstimate.breakdown).map(([label, amount]) => [label, amount * scenarioMultiplier])),
  }), [baseEstimate, scenarioMultiplier])
  return (
    <div className="module-view">
      <Heading eyebrow="CAPACITY PLANNING" title="Cost estimate" sub="Illustrative estimate, not live cloud pricing. Validate with your provider's current quote." />
      {!architecture.nodes.length && <div className="empty-results cost-empty" role="status">Add resources in Design to estimate monthly costs.</div>}
      <div className="cost-total">
        <div><span>ESTIMATED MONTHLY COST</span><b>${Math.round(estimate.total).toLocaleString()}</b><small>{architecture.nodes.length} modeled resources</small></div>
        <span className="estimate-tag">Illustrative only</span>
      </div>
      <div className="cost-provider-grid">{providers.map((provider) => {
        const providerTotal = baseEstimate.total * ({ aws: 1, azure: 1.035, gcp: 0.965 }[provider]) * scenarioMultiplier
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
      const { default: JSZip } = await import('jszip')
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
  const nodes = useWorkspace((state) => state.nodes), analysisNodes = useWorkspace((state) => state.analysisNodes), edges = useWorkspace((state) => state.edges), theme = useWorkspace((state) => state.theme), projectName = useWorkspace((state) => state.projectName), selected = useWorkspace((state) => state.selectedProviders), selectedId = useWorkspace((state) => state.selectedNodeId)
  const architecture = useMemo<Architecture>(() => ({ nodes, edges }), [nodes, edges])
  const analysisArchitecture = useMemo<Architecture>(() => ({ nodes: analysisNodes, edges }), [analysisNodes, edges])
  const findings = useMemo(() => validateArchitecture(analysisArchitecture), [analysisArchitecture])
  const health = useMemo(() => scoreFindings(findings), [findings])
  const monthlyEstimate = useMemo(() => estimateMonthlyCost(analysisArchitecture).total, [analysisArchitecture])
  const notify = useCallback((message: string, type: 'success' | 'error' = 'success') => { setToast(message); setToastType(type) }, [])
  const navigateView = (next: View) => {
    setView(next)
    const hash = next === 'Home' ? '' : `#${next.toLowerCase()}`
    if (window.location.hash !== hash) window.location.hash = hash
  }
  useEffect(() => {
    const syncView = () => {
      const route = window.location.hash.slice(1).toLowerCase()
      const next = viewFromHash()
      if (route && route !== 'home' && !routableViews.some((item) => item.toLowerCase() === route)) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
      setView(next)
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
  }, [nodes, edges, theme, projectName, selected, notify])
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
  const addService = useCallback((service: CloudService) => { const id = useWorkspace.getState().addService(service, { x: 110 + Math.random() * 250, y: 80 + Math.random() * 240 }); useWorkspace.getState().selectNode(id); if (service.recommendedWith.length) setSuggest(service); setMobilePanel('canvas') }, [])
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

  const center = view === 'Design' ? <Suspense fallback={<section className="canvas-panel" role="status">Loading architecture canvas…</section>}><Canvas notify={notify} /></Suspense> : view === 'Templates' ? <TemplatesView onLoad={loadTemplate} /> : view === 'Compare' ? <CompareView /> : view === 'Cost' ? <CostView architecture={analysisArchitecture} selected={selected} /> : view === 'Security' ? <SecurityView findings={findings} hasResources={analysisArchitecture.nodes.length > 0} onFix={fixFinding} /> : view === 'Generate' ? <GenerateView architecture={architecture} name={projectName} selected={selected} notify={notify} /> : null
  return (
    <div className={`app-shell${view === 'Home' ? ' landing-shell' : ''}`}>
      <header className="topbar">
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigateView('Home') }} aria-label="DevOpsX home" aria-current={view === 'Home' ? 'page' : undefined}>
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
          <span className="avatar" title="Workspace stored in this browser" aria-label="Workspace stored in this browser"><HardDrive size={15} /></span>
        </div>
      </header>
      {view !== 'Home' && <div className="project-strip">
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
      </div>}
      {view === 'Home' ? <LandingView onNavigate={navigateView} /> : <div className={`workspace-grid mobile-${mobilePanel}`}>
        <Catalog onAdd={addService} />
        <main className="workspace-main">
          {center}
          <div className="bottom-insights">
            <div className="insight-health"><span className="health-ring"><HeartPulse size={14} /></span><span><b>Architecture health</b><small>{findings.length} findings to review</small></span><span className="health-value">{Math.round(Object.values(health).reduce((sum, score) => sum + score, 0) / 4)}<small>/100</small></span></div>
            <div className="insight-score-list">{Object.entries(health).filter(([label]) => label !== 'Security').map(([label, score]) => <span className="insight-score" key={label}><span>{label}</span><b>{score}</b></span>)}</div>
            <button className="bottom-cost" onClick={() => navigateView('Cost')}><span>MONTHLY ESTIMATE</span><b>${Math.round(monthlyEstimate).toLocaleString()}<small> / mo</small></b><ArrowRight size={14} /></button>
          </div>
        </main>
        <Properties onRecommend={addService} notify={notify} />
      </div>}
      {view !== 'Home' && <nav className="mobile-nav" aria-label="Mobile workspace navigation">
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
      </nav>}
      {toast && <div className={`app-toast ${toastType}`} role={toastType === 'error' ? 'alert' : 'status'}>{toastType === 'error' ? <ShieldAlert size={15} /> : <Check size={15} />}{toast}<button onClick={() => setToast('')} aria-label="Dismiss"><X size={13} /></button></div>}
      {modal && modal !== 'more' && modal !== 'help' && <WorkspaceModal type={modal} close={() => setModal(null)} search={search} setSearch={setSearch} onTemplate={loadTemplate} onImport={() => fileRef.current?.click()} onExport={exportJson} onAI={generateAI} onNavigate={navigateView} prompt={prompt} setPrompt={setPrompt} aiProvider={aiProvider} setAiProvider={setAiProvider} architecture={architecture} selected={selected} toast={notify} />}
      {modal === 'help' && <HelpDialog onClose={() => setModal(null)} />}
      {modal === 'more' && <MoreDialog onClose={() => setModal(null)} onSelect={(destination) => { navigateView(destination); setMobilePanel('canvas'); setModal(null) }} />}
      {suggest && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSuggest(null) }}><section className="dialog recommendation-dialog" role="dialog" aria-modal="true" aria-labelledby="recommend-title"><div className="dialog-head"><div><span className="eyebrow">ARCHITECTURE PATTERN</span><h2 id="recommend-title">Build around {suggest.shortName}</h2></div><button className="icon-button" onClick={() => setSuggest(null)} aria-label="Close"><X size={17} /></button></div><p>Common companion services registered for this resource.</p><div className="suggestion-chips">{suggest.recommendedWith.map((id) => { const service = servicesById.get(id); if (!service) return null; const Icon = categoryIcons[service.category] ?? Cloud; return <button key={id} onClick={() => { const added = useWorkspace.getState().addService(service); useWorkspace.getState().selectNode(added); setSuggest(null) }}><Icon size={14} />{service.shortName}<Plus size={13} /></button> })}</div><div className="dialog-footer"><span>Starting points, not mandatory dependencies.</span><button className="primary-button" onClick={() => setSuggest(null)}>Done</button></div></section></div>}
    </div>
  )
}

function MoreDialog({ onClose, onSelect }: { onClose: () => void; onSelect: (view: View) => void }) {
  const icons: Record<string, typeof Layers3> = { Design: Layers3, Templates: Blocks, Compare: ArrowLeftRight, Cost: Gauge }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="dialog more-dialog" role="dialog" aria-modal="true" aria-labelledby="more-title"><div className="dialog-head"><div><span className="eyebrow">WORKSPACE</span><h2 id="more-title">Explore DevOpsX</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={17} /></button></div><div className="more-view-list">{moduleViews.map((view) => { const Icon = icons[view]; return <button key={view} onClick={() => onSelect(view)}><span><Icon size={16} /></span><b>{view}</b><ArrowRight size={14} /></button> })}</div></section></div>
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="dialog help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <div className="dialog-head">
          <div className="help-title-group">
            <span className="help-title-icon"><Layers3 size={18} /></span>
            <div><span className="eyebrow">QUICK GUIDE</span><h2 id="help-title">Working with DevOpsX</h2></div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close help"><X size={17} /></button>
        </div>
        <div className="help-content">
          <div className="help-intro"><ShieldCheck size={17} /><p>Build and review a local architecture. Nothing is deployed and no cloud credentials are requested.</p></div>
          <ol className="help-steps">
            <li><span>01</span><div><b>Build your architecture</b><p>Add services from the catalog or choose an architecture template.</p></div></li>
            <li><span>02</span><div><b>Connect and configure</b><p>Drag between node handles, then set regions and capacity in Properties.</p></div></li>
            <li><span>03</span><div><b>Review your design</b><p>Check your architecture health and explore illustrative cost scenarios.</p></div></li>
            <li><span>04</span><div><b>Save or export</b><p>Save in this browser or export a JSON backup before sharing your design.</p></div></li>
          </ol>
          <div className="help-shortcut-section">
            <span className="help-shortcut-title">KEYBOARD SHORTCUTS</span>
            <div className="help-shortcuts">
              <div><span><kbd>Ctrl</kbd><i>/</i><kbd>⌘</kbd><b>+</b><kbd>K</kbd></span><small>Search services</small></div>
              <div><span><kbd>Esc</kbd></span><small>Close dialogs</small></div>
              <div><span><kbd>Ctrl</kbd><i>/</i><kbd>⌘</kbd><b>+</b><kbd>Z</kbd></span><small>Undo</small></div>
            </div>
          </div>
        </div>
        <div className="dialog-footer"><span><LockKeyhole size={13} /> Changes stay in this browser.</span><button className="primary-button" onClick={onClose}>Got it</button></div>
      </section>
    </div>
  )
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