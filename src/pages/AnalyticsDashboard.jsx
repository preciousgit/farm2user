import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartLine } from '@fortawesome/free-solid-svg-icons'
import apiService from '../services/apiService'

export default function AnalyticsDashboard() {
    const [products, setProducts] = useState([])
    const [analytics, setAnalytics] = useState({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadAnalytics()
    }, [])

    const loadAnalytics = async () => {
        setLoading(true)
        try {
            const productsData = await apiService.getAllProducts()
            setProducts(productsData || [])

            const analyticsData = {}
            for (const product of (productsData || []).slice(0, 8)) {
                try {
                    const fresh = await apiService.getFreshness(product.productId)
                    const risk = await apiService.getContaminationRisk(product.productId)
                    analyticsData[product.productId] = {
                        freshness: fresh.prediction,
                        risk: risk.contamination_risk
                    }
                } catch (error) {
                    console.error(`Error loading analytics for product ${product.productId}:`, error)
                }
            }
            setAnalytics(analyticsData)
        } catch (error) {
            console.error('Error loading analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (level) => {
        if (level?.includes('Fresh') || level?.includes('Excellent')) return 'success'
        if (level?.includes('Moderate')) return 'warning'
        return 'danger'
    }

    const getRiskBadge = (score) => {
        if (score > 70) return 'danger'
        if (score > 40) return 'warning'
        return 'success'
    }

    return (
        <div>
            <div className="card-header">
                <h2><FontAwesomeIcon icon={faChartLine} /> Analytics Dashboard</h2>
                <p>Real-time supply chain intelligence powered by ML</p>
            </div>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <div className="loading"></div>
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading analytics...</p>
                </div>
            ) : products.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No products available</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Register products to see supply chain analytics</p>
                </div>
            ) : (
                <div>
                    <div className="grid grid-4" style={{ marginTop: '1.5rem' }}>
                        {products.slice(0, 8).map((product) => {
                            const productAnalytics = analytics[product.productId]
                            return (
                                <div key={product.productId} className="card">
                                    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary)', fontSize: '1rem' }}>
                                        {product.productName}
                                    </h3>

                                    {productAnalytics?.freshness ? (
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div className="stat-card">
                                                <div className="label">Freshness Score</div>
                                                <div className="value">
                                                    {productAnalytics.freshness.freshness_score.toFixed(1)}
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '0.75rem' }}>
                                                <span className={`badge badge-${getStatusBadge(productAnalytics.freshness.freshness_level)}`}>
                                                    {productAnalytics.freshness.freshness_level}
                                                </span>
                                            </div>
                                            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                Shelf Life: {productAnalytics.freshness.remaining_shelf_life_days}d
                                            </p>
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--text-muted)' }}>No freshness data</p>
                                    )}

                                    {productAnalytics?.risk && (
                                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                            <div className="stat-card">
                                                <div className="label">Risk Score</div>
                                                <div className="value">
                                                    {productAnalytics.risk.risk_score}<span style={{ fontSize: '0.7em' }}>/100</span>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '0.75rem' }}>
                                                <span className={`badge badge-${getRiskBadge(productAnalytics.risk.risk_score)}`}>
                                                    {productAnalytics.risk.risk_level}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
