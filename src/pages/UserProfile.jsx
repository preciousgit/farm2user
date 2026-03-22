import React, { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUser,
    faSliders,
    faWallet,
    faShieldHalved,
    faFloppyDisk,
    faRepeat,
    faUnlink
} from '@fortawesome/free-solid-svg-icons'
import authService from '../services/authService'

const PROFILE_TABS = {
    profile: 'profile',
    settings: 'settings',
    wallet: 'wallet',
    security: 'security'
}

const ROLE_FIELD_MAP = {
    farmer: ['farmName', 'farmType', 'certificationId'],
    distributor: ['companyName', 'logisticsRegion', 'fleetId'],
    supplier: ['companyName', 'supplyCategory', 'warehouseCode'],
    inspector: ['agencyName', 'licenseNumber', 'jurisdiction'],
    regulator: ['agencyName', 'licenseNumber', 'jurisdiction'],
    admin: ['organizationUnit', 'accessTier', 'employeeId'],
    analyst: ['organization', 'analyticsFocus', 'reportingRegion'],
    consumer: ['preferredStore', 'dietaryPreference', 'preferredRegion']
}

const humanize = (value) => value.replace(/([A-Z])/g, ' $1').replace(/^./, (match) => match.toUpperCase())

export default function UserProfile({
    user,
    initialTab,
    onUserUpdate,
    account,
    isConnected,
    onConnectWallet,
    onSwitchWallet,
    onDisconnectWallet
}) {
    const [activeTab, setActiveTab] = useState(initialTab || PROFILE_TABS.profile)
    const [profileForm, setProfileForm] = useState({
        fullName: user?.fullName || '',
        phoneNumber: user?.profile?.phoneNumber || '',
        organization: user?.profile?.organization || '',
        location: user?.profile?.location || '',
        bio: user?.profile?.bio || ''
    })
    const [settingsForm, setSettingsForm] = useState({
        language: user?.settings?.language || 'English',
        timezone: user?.settings?.timezone || 'UTC',
        notifications: {
            supplyAlerts: user?.settings?.notifications?.supplyAlerts ?? true,
            productRecalls: user?.settings?.notifications?.productRecalls ?? true,
            weeklyDigest: user?.settings?.notifications?.weeklyDigest ?? false
        }
    })
    const [stakeholderDetails, setStakeholderDetails] = useState(user?.stakeholderProfile?.details || {})
    const [securityForm, setSecurityForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [message, setMessage] = useState(null)

    const stakeholderKeys = useMemo(() => {
        return ROLE_FIELD_MAP[user?.role] || Object.keys(user?.stakeholderProfile?.details || {})
    }, [user])

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab)
        }
    }, [initialTab])

    useEffect(() => {
        setProfileForm({
            fullName: user?.fullName || '',
            phoneNumber: user?.profile?.phoneNumber || '',
            organization: user?.profile?.organization || '',
            location: user?.profile?.location || '',
            bio: user?.profile?.bio || ''
        })
        setSettingsForm({
            language: user?.settings?.language || 'English',
            timezone: user?.settings?.timezone || 'UTC',
            notifications: {
                supplyAlerts: user?.settings?.notifications?.supplyAlerts ?? true,
                productRecalls: user?.settings?.notifications?.productRecalls ?? true,
                weeklyDigest: user?.settings?.notifications?.weeklyDigest ?? false
            }
        })
        setStakeholderDetails(user?.stakeholderProfile?.details || {})
    }, [user])

    const handleSaveProfile = () => {
        const updatedUser = authService.updateUserProfile(user.id, {
            fullName: profileForm.fullName,
            profile: {
                phoneNumber: profileForm.phoneNumber,
                organization: profileForm.organization,
                location: profileForm.location,
                bio: profileForm.bio
            },
            stakeholderDetails
        })

        if (updatedUser) {
            onUserUpdate(updatedUser)
            setMessage({ type: 'success', text: 'Profile updated successfully.' })
        }
    }

    const handleSaveSettings = () => {
        const updatedUser = authService.updateUserSettings(user.id, settingsForm)
        if (updatedUser) {
            onUserUpdate(updatedUser)
            setMessage({ type: 'success', text: 'Settings updated successfully.' })
        }
    }

    const handleChangePassword = () => {
        if (securityForm.newPassword !== securityForm.confirmPassword) {
            setMessage({ type: 'error', text: 'New password and confirmation do not match.' })
            return
        }

        try {
            const updatedUser = authService.changePassword(user.id, securityForm.currentPassword, securityForm.newPassword)
            if (updatedUser) {
                onUserUpdate(updatedUser)
                setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                setMessage({ type: 'success', text: 'Password changed successfully.' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message })
        }
    }

    const handleDisconnectWallet = () => {
        onDisconnectWallet()
        setMessage({ type: 'info', text: 'Wallet disconnected from this session.' })
    }

    const handleUnlinkWallet = (walletAddress) => {
        const updatedUser = authService.unlinkWallet(user.id, walletAddress)
        if (updatedUser) {
            onUserUpdate(updatedUser)
            setMessage({ type: 'success', text: 'Wallet removed from linked wallets.' })
        }
    }

    return (
        <div>
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h2><FontAwesomeIcon icon={faUser} /> User Profile & Settings</h2>
                <p>Manage profile identity, stakeholder metadata, account settings, and wallet controls.</p>
            </div>

            {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button type="button" className={`btn ${activeTab === PROFILE_TABS.profile ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(PROFILE_TABS.profile)}>
                        <FontAwesomeIcon icon={faUser} /> Profile
                    </button>
                    <button type="button" className={`btn ${activeTab === PROFILE_TABS.settings ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(PROFILE_TABS.settings)}>
                        <FontAwesomeIcon icon={faSliders} /> Settings
                    </button>
                    <button type="button" className={`btn ${activeTab === PROFILE_TABS.wallet ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(PROFILE_TABS.wallet)}>
                        <FontAwesomeIcon icon={faWallet} /> Wallet
                    </button>
                    <button type="button" className={`btn ${activeTab === PROFILE_TABS.security ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(PROFILE_TABS.security)}>
                        <FontAwesomeIcon icon={faShieldHalved} /> Security
                    </button>
                </div>
            </div>

            {activeTab === PROFILE_TABS.profile && (
                <div className="card">
                    <div className="grid grid-2" style={{ gap: '1rem' }}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input value={profileForm.fullName} onChange={(event) => setProfileForm({ ...profileForm, fullName: event.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input value={user?.email || ''} disabled />
                        </div>
                        <div className="form-group">
                            <label>Stakeholder ID</label>
                            <input value={user?.stakeholderProfile?.stakeholderId || ''} disabled />
                        </div>
                        <div className="form-group">
                            <label>Role</label>
                            <input value={user?.roleLabel || user?.role || ''} disabled />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input value={profileForm.phoneNumber} onChange={(event) => setProfileForm({ ...profileForm, phoneNumber: event.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Organization</label>
                            <input value={profileForm.organization} onChange={(event) => setProfileForm({ ...profileForm, organization: event.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <input value={profileForm.location} onChange={(event) => setProfileForm({ ...profileForm, location: event.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Bio</label>
                            <input value={profileForm.bio} onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })} />
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '1rem' }}>
                        <div className="card-header">
                            <h3 style={{ margin: 0 }}>Stakeholder-Specific Details</h3>
                        </div>
                        <div className="grid grid-2" style={{ gap: '1rem', marginTop: '1rem' }}>
                            {stakeholderKeys.map((fieldKey) => (
                                <div className="form-group" key={fieldKey}>
                                    <label>{humanize(fieldKey)}</label>
                                    <input
                                        value={stakeholderDetails[fieldKey] || ''}
                                        onChange={(event) => setStakeholderDetails({
                                            ...stakeholderDetails,
                                            [fieldKey]: event.target.value
                                        })}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="button" className="btn btn-primary" onClick={handleSaveProfile}>
                        <FontAwesomeIcon icon={faFloppyDisk} /> Save Profile
                    </button>
                </div>
            )}

            {activeTab === PROFILE_TABS.settings && (
                <div className="card">
                    <div className="grid grid-2" style={{ gap: '1rem' }}>
                        <div className="form-group">
                            <label>Language</label>
                            <select value={settingsForm.language} onChange={(event) => setSettingsForm({ ...settingsForm, language: event.target.value })}>
                                <option value="English">English</option>
                                <option value="French">French</option>
                                <option value="Spanish">Spanish</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Timezone</label>
                            <select value={settingsForm.timezone} onChange={(event) => setSettingsForm({ ...settingsForm, timezone: event.target.value })}>
                                <option value="UTC">UTC</option>
                                <option value="GMT+1">GMT+1</option>
                                <option value="GMT+2">GMT+2</option>
                                <option value="GMT+3">GMT+3</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
                        <label><input type="checkbox" checked={settingsForm.notifications.supplyAlerts} onChange={(event) => setSettingsForm({ ...settingsForm, notifications: { ...settingsForm.notifications, supplyAlerts: event.target.checked } })} /> Supply chain alerts</label>
                        <label><input type="checkbox" checked={settingsForm.notifications.productRecalls} onChange={(event) => setSettingsForm({ ...settingsForm, notifications: { ...settingsForm.notifications, productRecalls: event.target.checked } })} /> Product recall notices</label>
                        <label><input type="checkbox" checked={settingsForm.notifications.weeklyDigest} onChange={(event) => setSettingsForm({ ...settingsForm, notifications: { ...settingsForm.notifications, weeklyDigest: event.target.checked } })} /> Weekly digest email</label>
                    </div>

                    <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleSaveSettings}>
                        <FontAwesomeIcon icon={faFloppyDisk} /> Save Settings
                    </button>
                </div>
            )}

            {activeTab === PROFILE_TABS.wallet && (
                <div className="card">
                    <div className="stat-card" style={{ marginBottom: '1rem' }}>
                        <div className="label">Current Session Wallet</div>
                        <div className="value" style={{ fontSize: '1rem' }}>{isConnected && account ? account : 'Not connected'}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <button type="button" className="btn btn-primary" onClick={onConnectWallet}>
                            <FontAwesomeIcon icon={faWallet} /> Connect Wallet
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onSwitchWallet}>
                            <FontAwesomeIcon icon={faRepeat} /> Switch Wallet
                        </button>
                        <button type="button" className="btn btn-danger" onClick={handleDisconnectWallet}>
                            <FontAwesomeIcon icon={faUnlink} /> Disconnect Wallet
                        </button>
                    </div>

                    <div className="card-header" style={{ marginBottom: '0.75rem' }}>
                        <h3 style={{ margin: 0 }}>Linked Wallet Accounts</h3>
                    </div>

                    {(user?.linkedWallets || []).length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No linked wallets yet. Connect one to link it to your profile.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.6rem' }}>
                            {(user?.linkedWallets || []).map((wallet) => (
                                <div key={wallet} className="product-card" style={{ marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{wallet}</span>
                                    <button type="button" className="btn btn-danger btn-small" onClick={() => handleUnlinkWallet(wallet)}>
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === PROFILE_TABS.security && (
                <div className="card">
                    <div className="grid grid-2" style={{ gap: '1rem' }}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input type="password" value={securityForm.currentPassword} onChange={(event) => setSecurityForm({ ...securityForm, currentPassword: event.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input type="password" value={securityForm.newPassword} onChange={(event) => setSecurityForm({ ...securityForm, newPassword: event.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" value={securityForm.confirmPassword} onChange={(event) => setSecurityForm({ ...securityForm, confirmPassword: event.target.value })} />
                        </div>
                    </div>

                    <button type="button" className="btn btn-primary" onClick={handleChangePassword}>
                        <FontAwesomeIcon icon={faShieldHalved} /> Update Password
                    </button>
                </div>
            )}
        </div>
    )
}
