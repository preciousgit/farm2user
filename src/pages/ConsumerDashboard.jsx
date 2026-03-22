import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faBox,
    faCircleCheck,
    faMagnifyingGlass,
    faLocationDot,
    faTemperatureHalf,
    faDroplet
} from '@fortawesome/free-solid-svg-icons'
import apiService from '../services/apiService'

const lifecycleStages = [
    'Cultivation',
    'Harvesting',
    'Processing',
    'Inspection',
    'Warehouse Storage',
    'Packaging/Bottling',
    'Distribution',
    'Retail'
]

export default function ConsumerDashboard({ onNavigateToVerify }) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const productData = await apiService.getAllProducts()
            setProducts(Array.isArray(productData) ? productData.slice(0, 6) : [])
        } catch (error) {
            console.error('Error loading consumer dashboard products:', error)
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="card concept-hero-shell">
                <div className="concept-hero-grid">
                    <div>
                        <div className="badge badge-info" style={{ marginBottom: '0.9rem' }}>Traceability Control</div>
                        <h1 className="concept-hero-title">
                            Food Safety<br />Track & Trace SaaS
                        </h1>
                        <p className="concept-hero-subtitle">
                            Verify origin, trust quality data, and review full movement history from source to shelf using a single unique product ID.
                        </p>

                        <div className="concept-hero-actions">
                            <button className="btn btn-primary" type="button" onClick={onNavigateToVerify}>
                                <FontAwesomeIcon icon={faMagnifyingGlass} /> Verify with Product ID
                            </button>
                            <span className="badge badge-success">Blockchain-backed traceability</span>
                        </div>
                    </div>

                    <div className="concept-right-panel">
                        <div className="stat-card" style={{ marginBottom: '0.75rem' }}>
                            <div className="label"><FontAwesomeIcon icon={faTemperatureHalf} /> Temperature Monitor</div>
                            <div className="value" style={{ fontSize: '1.8rem' }}>25.1°C</div>
                        </div>
                        <div className="concept-mini-grid">
                            <div className="stat-card">
                                <div className="label"><FontAwesomeIcon icon={faDroplet} /> Humidity</div>
                                <div className="value" style={{ fontSize: '1.25rem' }}>73%</div>
                            </div>
                            <div className="stat-card">
                                <div className="label"><FontAwesomeIcon icon={faLocationDot} /> Region</div>
                                <div className="value" style={{ fontSize: '1.05rem' }}>Live Route</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '1.25rem' }}>
                <div className="card-header">
                    <h3 style={{ margin: 0 }}>Product Advantages</h3>
                    <p>Standard lifecycle templates mapped across each traceability stage.</p>
                </div>

                <div className="concept-stage-strip">
                    {lifecycleStages.map((stage) => (
                        <div key={stage} className="product-card" style={{ padding: '0.9rem 1rem', marginBottom: 0 }}>
                            <p style={{ margin: 0, fontWeight: 700 }}>{stage}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-3" style={{ marginTop: '1.5rem' }}>
                <div className="stat-card">
                    <div className="label">Visible Products</div>
                    <div className="value">{products.length}</div>
                </div>
                <div className="stat-card">
                    <div className="label">Verification Mode</div>
                    <div className="value" style={{ fontSize: '1.1rem' }}>Order ID Trace</div>
                </div>
                <div className="stat-card">
                    <div className="label">Recommended Action</div>
                    <button className="btn btn-primary" type="button" onClick={onNavigateToVerify}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} /> Verify Product
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h3><FontAwesomeIcon icon={faBox} /> Recent Product Orders</h3>
                    <p>Use the unique ID below like an order number to inspect authenticity and delivery history.</p>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading recent products...</p>
                ) : products.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No products are available yet.</p>
                ) : (
                    <div className="grid grid-2">
                        {products.map((product) => (
                            <div key={product.productId} className="product-card">
                                <h4>{product.productName}</h4>
                                <p><strong>Product ID:</strong> {product.productId}</p>
                                <p><strong>Origin:</strong> {product.farmLocation || 'Unknown'}</p>
                                <p><strong>Stage:</strong> {product.currentStage || 'Farm'}</p>
                                <p><strong>Status:</strong> <FontAwesomeIcon icon={faCircleCheck} /> {product.isActive ? 'Active' : 'Inactive'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}