import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faBox,
    faLocationDot,
    faMagnifyingGlass,
    faSpinner,
    faTriangleExclamation,
    faTruckFast,
    faWarehouse
} from '@fortawesome/free-solid-svg-icons'
import apiService from '../services/apiService'
import supplyChainTrackerAbi from '../contracts/supplyChainTrackerAbi'

const TRACKER_ADDRESS = import.meta.env.VITE_TRACKER_ADDRESS || '0x167f76FeF3B9377Ad602a85C14C533e0743E78C5'

const STAGE_OPTIONS = [
    { value: 'Distribution', label: 'Distribution Checkpoint', contractStage: 1 },
    { value: 'Retail', label: 'Handoff to Retail', contractStage: 2 }
]

const deriveConditionLabel = (temperature) => {
    if (temperature >= 2 && temperature <= 8) return 'Good'
    if (temperature >= 0 && temperature <= 12) return 'Warning'
    return 'Critical'
}

export default function DistributorDashboard({ account, user, onNavigateToVerify }) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState(null)
    const [transferReceipt, setTransferReceipt] = useState(null)
    const [transferForm, setTransferForm] = useState({
        productId: '',
        stage: 'Distribution',
        location: '',
        temperature: '',
        humidity: ''
    })

    useEffect(() => {
        loadDistributionProducts()
    }, [])

    const loadDistributionProducts = async () => {
        setLoading(true)
        try {
            const distributionProducts = await apiService.getProductsByStage('Distribution')
            setProducts(Array.isArray(distributionProducts) ? distributionProducts : [])
        } catch (error) {
            console.error('Error loading distributor products:', error)
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const handleFormChange = (event) => {
        const { name, value } = event.target
        setTransferForm((currentForm) => ({
            ...currentForm,
            [name]: value
        }))
    }

    const handleTransferSubmit = async (event) => {
        event.preventDefault()
        setMessage(null)

        if (!account) {
            setMessage({ type: 'error', text: 'Connect your wallet before logging a transfer.' })
            return
        }

        if (typeof window.ethereum === 'undefined') {
            setMessage({ type: 'error', text: 'MetaMask is required to log distribution transfers on-chain.' })
            return
        }

        const selectedStage = STAGE_OPTIONS.find((stageOption) => stageOption.value === transferForm.stage)
        if (!selectedStage) {
            setMessage({ type: 'error', text: 'Select a valid transfer stage.' })
            return
        }

        setSubmitting(true)

        try {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const trackerContract = new ethers.Contract(TRACKER_ADDRESS, supplyChainTrackerAbi, signer)

            const transaction = await trackerContract.logTransfer(
                Number(transferForm.productId),
                selectedStage.contractStage,
                transferForm.location.trim(),
                Math.round(Number(transferForm.temperature) * 10),
                Math.round(Number(transferForm.humidity) * 10)
            )

            const receipt = await transaction.wait()

            await apiService.addStakeholderUpdate(Number(transferForm.productId), {
                actorAddress: account,
                actorName: user?.fullName || 'Distributor',
                actorRole: 'Distributor',
                action: 'Order Checkpoint Updated',
                notes: `Order moved to ${transferForm.stage} checkpoint by distributor`,
                location: transferForm.location.trim(),
                condition: deriveConditionLabel(Number(transferForm.temperature))
            })

            setTransferReceipt({
                productId: Number(transferForm.productId),
                transactionHash: receipt.hash,
                stage: selectedStage.label
            })
            setMessage({
                type: 'success',
                text: `Transfer logged on-chain for product ID ${transferForm.productId}.`
            })
            setTransferForm({
                productId: '',
                stage: 'Distribution',
                location: '',
                temperature: '',
                humidity: ''
            })

            await loadDistributionProducts()
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.message || 'Failed to log transfer on-chain.'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const flaggedProducts = products.filter((product) => typeof product.qualityScore === 'number' && product.qualityScore < 70)

    return (
        <div>
            <div className="card-header">
                <h2><FontAwesomeIcon icon={faTruckFast} /> Distributor Dashboard</h2>
                <p>Monitor products in the distribution stage and verify shipment identity with the blockchain product ID.</p>
            </div>

            <div className="card" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                    <h3><FontAwesomeIcon icon={faWarehouse} /> Log Distribution Transfer</h3>
                    <p>Distributors can append on-chain shipment checkpoints and retail handoffs using the canonical product ID.</p>
                </div>

                {message && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                {transferReceipt && (
                    <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                        <strong>Last Transfer:</strong> Product ID {transferReceipt.productId} moved as {transferReceipt.stage}
                        <div style={{ marginTop: '0.5rem', wordBreak: 'break-all' }}>
                            Transaction: {transferReceipt.transactionHash}
                        </div>
                    </div>
                )}

                <form onSubmit={handleTransferSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Product ID</label>
                            <input
                                type="number"
                                name="productId"
                                value={transferForm.productId}
                                onChange={handleFormChange}
                                placeholder="e.g. 12"
                                min="1"
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Transfer Stage</label>
                            <select
                                name="stage"
                                value={transferForm.stage}
                                onChange={handleFormChange}
                                required
                            >
                                {STAGE_OPTIONS.map((stageOption) => (
                                    <option key={stageOption.value} value={stageOption.value}>
                                        {stageOption.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <FontAwesomeIcon icon={faLocationDot} /> Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={transferForm.location}
                                onChange={handleFormChange}
                                placeholder="e.g. Lagos Warehouse"
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Temperature (°C)</label>
                            <input
                                type="number"
                                name="temperature"
                                value={transferForm.temperature}
                                onChange={handleFormChange}
                                step="0.1"
                                min="-50"
                                max="60"
                                placeholder="e.g. 5.5"
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Humidity (%)</label>
                            <input
                                type="number"
                                name="humidity"
                                value={transferForm.humidity}
                                onChange={handleFormChange}
                                step="0.1"
                                min="0"
                                max="100"
                                placeholder="e.g. 82.5"
                                required
                            />
                        </div>
                    </div>

                    <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '240px' }}>
                        {submitting ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin /> Logging Transfer...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faTruckFast} /> Submit Transfer
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="grid grid-3" style={{ marginTop: '1.5rem' }}>
                <div className="stat-card">
                    <div className="label">Distribution Queue</div>
                    <div className="value">{products.length}</div>
                </div>
                <div className="stat-card">
                    <div className="label">Attention Needed</div>
                    <div className="value">{flaggedProducts.length}</div>
                </div>
                <div className="stat-card">
                    <div className="label">Quick Action</div>
                    <button className="btn btn-primary" type="button" onClick={onNavigateToVerify}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} /> Verify Shipment
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h3><FontAwesomeIcon icon={faBox} /> Products in Distribution</h3>
                    <p>Every shipment should be referenced by its canonical blockchain product ID.</p>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading distribution products...</p>
                ) : products.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No products are currently in the distribution stage.</p>
                ) : (
                    <div className="grid grid-2">
                        {products.map((product) => (
                            <div key={product.productId} className="product-card">
                                <h4>{product.productName}</h4>
                                <p><strong>Product ID:</strong> {product.productId}</p>
                                <p><strong>Origin:</strong> {product.farmLocation || 'Unknown'}</p>
                                <p><strong>Transfers:</strong> {product.totalTransfers || 0}</p>
                                <p>
                                    <strong>Quality:</strong>{' '}
                                    {typeof product.qualityScore === 'number' ? product.qualityScore : 'Pending'}
                                    {typeof product.qualityScore === 'number' && product.qualityScore < 70 ? (
                                        <>
                                            {' '}
                                            <FontAwesomeIcon icon={faTriangleExclamation} />
                                        </>
                                    ) : null}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}