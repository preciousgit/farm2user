import React, { useState } from 'react'
import { faApple, faGoogle } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faLeaf,
    faUserPlus,
    faSpinner,
    faUsers,
    faLink,
    faMagnifyingGlass,
    faChartLine,
    faCircleCheck
} from '@fortawesome/free-solid-svg-icons'
import authService, { ROLE_OPTIONS } from '../services/authService'
import '../styles/Register.css'

export default function Register({ onRegisterComplete, onNavigateToLogin }) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: 'consumer',
        password: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [passwordStrength, setPasswordStrength] = useState(0)

    const checkPasswordStrength = (password) => {
        let strength = 0
        if (password.length >= 8) strength++
        if (/[A-Z]/.test(password)) strength++
        if (/[0-9]/.test(password)) strength++
        if (/[^A-Za-z0-9]/.test(password)) strength++
        setPasswordStrength(strength)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
        if (name === 'password') {
            checkPasswordStrength(value)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
            setMessage({ type: 'error', text: 'All fields are required' })
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' })
            return
        }

        if (formData.password.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
            return
        }

        setLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 600))
            authService.registerUser(formData)
            setMessage({
                type: 'success',
                text: 'Account created successfully! Redirecting to login...'
            })
            setTimeout(() => {
                onRegisterComplete && onRegisterComplete()
            }, 2000)
        } catch (error) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    const getPasswordStrengthLabel = () => {
        switch (passwordStrength) {
            case 0: return 'Very Weak'
            case 1: return 'Weak'
            case 2: return 'Fair'
            case 3: return 'Good'
            case 4: return 'Strong'
            default: return ''
        }
    }

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 0: return '#ff3366'
            case 1: return '#ffaa00'
            case 2: return '#ffcc00'
            case 3: return '#00ff88'
            case 4: return '#00ff88'
            default: return '#8890b0'
        }
    }

    return (
        <div className="register-container">
            <div className="register-form-section">
                <div className="form-logo">
                    <div className="form-logo-icon"><FontAwesomeIcon icon={faLeaf} /></div>
                    <div className="form-logo-text">
                        <h2>Farm2User</h2>
                        <p>Blockchain Supply Chain</p>
                    </div>
                </div>

                <div className="register-header">
                    <h1><FontAwesomeIcon icon={faUserPlus} /> Create Account</h1>
                    <p>Join the blockchain supply chain revolution</p>
                </div>

                {message && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="John Doe"
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label><FontAwesomeIcon icon={faUsers} /> Account Type</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="form-input"
                        >
                            {ROLE_OPTIONS.map((roleOption) => (
                                <option key={roleOption.value} value={roleOption.value}>
                                    {roleOption.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className="form-input"
                        />
                        {formData.password && (
                            <div className="password-strength">
                                <div className="strength-bar-container">
                                    <div
                                        className="strength-bar"
                                        style={{
                                            width: `${(passwordStrength / 4) * 100}%`,
                                            backgroundColor: getPasswordStrengthColor()
                                        }}
                                    ></div>
                                </div>
                                <span className="strength-label" style={{ color: getPasswordStrengthColor() }}>
                                    {getPasswordStrengthLabel()}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className="form-input"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary register-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin /> Creating Account...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faUserPlus} /> Create Account
                            </>
                        )}
                    </button>
                </form>

                <div className="social-login">
                    <p>Or register with</p>
                    <div className="social-buttons">
                        <button className="social-btn apple-btn">
                            <span><FontAwesomeIcon icon={faApple} /></span> Apple
                        </button>
                        <button className="social-btn google-btn">
                            <span><FontAwesomeIcon icon={faGoogle} /></span> Google
                        </button>
                    </div>
                </div>

                <div className="register-footer">
                    <p>Already have an account?{' '}
                        <button
                            className="link-btn"
                            onClick={onNavigateToLogin}
                        >
                            Sign in
                        </button>
                    </p>
                    <a href="#" className="terms-link">Terms & Conditions</a>
                </div>
            </div>

            <div className="register-info-section">
                <div className="info-card">
                    <h2>Why Join Us?</h2>
                    <div className="feature-grid">
                        <div className="feature-item">
                            <div className="feature-icon"><FontAwesomeIcon icon={faLink} /></div>
                            <h3>Blockchain Secured</h3>
                            <p>Immutable supply chain records</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon"><FontAwesomeIcon icon={faMagnifyingGlass} /></div>
                            <h3>Full Transparency</h3>
                            <p>Track every product movement</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon"><FontAwesomeIcon icon={faChartLine} /></div>
                            <h3>AI Analytics</h3>
                            <p>Predict freshness and quality</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon"><FontAwesomeIcon icon={faCircleCheck} /></div>
                            <h3>Compliance Ready</h3>
                            <p>Regulatory standards built-in</p>
                        </div>
                    </div>
                </div>

                <div className="stats-card">
                    <div className="stat-item">
                        <div className="stat-number">50K+</div>
                        <div className="stat-label">Products Tracked</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">99.9%</div>
                        <div className="stat-label">Uptime</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">150+</div>
                        <div className="stat-label">Active Users</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
