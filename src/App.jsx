import { Suspense, lazy, useState, useEffect } from 'react'
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
            { key: 'verify', label: 'Verify Product' },
            { key: 'profile', label: 'Profile' }
        ]
    },
    farmer: {
        label: 'Farmer / Producer',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'farmer', label: 'Farmer Dashboard' },
            { key: 'verify', label: 'Verify Product' },
            { key: 'profile', label: 'Profile' }
        ]
    },
    distributor: {
        label: 'Distributor',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'distributor', label: 'Distributor Dashboard' },
            { key: 'verify', label: 'Verify Product' },
            { key: 'profile', label: 'Profile' }
        ]
    },
    analyst: {
        label: 'Data Analyst',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'analytics', label: 'Analytics Dashboard' },
            { key: 'verify', label: 'Verify Product' },
            { key: 'profile', label: 'Profile' }
        ]
    },
    regulator: {
        label: 'Regulator',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'regulator', label: 'Regulator View' },
            { key: 'verify', label: 'Verify Product' },
            { key: 'profile', label: 'Profile' }
        ]
    },
    admin: {
        label: 'Admin',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'regulator', label: 'Admin Dashboard' },
            { key: 'verify', label: 'Verify Product' },
            { key: 'profile', label: 'Profile' }
        ]
    },
    supplier: {
        label: 'Supplier',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'distributor', label: 'Supplier Dashboard' },
            { key: 'verify', label: 'Verify Product' },
            { key: 'profile', label: 'Profile' }
        ]
    },
    inspector: {
        label: 'Inspector',
        homePage: 'home',
        navItems: [
            { key: 'home', label: 'Home' },
            { key: 'regulator', label: 'Inspection Console' },
            { key: 'verify', label: 'Verify Product' },
            { key: 'profile', label: 'Profile' }
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
                return <HomePage onNavigateToVerify={() => setCurrentPage('verify')} onNavigateToContact={() => setCurrentPage('home')} />
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
                return <HomePage onNavigateToVerify={() => setCurrentPage('verify')} onNavigateToContact={() => setCurrentPage('home')} />
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
                            <div>
                                <h4>Farm2User</h4>
                                <p>
                                    Farm2User connects farms, distributors, regulators, and consumers
                                    with transparent product traceability and verifiable lifecycle data.
                                </p>
                            </div>

                            <div>
                                <h5>For Producers</h5>
                                <p>Register Product</p>
                                <p>Batch Tracking</p>
                                <p>Quality Records</p>
                            </div>

                            <div>
                                <h5>For Partners</h5>
                                <p>Become a Partner</p>
                                <p>Compliance Support</p>
                                <p>Enterprise Integrations</p>
                            </div>

                            <div>
                                <h5>Services</h5>
                                <p>Product Verification</p>
                                <p>Audit Trail</p>
                                <p>Analytics Dashboard</p>
                            </div>

                            <div>
                                <h5>Contact Details</h5>
                                <p>Main Street 2</p>
                                <p>Lagos, Nigeria</p>
                                <p>info@farm2user.io</p>
                                <p>+234 000 000 0000</p>
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
