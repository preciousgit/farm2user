import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faBox,
    faMagnifyingGlass,
    faLink,
    faSeedling,
    faLightbulb,
    faTriangleExclamation,
    faCircleInfo
} from '@fortawesome/free-solid-svg-icons'
import apiService from '../services/apiService'

export default function ProductVerification() {
    const [productId, setProductId] = useState('')
    const [orderTrace, setOrderTrace] = useState(null)
    const [chainData, setChainData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [freshness, setFreshness] = useState(null)
    const [contamination, setContamination] = useState(null)

    const verifyProductById = async (idValue) => {
        setLoading(true)
        setError(null)
        setOrderTrace(null)
        setChainData(null)
        setFreshness(null)
        setContamination(null)

        try {
            const [traceData, blockData] = await Promise.all([
                apiService.getOrderTrace(idValue),
                apiService.getProductBlocks(idValue)
            ])
            setOrderTrace(traceData)
            setChainData(blockData)

            const freshnessData = await apiService.getFreshness(idValue)
            setFreshness(freshnessData.prediction)

            const contaminationData = await apiService.getContaminationRisk(idValue)
            setContamination(contaminationData.contamination_risk)
        } catch (err) {
            setError(err.message || 'Failed to fetch product data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        const queryProductId = searchParams.get('productId')
        if (queryProductId) {
            setProductId(queryProductId)
            verifyProductById(queryProductId)
        }
    }, [])

    const handleVerify = async (e) => {
        e.preventDefault()
        if (!productId) {
            setError('Please enter a product ID')
            return
        }

        await verifyProductById(productId)
    }

    return (
        <div>
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                    <h2><FontAwesomeIcon icon={faBox} /> Verify Product Authenticity</h2>
                    <p>Use product ID like an order number to verify authenticity, quality, and full distribution history.</p>
                </div>

                <form onSubmit={handleVerify} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <input
                            type="text"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            placeholder="Enter blockchain product ID..."
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
                        {loading ? 'Verifying...' : <><FontAwesomeIcon icon={faMagnifyingGlass} /> Verify</>}
                    </button>
                </form>

                {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
            </div>

            {loading && (
                <div className="card">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner"></div>
                        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Analyzing product data...</p>
                    </div>
                </div>
            )}

            {orderTrace && (
                <div className="grid grid-2">
                    <div className="card">
                        <div className="card-header">
                            <h3 style={{ margin: 0 }}><FontAwesomeIcon icon={faLink} /> Order Verification Record</h3>
                        </div>

                        <div className="stat-card" style={{ marginBottom: '1rem' }}>
                            <div className="label">Order / Product ID</div>
                            <div className="value">{orderTrace.orderSummary?.orderId}</div>
                        </div>

                        <div className="stat-card" style={{ marginBottom: '1rem' }}>
                            <div className="label">Current Lifecycle Status</div>
                            <div className="value" style={{ fontSize: '1.1rem' }}>{orderTrace.orderSummary?.orderStatus || 'In Progress'}</div>
                        </div>

                        <div className="stat-card" style={{ marginBottom: '1rem' }}>
                            <div className="label">Origin</div>
                            <div className="value" style={{ fontSize: '1rem' }}>{orderTrace.orderSummary?.origin?.farmLocation || 'Unknown'}</div>
                        </div>

                        <div className="stat-card" style={{ marginBottom: '1rem' }}>
                            <div className="label">Product Type</div>
                            <div className="value" style={{ fontSize: '1rem' }}>{orderTrace.orderSummary?.productType || 'General'}</div>
                        </div>

                        <div className="stat-card" style={{ marginBottom: '1rem' }}>
                            <div className="label">Batch Number</div>
                            <div className="value" style={{ fontSize: '1rem' }}>{orderTrace.orderSummary?.batchNumber || 'N/A'}</div>
                        </div>

                        <div className="stat-card">
                            <div className="label">Distribution Checkpoints</div>
                            <div className="value">{orderTrace.orderSummary?.checkpoints?.totalTransfers || 0}</div>
                        </div>

                        <div className="stat-card" style={{ marginTop: '1rem' }}>
                            <div className="label">Authenticity</div>
                            <span className={`badge badge-${orderTrace.authenticity?.hasBlockchainRegistration ? 'success' : 'danger'}`}>
                                {orderTrace.authenticity?.hasBlockchainRegistration ? 'Verified On Blockchain' : 'Verification Incomplete'}
                            </span>
                            {orderTrace.authenticity?.blockchainTxHash && (
                                <p style={{ marginTop: '0.6rem', marginBottom: 0, fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--text-muted)' }}>
                                    Tx: {orderTrace.authenticity.blockchainTxHash}
                                </p>
                            )}
                        </div>

                        {orderTrace.orderSummary?.productMeta?.qrCodeUrl && (
                            <div className="stat-card" style={{ marginTop: '1rem' }}>
                                <div className="label">QR Trace Code</div>
                                <img
                                    src={orderTrace.orderSummary.productMeta.qrCodeUrl}
                                    alt="Product QR"
                                    style={{ width: '120px', height: '120px', borderRadius: '8px', marginTop: '0.5rem' }}
                                />
                            </div>
                        )}

                        {chainData && (
                            <div className="stat-card" style={{ marginTop: '1rem' }}>
                                <div className="label">Blockchain Simulation</div>
                                <p style={{ margin: '0.5rem 0 0 0' }}>
                                    Blocks: <strong>{chainData.chainLength || 0}</strong>
                                </p>
                                <p style={{ margin: '0.35rem 0 0 0' }}>
                                    Chain Integrity: <strong>{chainData.isChainValid ? 'Valid' : 'Tampered'}</strong>
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        {freshness && (
                            <div className="card" style={{ marginBottom: '1.5rem' }}>
                                <div className="card-header">
                                    <h3 style={{ margin: 0 }}><FontAwesomeIcon icon={faSeedling} /> Freshness Prediction</h3>
                                </div>

                                <div className="stat-card" style={{ marginBottom: '1rem', background: 'rgba(0, 255, 136, 0.1)' }}>
                                    <div className="label">Freshness Score</div>
                                    <div className="value" style={{ fontSize: '2.8rem' }}>
                                        {freshness.freshness_score.toFixed(0)}
                                    </div>
                                </div>

                                <div className="stat-card" style={{ marginBottom: '1rem' }}>
                                    <div className="label">Shelf Life Remaining</div>
                                    <div className="value" style={{ fontSize: '1.5rem' }}>
                                        {freshness.remaining_shelf_life_days?.toFixed(1)} days
                                    </div>
                                </div>

                                <div className="stat-card" style={{ marginBottom: '1rem' }}>
                                    <div className="label">Quality Status</div>
                                    <span className={`badge badge-${freshness.freshness_level === 'Fresh' ? 'success' :
                                        freshness.freshness_level === 'Good' ? 'info' :
                                            freshness.freshness_level === 'Acceptable' ? 'warning' : 'danger'
                                        }`}>
                                        {freshness.freshness_level}
                                    </span>
                                </div>

                                <div style={{ padding: '1rem', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <strong><FontAwesomeIcon icon={faLightbulb} /> Recommendation:</strong><br />
                                        {freshness.recommendation}
                                    </p>
                                </div>
                            </div>
                        )}

                        {contamination && (
                            <div className="card">
                                <div className="card-header">
                                    <h3 style={{ margin: 0 }}><FontAwesomeIcon icon={faTriangleExclamation} /> Safety Analysis</h3>
                                </div>

                                <div className="stat-card" style={{ marginBottom: '1rem' }}>
                                    <div className="label">Contamination Risk</div>
                                    <span className={`badge badge-${contamination.risk_level === 'Very Low' || contamination.risk_level === 'Low'
                                        ? 'success'
                                        : contamination.risk_level === 'Medium'
                                            ? 'warning'
                                            : 'danger'
                                        }`}>
                                        {contamination.risk_level}
                                    </span>
                                </div>

                                <div className="stat-card" style={{
                                    marginBottom: '1rem',
                                    background: contamination.risk_score > 70 ? 'rgba(255, 51, 102, 0.1)' :
                                        contamination.risk_score > 40 ? 'rgba(255, 170, 0, 0.1)' : 'rgba(0, 255, 136, 0.1)'
                                }}>
                                    <div className="label">Risk Score</div>
                                    <div className="value" style={{ fontSize: '2rem' }}>
                                        {contamination.risk_score.toFixed(1)}%
                                    </div>
                                </div>

                                <div style={{ padding: '1rem', background: 'rgba(0, 136, 255, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--secondary)' }}>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <strong><FontAwesomeIcon icon={faCircleInfo} /> Assessment:</strong><br />
                                        {contamination.recommendation || 'Product appears safe for consumption'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {Array.isArray(orderTrace.timeline) && orderTrace.timeline.length > 0 && (
                            <div className="card" style={{ marginTop: '1.5rem' }}>
                                <div className="card-header">
                                    <h3 style={{ margin: 0 }}><FontAwesomeIcon icon={faCircleInfo} /> Order Timeline</h3>
                                </div>

                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {orderTrace.timeline.map((entry, index) => (
                                        <div key={`${entry.timestamp}-${index}`} className="product-card">
                                            <p style={{ margin: 0 }}><strong>{entry.title}</strong></p>
                                            <p style={{ margin: 0 }}><strong>Stage:</strong> {entry.stage || 'N/A'}</p>
                                            <p style={{ margin: 0 }}><strong>Actor:</strong> {entry.actorName || 'Unknown'} ({entry.actorRole || 'Other'})</p>
                                            <p style={{ margin: 0 }}><strong>Location:</strong> {entry.location || 'N/A'}</p>
                                            {entry.condition && <p style={{ margin: 0 }}><strong>Condition:</strong> {entry.condition}</p>}
                                            {entry.details && <p style={{ margin: 0 }}><strong>Details:</strong> {entry.details}</p>}
                                            <p style={{ margin: 0 }}><strong>Time:</strong> {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {Array.isArray(orderTrace.certifications) && orderTrace.certifications.length > 0 && (
                            <div className="card" style={{ marginTop: '1.5rem' }}>
                                <div className="card-header">
                                    <h3 style={{ margin: 0 }}><FontAwesomeIcon icon={faCircleInfo} /> Quality Certifications</h3>
                                </div>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {orderTrace.certifications.map((certification, index) => (
                                        <div key={`${certification.name}-${index}`} className="product-card">
                                            <p style={{ margin: 0 }}><strong>{certification.name || 'Certification'}</strong></p>
                                            <p style={{ margin: 0 }}><strong>Issuer:</strong> {certification.issuer || 'N/A'}</p>
                                            <p style={{ margin: 0 }}><strong>Stage:</strong> {certification.stage || 'N/A'}</p>
                                            <p style={{ margin: 0 }}><strong>Uploaded:</strong> {certification.uploadedAt ? new Date(certification.uploadedAt).toLocaleString() : 'N/A'}</p>
                                            {certification.documentUrl && (
                                                <p style={{ margin: 0, wordBreak: 'break-all' }}><strong>Document:</strong> {certification.documentUrl}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {Array.isArray(orderTrace.timeline) && orderTrace.timeline.length > 0 && (
                            <div className="card" style={{ marginTop: '1.5rem' }}>
                                <div className="card-header">
                                    <h3 style={{ margin: 0 }}><FontAwesomeIcon icon={faCircleInfo} /> Movement Path</h3>
                                </div>
                                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                                    {
                                        [...new Set(orderTrace.timeline.map((entry) => entry.location).filter(Boolean))]
                                            .join(' -> ') || 'No movement data available yet.'
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!orderTrace && !loading && !error && (
                <div className="card">
                    <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', margin: 0 }}>
                            <FontAwesomeIcon icon={faMagnifyingGlass} /> Enter a blockchain product ID to verify authenticity<br />
                            <span style={{ fontSize: '0.95rem', marginTop: '0.5rem', display: 'block' }}>
                                View order-style lifecycle, blockchain authenticity, freshness metrics, and safety analysis
                            </span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
