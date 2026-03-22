import React, { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faScaleBalanced,
    faTriangleExclamation,
    faTemperatureHigh,
    faBan,
    faClock,
    faCircleCheck,
    faMagnifyingGlass,
    faLocationDot,
    faUser,
    faClipboardList,
    faBell,
    faFileLines,
    faSpinner,
    faFlask
} from '@fortawesome/free-solid-svg-icons'
import apiService from '../services/apiService'

export default function RegulatorView() {
    const [summary, setSummary] = useState(null)
    const [qualityAlerts, setQualityAlerts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [recallProductId, setRecallProductId] = useState('')
    const [simulating, setSimulating] = useState(false)
    const [simulationResult, setSimulationResult] = useState(null)
    const [traceabilityRecords, setTraceabilityRecords] = useState([])
    const [traceabilityLoading, setTraceabilityLoading] = useState(false)
    const [traceabilityFilters, setTraceabilityFilters] = useState({
        stage: '',
        location: '',
        startDate: '',
        endDate: ''
    })
    const [lifecycleForm, setLifecycleForm] = useState({
        productId: '',
        stage: 'Inspection',
        location: '',
        temperature: '6',
        humidity: '80',
        notes: '',
        certificationName: '',
        certificationIssuer: '',
        certificationUrl: ''
    })
    const [lifecycleSubmitting, setLifecycleSubmitting] = useState(false)

    useEffect(() => {
        loadRegulatoryData()
        loadTraceabilityRecords()
    }, [])

    const loadRegulatoryData = async () => {
        setLoading(true)
        setError(null)
        try {
            const [summaryData, alertsData] = await Promise.all([
                apiService.getRegulatorySummary(),
                apiService.getQualityAlerts()
            ])
            setSummary(summaryData)
            setQualityAlerts(Array.isArray(alertsData) ? alertsData : [])
        } catch (fetchError) {
            setError(fetchError.message || 'Failed to load regulatory data')
        } finally {
            setLoading(false)
        }
    }

    const loadTraceabilityRecords = async (filters = traceabilityFilters) => {
        setTraceabilityLoading(true)
        try {
            const data = await apiService.getAdminTraceability(filters)
            setTraceabilityRecords(Array.isArray(data) ? data : [])
        } catch (traceError) {
            setError(traceError.message || 'Failed to load traceability records')
            setTraceabilityRecords([])
        } finally {
            setTraceabilityLoading(false)
        }
    }

    const alertCards = useMemo(() => {
        return qualityAlerts.slice(0, 5).map((product) => ({
            title: product.qualityScore !== null && product.qualityScore < 60
                ? 'Low Quality Score'
                : 'Temperature Excursion',
            productId: product.productId,
            subtitle: product.productName,
            severity: product.qualityScore !== null && product.qualityScore < 60 ? 'warning' : 'danger'
        }))
    }, [qualityAlerts])

    const handleSimulateRecall = async () => {
        if (!recallProductId.trim()) return

        setSimulating(true)
        setError(null)
        setSimulationResult(null)
        try {
            const data = await apiService.simulateRecall(recallProductId.trim())
            setSimulationResult(data)
        } catch (simulationError) {
            setError(simulationError.message || 'Recall simulation failed')
        } finally {
            setSimulating(false)
        }
    }

    const handleLifecycleSubmit = async (event) => {
        event.preventDefault()
        if (!lifecycleForm.productId || !lifecycleForm.location) {
            setError('Product ID and location are required for lifecycle logging')
            return
        }

        setLifecycleSubmitting(true)
        setError(null)
        try {
            const certification = lifecycleForm.certificationName
                ? {
                    name: lifecycleForm.certificationName,
                    issuer: lifecycleForm.certificationIssuer,
                    documentUrl: lifecycleForm.certificationUrl
                }
                : null

            await apiService.trackSupplyChainEvent(Number(lifecycleForm.productId), {
                stage: lifecycleForm.stage,
                location: lifecycleForm.location,
                handler: 'admin-regulator',
                handlerRole: 'Regulator',
                conditions: {
                    temperature: Number(lifecycleForm.temperature),
                    humidity: Number(lifecycleForm.humidity)
                },
                notes: lifecycleForm.notes,
                certification
            })

            setLifecycleForm((current) => ({
                ...current,
                productId: '',
                location: '',
                notes: '',
                certificationName: '',
                certificationIssuer: '',
                certificationUrl: ''
            }))

            await Promise.all([loadRegulatoryData(), loadTraceabilityRecords()])
        } catch (submitError) {
            setError(submitError.message || 'Failed to append lifecycle event')
        } finally {
            setLifecycleSubmitting(false)
        }
    }

    const handleIotSimulation = async () => {
        if (!lifecycleForm.productId) {
            setError('Enter product ID to simulate IoT telemetry')
            return
        }

        setLifecycleSubmitting(true)
        setError(null)
        try {
            await apiService.simulateIotLog(Number(lifecycleForm.productId), {
                stage: lifecycleForm.stage,
                location: lifecycleForm.location || 'Transit Node',
                handler: 'iot-simulator',
                handlerRole: 'System'
            })

            await Promise.all([loadRegulatoryData(), loadTraceabilityRecords()])
        } catch (simulationError) {
            setError(simulationError.message || 'IoT simulation failed')
        } finally {
            setLifecycleSubmitting(false)
        }
    }

    const complianceRate = summary?.complianceRate ?? 0
    const totals = summary?.totals || {
        totalProducts: 0,
        activeProducts: 0,
        alertCount: 0,
        criticalEvents: 0
    }

    return (
        <div>
            <div className="card-header">
                <h2><FontAwesomeIcon icon={faScaleBalanced} /> Regulatory Compliance Dashboard</h2>
                <p>Monitor compliance, investigate alerts, and run targeted recall simulations</p>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                    {error}
                </div>
            )}

            <div className="grid grid-2" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}><FontAwesomeIcon icon={faTriangleExclamation} /> Active Alerts</h3>
                    </div>
                    <div className="stat-card" style={{ marginBottom: '1.5rem' }}>
                        <div className="label">Alert Count</div>
                        <div className="value">{loading ? '...' : totals.alertCount}</div>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {alertCards.length > 0 ? alertCards.map((alert) => (
                            <div
                                key={`${alert.productId}-${alert.title}`}
                                style={{
                                    padding: '0.75rem',
                                    background: alert.severity === 'danger' ? 'rgba(255, 69, 0, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                                    border: alert.severity === 'danger' ? '1px solid rgba(255, 69, 0, 0.3)' : '1px solid rgba(255, 170, 0, 0.3)',
                                    borderRadius: '8px'
                                }}
                            >
                                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: alert.severity === 'danger' ? 'var(--danger)' : 'var(--warning)' }}>
                                    <FontAwesomeIcon icon={alert.severity === 'danger' ? faTemperatureHigh : faBan} /> {alert.title}
                                </p>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Product #{alert.productId} - {alert.subtitle}
                                </p>
                            </div>
                        )) : (
                            <div style={{ padding: '0.75rem', background: 'rgba(0, 255, 136, 0.08)', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: '8px' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)' }}>
                                    <FontAwesomeIcon icon={faCircleCheck} /> No active alerts
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}><FontAwesomeIcon icon={faCircleCheck} /> Compliance Status</h3>
                    </div>
                    <div className="grid grid-2" style={{ gap: '1rem' }}>
                        <div className="stat-card">
                            <div className="label">Verified</div>
                            <div className="value">{loading ? '...' : (totals.activeProducts - totals.alertCount)}<span style={{ fontSize: '0.6em' }}>/{totals.activeProducts}</span></div>
                        </div>
                        <div className="stat-card">
                            <div className="label">Compliance Rate</div>
                            <div className="value" style={{ fontSize: '1.5rem' }}>{complianceRate}<span style={{ fontSize: '0.5em' }}>%</span></div>
                        </div>
                        <div className="stat-card">
                            <div className="label">Critical Events</div>
                            <div className="value">{loading ? '...' : totals.criticalEvents}</div>
                        </div>
                        <div className="stat-card">
                            <div className="label">Status</div>
                            <div style={{ marginTop: '0.75rem' }}>
                                <span className={`badge badge-${complianceRate >= 85 ? 'success' : complianceRate >= 65 ? 'warning' : 'danger'}`}>
                                    <FontAwesomeIcon icon={faCircleCheck} /> {complianceRate >= 85 ? 'Operational' : 'Needs Attention'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                    <h3 style={{ margin: 0 }}><FontAwesomeIcon icon={faMagnifyingGlass} /> Anomaly Detection System</h3>
                </div>
                <div className="grid grid-2" style={{ marginTop: '1.5rem', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--primary)' }}><FontAwesomeIcon icon={faTemperatureHigh} /> Temperature Validation</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Detects impossible readings and excursions</p>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--primary)' }}><FontAwesomeIcon icon={faLocationDot} /> Location Consistency</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Flags implausible routes and movements</p>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--primary)' }}><FontAwesomeIcon icon={faUser} /> Handler Verification</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Validates authorized transfers</p>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--primary)' }}><FontAwesomeIcon icon={faClock} /> Temporal Analysis</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Checks timing inconsistencies</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                    <h3 style={{ margin: 0 }}><FontAwesomeIcon icon={faClipboardList} /> Admin Lifecycle Event Logger</h3>
                    <p>Capture inspection, processing, packaging and logistics milestones with immutable records.</p>
                </div>

                <form onSubmit={handleLifecycleSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                    <div className="grid grid-2" style={{ gap: '1rem' }}>
                        <input
                            type="number"
                            placeholder="Product ID"
                            value={lifecycleForm.productId}
                            onChange={(event) => setLifecycleForm({ ...lifecycleForm, productId: event.target.value })}
                            min="1"
                            required
                        />
                        <select
                            value={lifecycleForm.stage}
                            onChange={(event) => setLifecycleForm({ ...lifecycleForm, stage: event.target.value })}
                        >
                            {['Cultivation', 'Harvesting', 'Processing', 'Inspection', 'Warehouse Storage', 'Packaging/Bottling', 'Distribution', 'Retail', 'Consumer'].map((stage) => (
                                <option key={stage} value={stage}>{stage}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Location"
                            value={lifecycleForm.location}
                            onChange={(event) => setLifecycleForm({ ...lifecycleForm, location: event.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Notes"
                            value={lifecycleForm.notes}
                            onChange={(event) => setLifecycleForm({ ...lifecycleForm, notes: event.target.value })}
                        />
                        <input
                            type="number"
                            step="0.1"
                            placeholder="Temperature"
                            value={lifecycleForm.temperature}
                            onChange={(event) => setLifecycleForm({ ...lifecycleForm, temperature: event.target.value })}
                        />
                        <input
                            type="number"
                            step="0.1"
                            placeholder="Humidity"
                            value={lifecycleForm.humidity}
                            onChange={(event) => setLifecycleForm({ ...lifecycleForm, humidity: event.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Certification Name"
                            value={lifecycleForm.certificationName}
                            onChange={(event) => setLifecycleForm({ ...lifecycleForm, certificationName: event.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Certification Issuer"
                            value={lifecycleForm.certificationIssuer}
                            onChange={(event) => setLifecycleForm({ ...lifecycleForm, certificationIssuer: event.target.value })}
                        />
                    </div>

                    <input
                        type="text"
                        placeholder="Certification Document URL"
                        value={lifecycleForm.certificationUrl}
                        onChange={(event) => setLifecycleForm({ ...lifecycleForm, certificationUrl: event.target.value })}
                    />

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" type="submit" disabled={lifecycleSubmitting}>
                            {lifecycleSubmitting ? <><FontAwesomeIcon icon={faSpinner} spin /> Logging...</> : 'Log Lifecycle Event'}
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={handleIotSimulation} disabled={lifecycleSubmitting}>
                            Simulate IoT Reading
                        </button>
                    </div>
                </form>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                    <h3 style={{ margin: 0 }}><FontAwesomeIcon icon={faFileLines} /> Traceability Explorer</h3>
                    <p>Filter timeline by stage, date and location for audit/compliance investigation.</p>
                </div>

                <div className="grid grid-2" style={{ marginTop: '1rem', gap: '1rem' }}>
                    <select
                        value={traceabilityFilters.stage}
                        onChange={(event) => setTraceabilityFilters({ ...traceabilityFilters, stage: event.target.value })}
                    >
                        <option value="">All Stages</option>
                        {['Cultivation', 'Harvesting', 'Processing', 'Inspection', 'Warehouse Storage', 'Packaging/Bottling', 'Distribution', 'Retail', 'Consumer'].map((stage) => (
                            <option key={stage} value={stage}>{stage}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Location filter"
                        value={traceabilityFilters.location}
                        onChange={(event) => setTraceabilityFilters({ ...traceabilityFilters, location: event.target.value })}
                    />
                    <input
                        type="date"
                        value={traceabilityFilters.startDate}
                        onChange={(event) => setTraceabilityFilters({ ...traceabilityFilters, startDate: event.target.value })}
                    />
                    <input
                        type="date"
                        value={traceabilityFilters.endDate}
                        onChange={(event) => setTraceabilityFilters({ ...traceabilityFilters, endDate: event.target.value })}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => loadTraceabilityRecords()} disabled={traceabilityLoading}>
                        {traceabilityLoading ? <><FontAwesomeIcon icon={faSpinner} spin /> Loading...</> : 'Apply Filters'}
                    </button>
                </div>

                <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                    {traceabilityRecords.slice(0, 20).map((event) => (
                        <div key={event.eventId} className="product-card">
                            <p style={{ margin: 0 }}><strong>#{event.productId} {event.productName}</strong> ({event.stage})</p>
                            <p style={{ margin: 0 }}><strong>Location:</strong> {event.location} | <strong>Handler:</strong> {event.handlerRole}</p>
                            <p style={{ margin: 0 }}><strong>Temp/Humidity:</strong> {event.temperature} C / {event.humidity}% | <strong>Quality:</strong> {event.qualityStatus}</p>
                            <p style={{ margin: 0 }}><strong>Time:</strong> {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A'}</p>
                            {event.blockchainRecordId && <p style={{ margin: 0, wordBreak: 'break-all' }}><strong>Record ID:</strong> {event.blockchainRecordId}</p>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 style={{ margin: 0 }}><FontAwesomeIcon icon={faClipboardList} /> Recall Management Simulation</h3>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <input
                        type="number"
                        value={recallProductId}
                        onChange={(event) => setRecallProductId(event.target.value)}
                        placeholder="Enter contaminated Product ID"
                        style={{
                            width: '260px',
                            padding: '0.75rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text)',
                            fontSize: '0.95rem'
                        }}
                    />
                    <button className="btn btn-primary" onClick={handleSimulateRecall} disabled={simulating || !recallProductId.trim()}>
                        {simulating ? <><FontAwesomeIcon icon={faSpinner} spin /> Simulating...</> : <><FontAwesomeIcon icon={faFlask} /> Run Recall Simulation</>}
                    </button>
                    <button className="btn btn-secondary" onClick={loadRegulatoryData}>
                        <FontAwesomeIcon icon={faBell} /> Refresh Alerts
                    </button>
                    <button className="btn btn-secondary"><FontAwesomeIcon icon={faFileLines} /> Recall History</button>
                </div>

                {simulationResult && (
                    <div className="grid grid-2" style={{ marginTop: '1.5rem' }}>
                        <div className="stat-card">
                            <div className="label">Targeted Recall</div>
                            <div className="value">{simulationResult.blockchainTargetedRecall.affectedProductCount}</div>
                            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Lookup: {simulationResult.blockchainTargetedRecall.lookupTimeMs} ms
                            </p>
                        </div>
                        <div className="stat-card">
                            <div className="label">Traditional Recall</div>
                            <div className="value">{simulationResult.traditionalRecall.affectedProductCount}</div>
                            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Lookup: {simulationResult.traditionalRecall.lookupTimeMs} ms
                            </p>
                        </div>
                        <div className="stat-card">
                            <div className="label">Prevented Waste</div>
                            <div className="value">{simulationResult.impact.preventedWasteUnits}</div>
                        </div>
                        <div className="stat-card">
                            <div className="label">Exposure Reduction</div>
                            <div className="value">{simulationResult.impact.exposureReductionPct}%</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
