import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faLeaf,
    faUserLarge,
    faCog,
    faBell,
    faCircleCheck,
    faArrowRightFromBracket,
    faWallet,
    faRepeat,
    faUnlink
} from '@fortawesome/free-solid-svg-icons'

export default function Navbar({ currentPage, setCurrentPage, navItems, account, isConnected, onConnect, onSwitchWallet, onDisconnectWallet, onOpenProfileTab, user, onLogout }) {
    const [showUserDropdown, setShowUserDropdown] = useState(false)

    const truncateAddress = (addr) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <FontAwesomeIcon icon={faLeaf} className="navbar-brand-icon" />
                Farm2User
            </div>

            <div className="navbar-links">
                {navItems.map((navItem) => (
                    <button
                        key={navItem.key}
                        className={currentPage === navItem.key ? 'active' : ''}
                        onClick={() => setCurrentPage(navItem.key)}
                    >
                        {navItem.key === 'verify' && <FontAwesomeIcon icon={faCircleCheck} className="verify-nav-icon" />}
                        {navItem.label}
                    </button>
                ))}

                <div className="navbar-divider"></div>

                <>
                    <div className="user-profile-container">
                        <button
                            className="user-profile-btn"
                            onClick={() => setShowUserDropdown(!showUserDropdown)}
                            title="User Profile"
                        >
                            <FontAwesomeIcon icon={faUserLarge} />
                        </button>

                        {showUserDropdown && (
                            <div className="user-dropdown">
                                <div className="user-dropdown-header">
                                    <div className="user-dropdown-name">{user?.fullName || 'User'}</div>
                                    <div className="user-dropdown-role">{user?.roleLabel || 'Account'}</div>
                                    <div className="user-dropdown-email">{user?.email || 'email@example.com'}</div>
                                </div>
                                <div className="user-dropdown-items">
                                    <button className="user-dropdown-item" onClick={() => {
                                        setShowUserDropdown(false)
                                        onOpenProfileTab?.('profile')
                                    }}>
                                        <FontAwesomeIcon icon={faUserLarge} /> Profile
                                    </button>
                                    <button className="user-dropdown-item" onClick={() => {
                                        setShowUserDropdown(false)
                                        onOpenProfileTab?.('settings')
                                    }}>
                                        <FontAwesomeIcon icon={faCog} /> Settings
                                    </button>
                                    <button className="user-dropdown-item" onClick={() => {
                                        setShowUserDropdown(false)
                                        onOpenProfileTab?.('settings')
                                    }}>
                                        <FontAwesomeIcon icon={faBell} /> Notifications
                                    </button>
                                    <button className="user-dropdown-item" onClick={() => {
                                        setShowUserDropdown(false)
                                        onOpenProfileTab?.('wallet')
                                    }}>
                                        <FontAwesomeIcon icon={faWallet} /> Wallet Management
                                    </button>
                                    <div className="user-dropdown-divider"></div>
                                    <button
                                        className="user-dropdown-item user-dropdown-logout"
                                        onClick={() => {
                                            setShowUserDropdown(false)
                                            onLogout()
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faArrowRightFromBracket} /> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {isConnected ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <div className="wallet-status">
                                <FontAwesomeIcon icon={faWallet} /> {truncateAddress(account)}
                            </div>
                            <button className="btn btn-secondary btn-small" onClick={onSwitchWallet} title="Switch wallet account">
                                <FontAwesomeIcon icon={faRepeat} />
                            </button>
                            <button className="btn btn-danger btn-small" onClick={onDisconnectWallet} title="Disconnect wallet from this session">
                                <FontAwesomeIcon icon={faUnlink} />
                            </button>
                        </div>
                    ) : (
                        <button className="btn wallet-btn" onClick={onConnect}>
                            <FontAwesomeIcon icon={faWallet} /> Connect Wallet
                        </button>
                    )}
                </>
            </div>
        </nav>
    )
}