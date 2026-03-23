import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faHashtag,
    faSeedling,
    faSpinner,
    faBox,
    faCircleCheck,
    faPause,
    faScaleBalanced,
    faCalendarDays,
    faLocationDot,
    faWeightHanging,
    faFileLines,
    faTruckFast,
    faImages,
    faFileArrowUp
} from '@fortawesome/free-solid-svg-icons'
import apiService from '../services/apiService'
import productRegistryAbi from '../contracts/productRegistryAbi'

const PRODUCT_REGISTRY_ADDRESS = import.meta.env.VITE_PRODUCT_REGISTRY_ADDRESS || '0xA3540fA94b8E9605cAfB87fdA3bA03709CF108c7'

const mergeProductsById = (incomingProducts) => {
    const productMap = new Map()

    incomingProducts.forEach((product) => {
        productMap.set(product.productId, product)
    })

    return Array.from(productMap.values()).sort((left, right) => right.productId - left.productId)
}

const getRegisteredProductId = (receipt, contractInterface) => {
    for (const log of receipt.logs) {
        try {
            const parsedLog = contractInterface.parseLog(log)
            if (parsedLog?.name === 'ProductRegistered') {
                return Number(parsedLog.args.productId)
            }
        } catch {
            // Ignore unrelated logs from other contracts.
        }
    }

    return null
}

export default function FarmerDashboard({ account, user }) {
    const [products, setProducts] = useState([])
    const [formData, setFormData] = useState({
        productName: '',
        productType: '',
        batchNumber: '',
        farmLocation: '',
        harvestDate: '',
        weightKg: '',
        weightType: 'Net Weight',
        description: ''
    })
    const [mediaFiles, setMediaFiles] = useState([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [registeredProduct, setRegisteredProduct] = useState(null)
    const [selectedProductId, setSelectedProductId] = useState(null)
    const [selectedProfile, setSelectedProfile] = useState(null)
    const [profileLoading, setProfileLoading] = useState(false)

    useEffect(() => {
        if (account) {
            loadFarmerProducts()
        } else {
            setProducts([])
        }
    }, [account])

    const loadFarmerProducts = async () => {
        try {
            const data = await apiService.getProductsByFarmer(account)
            setProducts(Array.isArray(data) ? mergeProductsById(data) : [])
        } catch (error) {
            console.error('Error loading products:', error)
        }
    }

    const loadProductProfile = async (productId) => {
        setProfileLoading(true)
        try {
            const [journeyResult, freshnessResult, riskResult] = await Promise.allSettled([
                apiService.getProductJourney(productId),
                apiService.getFreshness(productId),
                apiService.getContaminationRisk(productId)
            ])

            if (journeyResult.status !== 'fulfilled') {
                throw new Error('Unable to load core product journey data')
            }

            const journeyData = journeyResult.value
            const freshnessData = freshnessResult.status === 'fulfilled' ? freshnessResult.value : null
            const riskData = riskResult.status === 'fulfilled' ? riskResult.value : null

            setSelectedProfile({
                journey: journeyData,
                freshness: freshnessData?.prediction || null,
                contaminationRisk: riskData?.contamination_risk || null
            })
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to load product profile' })
            setSelectedProfile(null)
        } finally {
            setProfileLoading(false)
        }
    }

    const handleOpenProductProfile = async (productId) => {
        setSelectedProductId(productId)
        await loadProductProfile(productId)
    }

    const handleMediaSelection = (event) => {
        const incomingFiles = Array.from(event.target.files || [])
        const allowedFiles = incomingFiles.filter((file) => {
            const isSupported = file.type.startsWith('image/') || file.type.startsWith('video/')
            const withinSizeLimit = file.size <= 4 * 1024 * 1024
            return isSupported && withinSizeLimit
        })

        if (allowedFiles.length !== incomingFiles.length) {
            setMessage({ type: 'warning', text: 'Only image/video files up to 4MB are accepted.' })
        }

        const combinedFiles = [...mediaFiles, ...allowedFiles].slice(0, 5)
        setMediaFiles(combinedFiles)
        event.target.value = ''
    }

    const removeMediaFile = (indexToRemove) => {
        setMediaFiles((currentFiles) => currentFiles.filter((_, index) => index !== indexToRemove))
    }

    const fileToDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`))
        reader.readAsDataURL(file)
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setMessage(null)
        if (!account) {
            setMessage({ type: 'error', text: 'Please connect your wallet first' })
            return
        }

        if (typeof window.ethereum === 'undefined') {
            setMessage({ type: 'error', text: 'MetaMask is required to register a product on-chain' })
            return
        }

        setLoading(true)
        try {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const contract = new ethers.Contract(
                PRODUCT_REGISTRY_ADDRESS,
                productRegistryAbi,
                signer
            )

            const harvestDateTimestamp = Math.floor(new Date(formData.harvestDate).getTime() / 1000)
            const currentCount = await contract.getProductCount()
            const predictedProductId = Number(currentCount) + 1

            const transaction = await contract.registerProduct(
                formData.productName,
                user?.fullName || 'Producer',
                formData.farmLocation,
                harvestDateTimestamp
            )

            const receipt = await transaction.wait()
            const productId = getRegisteredProductId(receipt, contract.interface)
                || predictedProductId

            if (!productId || Number.isNaN(productId) || productId < 1) {
                throw new Error('Product ID could not be resolved from transaction receipt')
            }

            const mediaAssets = await Promise.all(
                mediaFiles.map(async (file) => ({
                    fileName: file.name,
                    mimeType: file.type,
                    mediaType: file.type.startsWith('video/') ? 'video' : 'image',
                    sizeKb: Number((file.size / 1024).toFixed(2)),
                    dataUrl: await fileToDataUrl(file)
                }))
            )

            const syncedProduct = await apiService.syncRegisteredProduct({
                productId,
                productName: formData.productName,
                productType: formData.productType,
                batchNumber: formData.batchNumber,
                farmerName: user?.fullName || 'Producer',
                farmLocation: formData.farmLocation,
                harvestDate: formData.harvestDate,
                farmerAddress: account,
                blockchainTxHash: receipt.hash,
                weightKg: formData.weightKg ? Number(formData.weightKg) : null,
                weightType: formData.weightType,
                mediaAssets,
                description: formData.description
            })

            const optimisticProduct = {
                productId,
                productName: formData.productName,
                productType: formData.productType,
                batchNumber: formData.batchNumber,
                farmLocation: formData.farmLocation,
                harvestDate: formData.harvestDate,
                farmerName: user?.fullName || 'Producer',
                weightKg: formData.weightKg ? Number(formData.weightKg) : null,
                weightType: formData.weightType,
                mediaAssets,
                description: formData.description,
                isActive: true,
                totalTransfers: 0,
                qualityScore: 100
            }

            setProducts((currentProducts) => mergeProductsById([optimisticProduct, ...currentProducts]))
            setRegisteredProduct({
                productId,
                transactionHash: receipt.hash,
                qrCodeUrl: syncedProduct?.qrCodeUrl || ''
            })
            setMessage({
                type: 'success',
                text: `Product registered on-chain. Canonical product ID: ${productId}`
            })
            setFormData({
                productName: '',
                productType: '',
                batchNumber: '',
                farmLocation: '',
                harvestDate: '',
                weightKg: '',
                weightType: 'Net Weight',
                description: ''
            })
            setMediaFiles([])
            setTimeout(() => loadFarmerProducts(), 2000)
        } catch (error) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h2><FontAwesomeIcon icon={faSeedling} /> Register New Product</h2>
                    <p>Add a new product to the blockchain supply chain</p>
                </div>

                {message && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                {registeredProduct && (
                    <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                        <strong><FontAwesomeIcon icon={faHashtag} /> Canonical Product ID:</strong> {registeredProduct.productId}
                        <div style={{ marginTop: '0.5rem', wordBreak: 'break-all' }}>
                            Transaction: {registeredProduct.transactionHash}
                        </div>
                        {registeredProduct.qrCodeUrl && (
                            <div style={{ marginTop: '0.75rem' }}>
                                <p style={{ marginBottom: '0.5rem' }}><strong>Traceability QR:</strong></p>
                                <img src={registeredProduct.qrCodeUrl} alt="Traceability QR" style={{ width: '120px', height: '120px', borderRadius: '8px' }} />
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'flex-end' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Product Name</label>
                            <input
                                type="text"
                                value={formData.productName}
                                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                placeholder="e.g., Organic Tomatoes"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    color: 'var(--text)',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Product Type</label>
                            <input
                                type="text"
                                value={formData.productType}
                                onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                                placeholder="e.g., Fresh Produce"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    color: 'var(--text)',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Batch Number</label>
                            <input
                                type="text"
                                value={formData.batchNumber}
                                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                                placeholder="e.g., BATCH-2026-0001"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    color: 'var(--text)',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Farm Location</label>
                            <input
                                type="text"
                                value={formData.farmLocation}
                                onChange={(e) => setFormData({ ...formData, farmLocation: e.target.value })}
                                placeholder="e.g., California, USA"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    color: 'var(--text)',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Harvest Date</label>
                            <input
                                type="date"
                                value={formData.harvestDate}
                                onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    color: 'var(--text)',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Weight (kg)</label>
                            <input
                                type="number"
                                value={formData.weightKg}
                                onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                                step="0.01"
                                min="0"
                                placeholder="e.g., 12.50"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    color: 'var(--text)',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Weight Type</label>
                            <select
                                value={formData.weightType}
                                onChange={(e) => setFormData({ ...formData, weightType: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    color: 'var(--text)',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <option value="Net Weight">Net Weight</option>
                                <option value="Gross Weight">Gross Weight</option>
                                <option value="Shipping Weight">Shipping Weight</option>
                                <option value="Estimated Weight">Estimated Weight</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Describe the product batch, handling notes, or quality context..."
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: 'var(--text)',
                                fontSize: '0.95rem',
                                transition: 'all 0.3s ease',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            <FontAwesomeIcon icon={faImages} /> Product Media (Photos/Videos)
                        </label>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <label className="btn btn-secondary" style={{ cursor: 'pointer', marginBottom: 0 }}>
                                <FontAwesomeIcon icon={faFileArrowUp} /> Add Files
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleMediaSelection}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Max 5 files, 4MB each
                            </span>
                        </div>

                        {mediaFiles.length > 0 && (
                            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
                                {mediaFiles.map((file, index) => (
                                    <div key={`${file.name}-${index}`} className="product-card" style={{ marginBottom: 0, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600 }}>{file.name}</p>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {(file.size / 1024).toFixed(1)} KB • {file.type.startsWith('video/') ? 'Video' : 'Image'}
                                            </p>
                                        </div>
                                        <button type="button" className="btn btn-danger btn-small" onClick={() => removeMediaFile(index)}>
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '200px', justifySelf: 'start' }}
                    >
                        {loading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin /> Registering...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faFileArrowUp} /> Upload Product
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h2>Your Products</h2>
                    <p>{products.length} product{products.length !== 1 ? 's' : ''} registered</p>
                </div>

                {products.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No products registered yet</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Register your first product to get started</p>
                    </div>
                ) : (
                    <div className="card" style={{ marginTop: '1.5rem', padding: 0, overflow: 'hidden' }}>
                        <div className="products-table-head">
                            <span>Product</span>
                            <span>Batch</span>
                            <span>Status</span>
                            <span>Transfers</span>
                            <span>Quality</span>
                            <span>Action</span>
                        </div>
                        {products.map((product) => (
                            <div key={product.productId} className="products-table-row">
                                <div>
                                    <p style={{ margin: 0, fontWeight: 600 }}>{product.productName}</p>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        ID #{product.productId} • {product.farmLocation}
                                    </p>
                                </div>
                                <div>{product.batchNumber || '-'}</div>
                                <div>
                                    <span className={`badge badge-${product.isActive ? 'success' : 'warning'}`}>
                                        <FontAwesomeIcon icon={product.isActive ? faCircleCheck : faPause} /> {product.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div>{product.totalTransfers || 0}</div>
                                <div>{product.qualityScore || 100}/100</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button type="button" className="btn btn-secondary btn-small" onClick={() => handleOpenProductProfile(product.productId)}>
                                        View Profile
                                    </button>
                                    {selectedProductId === product.productId && profileLoading && (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedProductId && selectedProfile?.journey?.product && (
                <div className="card" style={{ marginTop: '2rem' }}>
                    <div className="card-header">
                        <h2><FontAwesomeIcon icon={faScaleBalanced} /> Product Profile - #{selectedProfile.journey.product.productId}</h2>
                        <p>Full product profile and stakeholder timeline</p>
                    </div>

                    <div className="grid grid-2" style={{ marginTop: '1.5rem' }}>
                        <div className="stat-card">
                            <div className="label"><FontAwesomeIcon icon={faBox} /> Name</div>
                            <div className="value" style={{ fontSize: '1rem' }}>{selectedProfile.journey.product.productName}</div>
                        </div>
                        <div className="stat-card">
                            <div className="label"><FontAwesomeIcon icon={faWeightHanging} /> Weight</div>
                            <div className="value" style={{ fontSize: '1rem' }}>
                                {selectedProfile.journey.product.weightKg !== null && selectedProfile.journey.product.weightKg !== undefined
                                    ? `${selectedProfile.journey.product.weightKg} kg`
                                    : 'Not provided'}
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="label">Weight Type</div>
                            <div className="value" style={{ fontSize: '1rem' }}>
                                {selectedProfile.journey.product.weightType || 'Net Weight'}
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="label"><FontAwesomeIcon icon={faLocationDot} /> Farm Location</div>
                            <div className="value" style={{ fontSize: '1rem' }}>{selectedProfile.journey.product.farmLocation}</div>
                        </div>
                        <div className="stat-card">
                            <div className="label"><FontAwesomeIcon icon={faCalendarDays} /> Harvest Date</div>
                            <div className="value" style={{ fontSize: '1rem' }}>
                                {selectedProfile.journey.product.harvestDate
                                    ? new Date(selectedProfile.journey.product.harvestDate).toLocaleString()
                                    : 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                        <strong>Description:</strong> {selectedProfile.journey.product.description || 'No description provided'}
                    </div>

                    {selectedProfile.journey.product.mediaAssets?.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <h3 style={{ marginBottom: '0.75rem' }}><FontAwesomeIcon icon={faImages} /> Uploaded Media</h3>
                            <div className="grid grid-2" style={{ gap: '0.75rem' }}>
                                {selectedProfile.journey.product.mediaAssets.map((asset, index) => (
                                    <div key={`${asset.fileName}-${index}`} className="card" style={{ margin: 0, padding: '0.75rem' }}>
                                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>{asset.fileName}</p>
                                        {asset.mediaType === 'video' ? (
                                            <video controls style={{ width: '100%', borderRadius: '8px' }}>
                                                <source src={asset.dataUrl} type={asset.mimeType || 'video/mp4'} />
                                            </video>
                                        ) : (
                                            <img src={asset.dataUrl} alt={asset.fileName} style={{ width: '100%', borderRadius: '8px' }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-2" style={{ marginTop: '1rem' }}>
                        <div className="stat-card">
                            <div className="label">Freshness Score</div>
                            <div className="value">
                                {selectedProfile.freshness ? selectedProfile.freshness.freshness_score.toFixed(1) : 'N/A'}
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="label">Contamination Risk</div>
                            <div className="value">
                                {selectedProfile.contaminationRisk ? selectedProfile.contaminationRisk.risk_level : 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <h3 style={{ marginBottom: '0.75rem' }}><FontAwesomeIcon icon={faTruckFast} /> Distribution History</h3>
                        {selectedProfile.journey.journey?.length > 0 ? (
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {selectedProfile.journey.journey.map((entry, index) => (
                                    <div key={`${entry.timestamp}-${index}`} className="card" style={{ margin: 0 }}>
                                        <p style={{ margin: 0 }}><strong>Stage:</strong> {entry.stage}</p>
                                        <p style={{ margin: 0 }}><strong>Location:</strong> {entry.location}</p>
                                        <p style={{ margin: 0 }}><strong>Handler:</strong> {entry.handler} ({entry.handlerRole || 'Unknown'})</p>
                                        <p style={{ margin: 0 }}><strong>Time:</strong> {new Date(entry.timestamp).toLocaleString()}</p>
                                        <p style={{ margin: 0 }}><strong>Temperature:</strong> {entry.temperature}°C, <strong>Humidity:</strong> {entry.humidity}%</p>
                                        <p style={{ margin: 0 }}><strong>Condition:</strong> {entry.qualityStatus}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)' }}>No distribution entries recorded yet.</p>
                        )}
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <h3 style={{ marginBottom: '0.75rem' }}><FontAwesomeIcon icon={faFileLines} /> Stakeholder Updates</h3>
                        {selectedProfile.journey.product.stakeholderUpdates?.length > 0 ? (
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {selectedProfile.journey.product.stakeholderUpdates.map((update, index) => (
                                    <div key={`${update.timestamp}-${index}`} className="card" style={{ margin: 0 }}>
                                        <p style={{ margin: 0 }}><strong>{update.actorRole}:</strong> {update.actorName}</p>
                                        <p style={{ margin: 0 }}><strong>Action:</strong> {update.action}</p>
                                        <p style={{ margin: 0 }}><strong>Notes:</strong> {update.notes || 'N/A'}</p>
                                        <p style={{ margin: 0 }}><strong>Location:</strong> {update.location || 'N/A'}</p>
                                        <p style={{ margin: 0 }}><strong>Condition:</strong> {update.condition || 'N/A'}</p>
                                        <p style={{ margin: 0 }}><strong>Time:</strong> {new Date(update.timestamp).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)' }}>No stakeholder notes available.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
