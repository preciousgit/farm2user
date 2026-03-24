import { Suspense, lazy, useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinkedinIn, faInstagram, faFacebookF, faXTwitter } from '@fortawesome/free-brands-svg-icons'
import './App.css'
import './styles/Register.css'
import './styles/Login.css'
import Navbar from './components/Navbar'
import authService from './services/authService'

const ConsumerDashboard = lazy(() => import('./pages/ConsumerDashboard'))
const HomePage = lazy(() => import('./pages/HomePage'))
const ProductVerification = lazy(() => import('./pages/ProductVerification'))
const DistributorDashboard = lazy(() => import('./pages/DistributorDashboard'))
const FarmerDashboard = lazy(() => import('./pages/FarmerDashboard'))
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'))
const RegulatorView = lazy(() => import('./pages/RegulatorView'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Register = lazy(() => import('./pages/Register'))
const Login = lazy(() => import('./pages/Login'))

const ROLE_CONFIG = {
    consumer: {
        label: 'Consumer',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'consumer', label: 'Consumer Dashboard' },
            { key: 'verify', label: 'Verify Product' }
        ]
    },
    farmer: {
        label: 'Producer',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'farmer', label: 'Producer Dashboard' },
            { key: 'verify', label: 'Verify Product' }
        ]
    },
    distributor: {
        label: 'Distributor',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'distributor', label: 'Distributor Dashboard' },
            { key: 'verify', label: 'Verify Product' }
        ]
    },
    analyst: {
        label: 'Data Analyst',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'analytics', label: 'Analytics Dashboard' },
            { key: 'verify', label: 'Verify Product' }
        ]
    },
    regulator: {
        label: 'Regulator',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'regulator', label: 'Regulator View' },
            { key: 'verify', label: 'Verify Product' }
        ]
    },
    admin: {
        label: 'Admin',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'regulator', label: 'Admin Dashboard' },
            { key: 'verify', label: 'Verify Product' }
        ]
    },
    supplier: {
        label: 'Supplier',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'distributor', label: 'Supplier Dashboard' },
            { key: 'verify', label: 'Verify Product' }
        ]
    },
    inspector: {
        label: 'Inspector',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'regulator', label: 'Inspection Console' },
            { key: 'verify', label: 'Verify Product' }
        ]
    }
}

const getRoleConfig = (role) => ROLE_CONFIG[role] || ROLE_CONFIG.consumer

const getDefaultPageForUser = (user) => getRoleConfig(user?.role).homePage

const isPageAllowedForRole = (role, page) => getRoleConfig(role).navItems.some((item) => item.key === page)

function App() {
    const [currentPage, setCurrentPage] = useState('login')
    const [account, setAccount] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [user, setUser] = useState(null)
    const [profileTab, setProfileTab] = useState('profile')

    useEffect(() => {
        checkWalletConnection()

        const searchParams = new URLSearchParams(window.location.search)
        const requestedPage = searchParams.get('page')
        if (requestedPage === 'verify') {
            setCurrentPage('verify')
        }

        const sessionUser = authService.getCurrentUser()
        if (sessionUser) {
            const hydratedUser = {
                ...sessionUser,
                roleLabel: getRoleConfig(sessionUser.role).label
            }

            setIsLoggedIn(true)
            setUser(hydratedUser)
            setCurrentPage(getDefaultPageForUser(sessionUser))
        }
    }, [])

    useEffect(() => {
        if (typeof window.ethereum === 'undefined') return undefined

        const handleAccountsChanged = async (accounts) => {
            if (!accounts || accounts.length === 0) {
                setAccount(null)
                setIsConnected(false)
                return
            }

            const nextAccount = accounts[0]
            setAccount(nextAccount)
            setIsConnected(true)

            if (user?.id) {
                const updatedUser = authService.linkWallet(user.id, nextAccount)
                if (updatedUser) setUser({ ...updatedUser, roleLabel: getRoleConfig(updatedUser.role).label })
            }
        }

        window.ethereum.on('accountsChanged', handleAccountsChanged)
        return () => window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
    }, [user])

    const checkWalletConnection = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' })
                if (accounts.length > 0) {
                    setAccount(accounts[0])
                    setIsConnected(true)
                }
            } catch (error) {
                console.error('Error checking wallet:', error)
            }
        }
    }

    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
                setAccount(accounts[0])
                setIsConnected(true)

                if (user?.id && accounts[0]) {
                    const updatedUser = authService.linkWallet(user.id, accounts[0])
                    if (updatedUser) setUser({ ...updatedUser, roleLabel: getRoleConfig(updatedUser.role).label })
                }
            } catch (error) {
                console.error('Error connecting wallet:', error)
            }
        } else {
            alert('Please install MetaMask')
        }
    }

    const switchWallet = async () => {
        if (typeof window.ethereum === 'undefined') {
            alert('Please install MetaMask')
            return
        }

        try {
            await window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] })
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
            if (accounts.length > 0) {
                setAccount(accounts[0])
                setIsConnected(true)
                if (user?.id) {
                    const updatedUser = authService.linkWallet(user.id, accounts[0])
                    if (updatedUser) setUser({ ...updatedUser, roleLabel: getRoleConfig(updatedUser.role).label })
                }
            }
        } catch (error) {
            console.error('Error switching wallet:', error)
        }
    }

    const disconnectWallet = () => {
        setIsConnected(false)
        setAccount(null)
    }

    const renderPage = () => {
        if (!isLoggedIn) {
            switch (currentPage) {
                case 'register':
                    return <Register
                        onRegisterComplete={() => setCurrentPage('login')}
                        onNavigateToLogin={() => setCurrentPage('login')}
                    />
                case 'verify':
                    return <ProductVerification />
                case 'login':
                default:
                    return <Login
                        onLoginSuccess={handleLoginSuccess}
                        onNavigateToRegister={() => setCurrentPage('register')}
                    />
            }
        }

        switch (currentPage) {
            case 'home':
                return <HomePage onNavigateToVerify={() => setCurrentPage('verify')} />
            case 'consumer':
                return <ConsumerDashboard onNavigateToVerify={() => setCurrentPage('verify')} />
            case 'verify':
                return <ProductVerification />
            case 'farmer':
                return <FarmerDashboard account={account} user={user} />
            case 'distributor':
                return <DistributorDashboard account={account} user={user} onNavigateToVerify={() => setCurrentPage('verify')} />
            case 'analytics':
                return <AnalyticsDashboard />
            case 'regulator':
                return <RegulatorView />
            case 'profile':
                return (
                    <UserProfile
                        user={user}
                        initialTab={profileTab}
                        onUserUpdate={(updatedUser) => setUser({ ...updatedUser, roleLabel: getRoleConfig(updatedUser.role).label })}
                        account={account}
                        isConnected={isConnected}
                        onConnectWallet={connectWallet}
                        onSwitchWallet={switchWallet}
                        onDisconnectWallet={disconnectWallet}
                    />
                )
            default:
                return <HomePage onNavigateToVerify={() => setCurrentPage('verify')} />
        }
    }

    const handleLoginSuccess = (userData) => {
        const hydratedUser = {
            ...userData,
            roleLabel: getRoleConfig(userData.role).label
        }

        setIsLoggedIn(true)
        setUser(hydratedUser)
        setCurrentPage(getDefaultPageForUser(userData))
    }

    const handlePageChange = (page) => {
        if (!user || isPageAllowedForRole(user.role, page)) {
            setCurrentPage(page)
        }
    }

    const renderLoadingState = () => (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading dashboard...</p>
        </div>
    )

    return (
        <div className="app">
            {isLoggedIn ? (
                <>
                    <Navbar
                        currentPage={currentPage}
                        setCurrentPage={handlePageChange}
                        navItems={getRoleConfig(user?.role).navItems}
                        account={account}
                        isConnected={isConnected}
                        onConnect={connectWallet}
                        onSwitchWallet={switchWallet}
                        onDisconnectWallet={disconnectWallet}
                        onOpenProfileTab={(tab) => {
                            setProfileTab(tab)
                            setCurrentPage('profile')
                        }}
                        user={user}
                        onLogout={() => {
                            authService.logout()
                            disconnectWallet()
                            setIsLoggedIn(false)
                            setUser(null)
                            setCurrentPage('login')
                        }}
                    />

                    <main className="main-content">
                        <Suspense fallback={renderLoadingState()}>
                            {renderPage()}
                        </Suspense>
                    </main>

                    <footer className="footer offmarket-footer">
                        <div className="footer-newsletter">
                            <div>
                                <h3>Sign up for our newsletter!</h3>
                                <p>Stay up to date with supply-chain tips, alerts, and platform updates.</p>
                            </div>
                            <div className="footer-newsletter-row">
                                <input type="email" placeholder="Enter your email address here" aria-label="Email address" />
                                <button className="btn btn-primary" type="button">Subscribe</button>
                            </div>
                        </div>

                        <div className="footer-main-grid">
                            <div className="footer-brand-col">
                                <h4>Farm2User</h4>
                                <p>
                                    Farm2User connects farms, distributors, regulators, and consumers
                                    with transparent product traceability and verifiable lifecycle data.
                                </p>
                                <div className="footer-social-links" aria-label="Farm2User social links">
                                    <a className="footer-social-link" href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                                        <FontAwesomeIcon icon={faLinkedinIn} />
                                    </a>
                                    <a className="footer-social-link" href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                                        <FontAwesomeIcon icon={faInstagram} />
                                    </a>
                                    <a className="footer-social-link" href="https://www.facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                                        <FontAwesomeIcon icon={faFacebookF} />
                                    </a>
                                    <a className="footer-social-link" href="https://x.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                                        <FontAwesomeIcon icon={faXTwitter} />
                                    </a>
                                </div>
                            </div>

                            <div className="footer-producers-col">
                                <h5>For Producers</h5>
                                <p>Register Product</p>
                                <p>Batch Tracking</p>
                                <p>Quality Records</p>
                            </div>

                            <div className="footer-partners-col">
                                <h5>For Partners</h5>
                                <p>Become a Partner</p>
                                <p>Compliance Support</p>
                                <p>Enterprise Integrations</p>
                            </div>

                            <div className="footer-services-col">
                                <h5>Services</h5>
                                <p>Product Verification</p>
                                <p>Audit Trail</p>
                                <p>Analytics Dashboard</p>
                            </div>

                            <div className="footer-contact-col">
                                <h5>Contact</h5>
                                <p>Heritage Tower</p>
                                <p>E14 3NW</p>
                                <p>info@farm2user.uk</p>
                                <p>+44 7823713083</p>
                            </div>
                        </div>

                        <div className="footer-bottom-row">
                            <p>&copy; 2026 Farm2User. All rights reserved.</p>
                            <div>
                                <span>Terms of Policy</span>
                                <span>Privacy Policy</span>
                                <span>Cookie Policy</span>
                            </div>
                        </div>
                    </footer>
                </>
            ) : (
                <div className="auth-modal-overlay">
                    <div className="auth-modal-background"></div>
                    <div className="auth-modal-content">
                        <Suspense fallback={renderLoadingState()}>
                            {renderPage()}
                        </Suspense>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
