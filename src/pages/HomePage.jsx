import React, { useEffect, useRef, useState } from 'react'
import apiService from '../services/apiService'

const partnerLogos = [
    { name: 'Tesco', logoUrl: 'https://cdn.simpleicons.org/tesco/00539f' },
    { name: 'ASDA', logoUrl: 'https://cdn.simpleicons.org/asda/68a51c' },
    { name: 'Morrisons', logoUrl: 'https://cdn.simpleicons.org/morrisons/00793b' },
    { name: 'KFC', logoUrl: 'https://cdn.simpleicons.org/kfc/f40027' },
    { name: 'Coca-Cola', logoUrl: 'https://cdn.simpleicons.org/cocacola/f40009' },
    { name: "McDonald's", logoUrl: 'https://cdn.simpleicons.org/mcdonalds/ffc72c' }
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

const defaultCryptoRows = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', value: 68771.3, change24h: -2.61 },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', value: 2079.53, change24h: -3.36 },
    { id: 'ripple', name: 'XRP', symbol: 'XRP', value: 1.4, change24h: -2.47 },
    { id: 'solana', name: 'Solana', symbol: 'SOL', value: 87.36, change24h: -2.56 },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', value: 0.72, change24h: -1.88 }
]

const testimonials = [
    {
        quote: 'Farm2User helped us prove authenticity for each batch in under 20 seconds.',
        name: 'Ngozi A.',
        role: 'Quality Manager, FreshRoute',
        avatar: 'https://i.pravatar.cc/96?img=47'
    },
    {
        quote: 'The compliance dashboard made audits faster and more evidence-based.',
        name: 'Hassan B.',
        role: 'Regulatory Inspector',
        avatar: 'https://i.pravatar.cc/96?img=13'
    },
    {
        quote: 'Customers trust us more because they can verify product history instantly.',
        name: 'Dara E.',
        role: 'Retail Operations Lead',
        avatar: 'https://i.pravatar.cc/96?img=31'
    },
    {
        quote: 'Our farmers now close partnerships faster because buyers can trace every batch with confidence.',
        name: 'Amaka O.',
        role: 'Farm Operations Lead',
        avatar: 'https://i.pravatar.cc/96?img=44'
    },
    {
        quote: 'We reduced verification back-and-forth by over 60% with a single transparent product timeline.',
        name: 'Daniel K.',
        role: 'Compliance Analyst',
        avatar: 'https://i.pravatar.cc/96?img=66'
    }
]

export default function HomePage({ onNavigateToVerify }) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [testimonialIndex, setTestimonialIndex] = useState(0)
    const [cryptoRows, setCryptoRows] = useState(defaultCryptoRows)
    const [cryptoLoading, setCryptoLoading] = useState(true)
    const [cryptoUpdatedAt, setCryptoUpdatedAt] = useState(null)
    const [cryptoPulseById, setCryptoPulseById] = useState({})
    const pulseTimeoutsRef = useRef({})

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

    useEffect(() => {
        const interval = setInterval(() => {
            setTestimonialIndex((current) => (current + 1) % testimonials.length)
        }, 2500)

        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        let mounted = true

        const fetchCrypto = async () => {
            try {
                const response = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,solana,cardano&vs_currencies=usd&include_24hr_change=true',
                    {
                        headers: {
                            accept: 'application/json'
                        }
                    }
                )

                if (!response.ok) {
                    throw new Error(`Failed to fetch prices: ${response.status}`)
                }

                const data = await response.json()
                const nextRows = defaultCryptoRows.map((row) => {
                    const live = data[row.id] || {}
                    return {
                        ...row,
                        value: Number.isFinite(live.usd) ? live.usd : row.value,
                        change24h: Number.isFinite(live.usd_24h_change) ? live.usd_24h_change : row.change24h
                    }
                })

                if (mounted) {
                    setCryptoRows((previousRows) => {
                        const previousById = new Map(previousRows.map((row) => [row.id, row]))
                        const pulses = {}

                        nextRows.forEach((row) => {
                            const previous = previousById.get(row.id)
                            if (!previous || previous.value === row.value) {
                                return
                            }

                            pulses[row.id] = row.value > previous.value ? 'up' : 'down'
                        })

                        if (Object.keys(pulses).length > 0) {
                            setCryptoPulseById((current) => ({ ...current, ...pulses }))

                            Object.keys(pulses).forEach((id) => {
                                clearTimeout(pulseTimeoutsRef.current[id])
                                pulseTimeoutsRef.current[id] = setTimeout(() => {
                                    if (!mounted) {
                                        return
                                    }

                                    setCryptoPulseById((current) => {
                                        if (!current[id]) {
                                            return current
                                        }

                                        const next = { ...current }
                                        delete next[id]
                                        return next
                                    })
                                }, 900)
                            })
                        }

                        return nextRows
                    })
                    setCryptoUpdatedAt(new Date())
                }
            } catch {
                if (mounted) {
                    setCryptoRows(defaultCryptoRows)
                }
            } finally {
                if (mounted) {
                    setCryptoLoading(false)
                }
            }
        }

        fetchCrypto()
        const timer = setInterval(fetchCrypto, 30000)

        return () => {
            mounted = false
            clearInterval(timer)
            Object.values(pulseTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId))
        }
    }, [])

    const featuredPost = blogPosts[0]
    const latestPosts = blogPosts.slice(1)

    const formatUsd = (value) => {
        const normalized = Number.isFinite(value) ? value : 0
        if (normalized >= 1000) {
            return `$${normalized.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        }
        if (normalized >= 1) {
            return `$${normalized.toFixed(2)}`
        }
        return `$${normalized.toFixed(4)}`
    }

    const formatChange = (value) => {
        const normalized = Number.isFinite(value) ? value : 0
        const sign = normalized >= 0 ? '+' : ''
        return `${sign}${normalized.toFixed(2)}%`
    }

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
                        <div className="value" style={{ fontSize: '1.2rem' }}>Producers • Distributors • Regulators • Consumers</div>
                    </div>
                </div>
            </section>

            <section className="card news-hub-card">
                <div className="news-hub-header">
                    <div>
                        <h3>Market & News Hub</h3>
                        <p>Live crypto prices and featured stories from the Farm2User ecosystem.</p>
                    </div>
                    <span className="news-hub-live-badge">{cryptoLoading ? 'Syncing...' : 'Live updates'}</span>
                </div>

                <div className="crypto-strip" aria-label="Top five cryptocurrency values">
                    {cryptoRows.map((coin) => {
                        const isNegative = coin.change24h < 0
                        const pulseState = cryptoPulseById[coin.id]
                        return (
                            <article key={coin.id} className={`crypto-tile${pulseState ? ` crypto-tile-${pulseState}` : ''}`}>
                                <p className="crypto-name">{coin.name}</p>
                                <p className="crypto-value">{formatUsd(coin.value)}</p>
                                <p className={`crypto-change ${isNegative ? 'negative' : 'positive'}`}>
                                    {formatChange(coin.change24h)}
                                </p>
                            </article>
                        )
                    })}
                </div>

                <div className="news-desk-grid">
                    <article className="news-feature-card">
                        <p className="news-meta">Featured Story • {featuredPost.date}</p>
                        <h4>{featuredPost.title}</h4>
                        <p>{featuredPost.summary}</p>
                        <button type="button" className="btn btn-secondary news-read-btn">Read story</button>
                    </article>

                    <aside className="news-feed-list">
                        <p className="news-feed-title">Latest Updates</p>
                        {latestPosts.map((post) => (
                            <article key={post.title} className="news-feed-item">
                                <p className="news-meta">{post.date}</p>
                                <h5>{post.title}</h5>
                                <p>{post.summary}</p>
                            </article>
                        ))}
                        <p className="news-refresh-time">
                            {cryptoUpdatedAt ? `Prices refreshed at ${cryptoUpdatedAt.toLocaleTimeString()}` : 'Waiting for first market sync...'}
                        </p>
                    </aside>
                </div>
            </section>

            <section className="card">
                <div className="card-header">
                    <p style={{ margin: 0, textAlign: 'center' }}>Organizations integrating traceability and food safety with Farm2User.</p>
                </div>
                <div className="partners-marquee" aria-label="Partner organizations">
                    <div className="partners-track">
                        {[...partnerLogos, ...partnerLogos].map((partner, index) => (
                            <div key={`${partner.name}-${index}`} className="partner-logo-item" aria-hidden={index >= partnerLogos.length}>
                                <img
                                    src={partner.logoUrl}
                                    alt={`${partner.name} logo`}
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    onError={(event) => {
                                        event.currentTarget.style.display = 'none'
                                        event.currentTarget.parentElement?.classList.add('logo-fallback')
                                    }}
                                />
                                <span>{partner.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="card success-stories-card">
                <div className="success-stories-header">
                    <h3 className="success-stories-title">"Our Success Stories"</h3>
                </div>
                <div className="success-stories-shell">
                    <blockquote className="success-quote">
                        <span className="success-quote-mark">“</span>
                        {testimonials[testimonialIndex].quote}
                        <span className="success-quote-mark">”</span>
                    </blockquote>
                    <p className="success-quote-author">{testimonials[testimonialIndex].name}</p>
                    <p className="success-quote-role">{testimonials[testimonialIndex].role}</p>
                    <div className="testimonial-indicators" aria-label="Select testimonial">
                        {testimonials.map((item, index) => (
                            <button
                                key={item.name}
                                type="button"
                                className={`testimonial-indicator ${index === testimonialIndex ? 'active' : ''}`}
                                onClick={() => setTestimonialIndex(index)}
                                aria-label={`Show testimonial from ${item.name}`}
                                aria-pressed={index === testimonialIndex}
                            >
                                <img src={item.avatar} alt={item.name} loading="lazy" />
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}