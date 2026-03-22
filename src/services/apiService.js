import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:5000/api/analytics'

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

const analyticsClient = axios.create({
    baseURL: ANALYTICS_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

const unwrapData = (response) => response.data?.data ?? response.data

const apiService = {
    // ==================== Products ====================

    async getAllProducts() {
        try {
            const response = await apiClient.get('/products')
            return unwrapData(response)
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch products')
        }
    },

    async getProduct(productId) {
        try {
            const response = await apiClient.get(`/products/${productId}`)
            return unwrapData(response)
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Product not found')
        }
    },

    async getProductJourney(productId) {
        try {
            const response = await apiClient.get(`/products/${productId}/journey`)
            return unwrapData(response)
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch journey')
        }
    },

    async getOrderTrace(productId) {
        try {
            const response = await apiClient.get(`/products/${productId}/order-trace`)
            return unwrapData(response)
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch order trace')
        }
    },

    async getProductsByFarmer(farmerAddress) {
        try {
            const response = await apiClient.get(`/products/farmer/${farmerAddress}`)
            return unwrapData(response)
        } catch (error) {
            console.error('Error fetching farmer products:', error)
            return []
        }
    },

    async getProductsByStage(stage) {
        try {
            const response = await apiClient.get(`/products/stage/${stage}`)
            return unwrapData(response)
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch products')
        }
    },

    async syncRegisteredProduct(profilePayload) {
        try {
            const response = await apiClient.post('/products/sync', profilePayload)
            return unwrapData(response)
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to sync product profile')
        }
    },

    async addStakeholderUpdate(productId, updatePayload) {
        try {
            const response = await apiClient.post(`/products/${productId}/stakeholder-update`, updatePayload)
            return unwrapData(response)
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to append stakeholder update')
        }
    },

    async trackSupplyChainEvent(productId, eventPayload) {
        try {
            const response = await apiClient.post(`/products/${productId}/track-event`, eventPayload)
            return unwrapData(response)
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to log lifecycle event')
        }
    },

    async simulateIotLog(productId, payload = {}) {
        try {
            const response = await apiClient.post(`/products/${productId}/iot-simulate`, payload)
            return unwrapData(response)
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to simulate IoT log')
        }
    },

    async getProductBlocks(productId) {
        try {
            const response = await apiClient.get(`/products/${productId}/blocks`)
            return unwrapData(response)
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch blockchain records')
        }
    },

    async getAdminTraceability(filters = {}) {
        try {
            const response = await apiClient.get('/products/admin/traceability', { params: filters })
            return unwrapData(response)
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch traceability records')
        }
    },

    async getRegulatorySummary() {
        try {
            const response = await apiClient.get('/products/regulatory/summary')
            return unwrapData(response)
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch regulatory summary')
        }
    },

    async simulateRecall(productId) {
        try {
            const response = await apiClient.get(`/products/recall/simulate/${productId}`)
            return unwrapData(response)
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Recall simulation failed')
        }
    },

    async getQualityAlerts() {
        try {
            const response = await apiClient.get('/products/quality/alert')
            return unwrapData(response)
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch quality alerts')
        }
    },

    // ==================== Analytics ====================

    async getFreshness(productId) {
        try {
            const response = await analyticsClient.get(`/freshness/${productId}`)
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Freshness prediction failed')
        }
    },

    async getShelfLife(productId) {
        try {
            const response = await analyticsClient.get(`/shelf-life/${productId}`)
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Shelf-life analysis failed')
        }
    },

    async getContaminationRisk(productId) {
        try {
            const response = await analyticsClient.get(`/contamination-risk/${productId}`)
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Risk assessment failed')
        }
    },

    async getAnomalies(productId) {
        try {
            const response = await analyticsClient.get(`/anomalies/${productId}`)
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Anomaly detection failed')
        }
    },

    async batchAnalytics(productIds, analysisTypes) {
        try {
            const response = await analyticsClient.post('/batch', {
                product_ids: productIds,
                analysis_types: analysisTypes
            })
            return response.data
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Batch analysis failed')
        }
    },

    // ==================== Health & Status ====================

    async getBackendHealth() {
        try {
            const response = await apiClient.get('/health')
            return response.data
        } catch (error) {
            throw new Error('Backend unavailable')
        }
    },

    async getAnalyticsHealth() {
        try {
            const response = await axios.get(`${ANALYTICS_URL.replace('/api/analytics', '')}/health`)
            return response.data
        } catch (error) {
            throw new Error('Analytics service unavailable')
        }
    }
}

export default apiService
