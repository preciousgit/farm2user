const USERS_STORAGE_KEY = 'farm2user-users'
const SESSION_STORAGE_KEY = 'farm2user-session'

export const ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin' },
    { value: 'consumer', label: 'Consumer' },
    { value: 'farmer', label: 'Farmer / Producer' },
    { value: 'supplier', label: 'Supplier' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'inspector', label: 'Inspector' },
    { value: 'analyst', label: 'Data Analyst' },
    { value: 'regulator', label: 'Regulator' }
]

const sanitizeUser = (user) => {
    if (!user) return null

    const { password, ...safeUser } = user
    return safeUser
}

const getStoredUsers = () => {
    if (typeof window === 'undefined') return []

    try {
        const storedUsers = window.localStorage.getItem(USERS_STORAGE_KEY)
        return storedUsers ? JSON.parse(storedUsers) : []
    } catch {
        return []
    }
}

const saveStoredUsers = (users) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

const saveSessionUser = (user) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sanitizeUser(user)))
}

const normalizeEmail = (email) => email.trim().toLowerCase()

const ROLE_PREFIX = {
    admin: 'ADM',
    consumer: 'CNS',
    farmer: 'FRM',
    supplier: 'SUP',
    distributor: 'DST',
    inspector: 'INSP',
    analyst: 'ANL',
    regulator: 'REG'
}

const generateStakeholderId = (role, users) => {
    const prefix = ROLE_PREFIX[role] || 'USR'
    const usedIds = new Set(users.map((user) => user?.stakeholderProfile?.stakeholderId).filter(Boolean))
    let counter = 1

    while (usedIds.has(`${prefix}-${String(counter).padStart(4, '0')}`)) {
        counter += 1
    }

    return `${prefix}-${String(counter).padStart(4, '0')}`
}

const getStakeholderTemplate = (role) => {
    const templates = {
        farmer: {
            primaryTitle: 'Farmer / Producer',
            details: {
                farmName: '',
                farmType: '',
                certificationId: ''
            }
        },
        distributor: {
            primaryTitle: 'Distributor',
            details: {
                companyName: '',
                logisticsRegion: '',
                fleetId: ''
            }
        },
        supplier: {
            primaryTitle: 'Supplier',
            details: {
                companyName: '',
                supplyCategory: '',
                warehouseCode: ''
            }
        },
        inspector: {
            primaryTitle: 'Inspector',
            details: {
                agencyName: '',
                licenseNumber: '',
                jurisdiction: ''
            }
        },
        regulator: {
            primaryTitle: 'Regulator',
            details: {
                agencyName: '',
                licenseNumber: '',
                jurisdiction: ''
            }
        },
        admin: {
            primaryTitle: 'Platform Admin',
            details: {
                organizationUnit: '',
                accessTier: 'Supervised',
                employeeId: ''
            }
        },
        analyst: {
            primaryTitle: 'Data Analyst',
            details: {
                organization: '',
                analyticsFocus: '',
                reportingRegion: ''
            }
        },
        consumer: {
            primaryTitle: 'Consumer',
            details: {
                preferredStore: '',
                dietaryPreference: '',
                preferredRegion: ''
            }
        }
    }

    return templates[role] || {
        primaryTitle: 'User',
        details: {
            organization: '',
            notes: '',
            region: ''
        }
    }
}

const withDefaultProfile = (user, users) => {
    const stakeholderTemplate = getStakeholderTemplate(user.role)
    const stakeholderId = user.stakeholderProfile?.stakeholderId || generateStakeholderId(user.role, users)

    return {
        ...user,
        stakeholderProfile: {
            stakeholderId,
            primaryTitle: user.stakeholderProfile?.primaryTitle || stakeholderTemplate.primaryTitle,
            details: {
                ...stakeholderTemplate.details,
                ...(user.stakeholderProfile?.details || {})
            }
        },
        profile: {
            phoneNumber: '',
            organization: '',
            location: '',
            bio: '',
            ...(user.profile || {})
        },
        settings: {
            language: 'English',
            timezone: 'UTC',
            notifications: {
                supplyAlerts: true,
                productRecalls: true,
                weeklyDigest: false
            },
            ...(user.settings || {})
        },
        linkedWallets: Array.isArray(user.linkedWallets) ? user.linkedWallets : []
    }
}

const saveUsersAndMaybeSession = (users, activeUserId) => {
    saveStoredUsers(users)

    if (!activeUserId) return null
    const updatedUser = users.find((user) => user.id === activeUserId)
    if (updatedUser) {
        saveSessionUser(updatedUser)
        return sanitizeUser(updatedUser)
    }

    return null
}

const authService = {
    registerUser({ fullName, email, password, role }) {
        const users = getStoredUsers()
        const normalizedEmail = normalizeEmail(email)

        const existingUser = users.find((user) => user.email === normalizedEmail)
        if (existingUser) {
            throw new Error('An account with this email already exists')
        }

        const baseUser = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
            fullName: fullName.trim(),
            email: normalizedEmail,
            password,
            role,
            createdAt: new Date().toISOString()
        }

        const newUser = withDefaultProfile(baseUser, users)

        users.push(newUser)
        saveStoredUsers(users)

        return sanitizeUser(newUser)
    },

    loginUser({ email, password }) {
        const users = getStoredUsers()
        const normalizedEmail = normalizeEmail(email)
        const matchedUser = users.find((user) => user.email === normalizedEmail)

        if (!matchedUser) {
            throw new Error('No account found for this email. Register first.')
        }

        if (matchedUser.password !== password) {
            throw new Error('Incorrect password')
        }

        const hydratedUsers = users.map((user) => {
            if (user.id !== matchedUser.id) return user
            return withDefaultProfile(user, users)
        })

        saveStoredUsers(hydratedUsers)
        const hydratedUser = hydratedUsers.find((user) => user.id === matchedUser.id)
        saveSessionUser(hydratedUser)
        return sanitizeUser(hydratedUser)
    },

    getCurrentUser() {
        if (typeof window === 'undefined') return null

        try {
            const sessionUser = window.localStorage.getItem(SESSION_STORAGE_KEY)
            if (!sessionUser) return null

            const parsedSession = JSON.parse(sessionUser)
            const users = getStoredUsers()
            const matchedUser = users.find((user) => user.id === parsedSession.id)
            if (!matchedUser) return parsedSession

            const hydratedMatchedUser = withDefaultProfile(matchedUser, users)
            if (JSON.stringify(hydratedMatchedUser) !== JSON.stringify(matchedUser)) {
                const updatedUsers = users.map((user) => user.id === matchedUser.id ? hydratedMatchedUser : user)
                saveStoredUsers(updatedUsers)
            }

            saveSessionUser(hydratedMatchedUser)
            return sanitizeUser(hydratedMatchedUser)
        } catch {
            return null
        }
    },

    updateUserProfile(userId, profileUpdates) {
        const users = getStoredUsers()
        const updatedUsers = users.map((user) => {
            if (user.id !== userId) return user
            const hydrated = withDefaultProfile(user, users)
            return {
                ...hydrated,
                fullName: String(profileUpdates?.fullName || hydrated.fullName).trim(),
                profile: {
                    ...hydrated.profile,
                    ...(profileUpdates?.profile || {})
                },
                stakeholderProfile: {
                    ...hydrated.stakeholderProfile,
                    details: {
                        ...hydrated.stakeholderProfile.details,
                        ...(profileUpdates?.stakeholderDetails || {})
                    }
                },
                updatedAt: new Date().toISOString()
            }
        })

        return saveUsersAndMaybeSession(updatedUsers, userId)
    },

    updateUserSettings(userId, settingsUpdates) {
        const users = getStoredUsers()
        const updatedUsers = users.map((user) => {
            if (user.id !== userId) return user
            const hydrated = withDefaultProfile(user, users)

            return {
                ...hydrated,
                settings: {
                    ...hydrated.settings,
                    ...settingsUpdates,
                    notifications: {
                        ...hydrated.settings.notifications,
                        ...(settingsUpdates?.notifications || {})
                    }
                },
                updatedAt: new Date().toISOString()
            }
        })

        return saveUsersAndMaybeSession(updatedUsers, userId)
    },

    linkWallet(userId, walletAddress) {
        if (!walletAddress) return null

        const users = getStoredUsers()
        const normalizedWallet = String(walletAddress).toLowerCase()
        const updatedUsers = users.map((user) => {
            if (user.id !== userId) return user
            const hydrated = withDefaultProfile(user, users)
            const existingWallets = Array.isArray(hydrated.linkedWallets) ? hydrated.linkedWallets : []
            if (existingWallets.includes(normalizedWallet)) return hydrated

            return {
                ...hydrated,
                linkedWallets: [...existingWallets, normalizedWallet],
                updatedAt: new Date().toISOString()
            }
        })

        return saveUsersAndMaybeSession(updatedUsers, userId)
    },

    unlinkWallet(userId, walletAddress) {
        if (!walletAddress) return null

        const users = getStoredUsers()
        const normalizedWallet = String(walletAddress).toLowerCase()
        const updatedUsers = users.map((user) => {
            if (user.id !== userId) return user
            const hydrated = withDefaultProfile(user, users)
            return {
                ...hydrated,
                linkedWallets: (hydrated.linkedWallets || []).filter((wallet) => wallet !== normalizedWallet),
                updatedAt: new Date().toISOString()
            }
        })

        return saveUsersAndMaybeSession(updatedUsers, userId)
    },

    changePassword(userId, currentPassword, nextPassword) {
        const users = getStoredUsers()
        const targetUser = users.find((user) => user.id === userId)

        if (!targetUser) {
            throw new Error('User account not found')
        }

        if (targetUser.password !== currentPassword) {
            throw new Error('Current password is incorrect')
        }

        if (!nextPassword || nextPassword.length < 8) {
            throw new Error('New password must be at least 8 characters long')
        }

        const updatedUsers = users.map((user) => {
            if (user.id !== userId) return user
            const hydrated = withDefaultProfile(user, users)
            return {
                ...hydrated,
                password: nextPassword,
                updatedAt: new Date().toISOString()
            }
        })

        return saveUsersAndMaybeSession(updatedUsers, userId)
    },

    logout() {
        if (typeof window === 'undefined') return
        window.localStorage.removeItem(SESSION_STORAGE_KEY)
    }
}

export default authService