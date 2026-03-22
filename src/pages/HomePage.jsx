import React, { useEffect, useMemo, useState } from 'react'
import apiService from '../services/apiService'

const partnerList = [
    'AgriTrust Cooperative',
    'GreenChain Logistics',
    'National Food Safety Board',
    'FreshRoute Distributors',
    'SafeHarvest Initiative',
    'AgroData Exchange'
]

const blogPosts = [
    {
        title: 'How Farm2User Improves Recall Precision',
        date: 'Mar 2026',
        summary: 'See how traceability records reduce recall waste and speed up root-cause analysis.'
    },
    {
        title: 'Cold Chain Monitoring Best Practices',
        date: 'Feb 2026',
        summary: 'A practical checklist for distributors to maintain quality in transit.'
    },
    {
        title: 'Building Consumer Trust with Product IDs',
        date: 'Jan 2026',
        summary: 'Why transparent product identity and timeline visibility improve brand credibility.'
    }
]

const testimonials = [
    {
        quote: 'Farm2User helped us prove authenticity for each batch in under 20 seconds.',
        name: 'Ngozi A.',
        role: 'Quality Manager, FreshRoute'
    },
    {
        quote: 'The compliance dashboard made audits faster and more evidence-based.',
        name: 'Hassan B.',
        role: 'Regulatory Inspector'
    },
    {
        quote: 'Customers trust us more because they can verify product history instantly.',
        name: 'Dara E.',
        role: 'Retail Operations Lead'
    }
]

export default function HomePage({ onNavigateToVerify, onNavigateToContact }) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [activityIndex, setActivityIndex] = useState(0)
    const [testimonialIndex, setTestimonialIndex] = useState(0)

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true)
            try {
                const data = await apiService.getAllProducts()
                setProducts(Array.isArray(data) ? data : [])
            } catch {
                setProducts([])
            } finally {
                setLoading(false)
            }
        }

        loadProducts()
    }, [])

    const activityItems = useMemo(() => {
        if (!products.length) {
            return ['No recent transactions yet. Register products to populate live activity.']
        }

        const entries = []
        products.slice(0, 20).forEach((product) => {
            entries.push(
                `Product #${product.productId} (${product.productName}) is currently at ${product.currentStage || 'Unknown Stage'}.`
            )
            const updates = Array.isArray(product.stakeholderUpdates) ? product.stakeholderUpdates : []
            updates.slice(-2).forEach((update) => {
                entries.push(
                    `${update.actorRole || 'Stakeholder'} ${update.actorName || 'Unknown'}: ${update.action || 'Updated'} for Product #${product.productId}.`
                )
            })
        })
        return entries.slice(0, 30)
    }, [products])

    useEffect(() => {
        const interval = setInterval(() => {
            setActivityIndex((current) => (current + 1) % activityItems.length)
        }, 2800)
        return () => clearInterval(interval)
    }, [activityItems.length])

    useEffect(() => {
        const interval = setInterval(() => {
            setTestimonialIndex((current) => (current + 1) % testimonials.length)
        }, 4500)
        return () => clearInterval(interval)
    }, [])

    return (
        <div>
            <section className="home-hero card">
                <div className="home-hero-content">
                    <p className="home-kicker">Farm2User Platform</p>
                    <h1>Transparent Food Traceability From Farm To Consumer</h1>
                    <p>
                        Farm2User is a blockchain-inspired food traceability platform that connects producers,
                        distributors, regulators, and consumers through verifiable product identity and lifecycle records.
                    </p>
                    <div className="home-hero-actions">
                        <button className="btn btn-primary" type="button" onClick={onNavigateToVerify}>Verify Product</button>
                        <button className="btn btn-secondary" type="button" onClick={onNavigateToContact}>Contact Us</button>
                    </div>
                </div>
                <div className="home-hero-metrics">
                    <div className="stat-card">
                        <div className="label">Products Tracked</div>
                        <div className="value">{products.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="label">Live Activity</div>
                        <div className="value" style={{ fontSize: '1.2rem' }}>{loading ? 'Updating...' : 'Online'}</div>
                    </div>
                    <div className="stat-card">
                        <div className="label">Stakeholders</div>
                        <div className="value" style={{ fontSize: '1.2rem' }}>Farmers • Distributors • Regulators • Consumers</div>
                    </div>
                </div>
            </section>

            <section className="card">
                <div className="card-header">
                    <h3 style={{ margin: 0 }}>Live Transaction Activity</h3>
                    <p>Recent actions from stakeholders across the supply chain.</p>
                </div>
                <div className="activity-ticker">
                    <span>{activityItems[activityIndex]}</span>
                </div>
            </section>

            <section className="card">
                <div className="card-header">
                    <h3 style={{ margin: 0 }}>Our Partners</h3>
                    <p>Organizations integrating traceability and food safety with Farm2User.</p>
                </div>
                <div className="partners-grid">
                    {partnerList.map((partner) => (
                        <div key={partner} className="partner-pill">{partner}</div>
                    ))}
                </div>
            </section>

            <section className="grid grid-2">
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0 }}>Contact Us</h3>
                    </div>
                    <div className="home-contact">
                        <p>Email: support@farm2user.io</p>
                        <p>Partnerships: partners@farm2user.io</p>
                        <p>Compliance Desk: compliance@farm2user.io</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0 }}>Newsletter Signup</h3>
                    </div>
                    <div className="newsletter-row">
                        <input type="email" placeholder="Enter your email for updates" />
                        <button className="btn btn-primary" type="button">Subscribe</button>
                    </div>
                </div>
            </section>

            <section className="card">
                <div className="card-header">
                    <h3 style={{ margin: 0 }}>Blog & News</h3>
                </div>
                <div className="grid grid-3" style={{ marginBottom: 0 }}>
                    {blogPosts.map((post) => (
                        <article key={post.title} className="product-card" style={{ marginBottom: 0 }}>
                            <p className="label" style={{ marginBottom: '0.5rem' }}>{post.date}</p>
                            <h4 style={{ marginBottom: '0.6rem' }}>{post.title}</h4>
                            <p style={{ marginBottom: 0 }}>{post.summary}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="card">
                <div className="card-header">
                    <h3 style={{ margin: 0 }}>Testimonials</h3>
                </div>
                <div className="testimonial-shell">
                    <blockquote>
                        "{testimonials[testimonialIndex].quote}"
                    </blockquote>
                    <p>
                        <strong>{testimonials[testimonialIndex].name}</strong> - {testimonials[testimonialIndex].role}
                    </p>
                </div>
            </section>
        </div>
    )
}