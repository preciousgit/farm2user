import React, { useState } from 'react'
import { faApple, faGoogle } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faLeaf,
    faLock,
    faSpinner,
    faArrowRightToBracket,
    faShieldHalved,
    faKey,
    faMobileScreenButton,
    faMagnifyingGlass,
    faLink,
    faChartLine,
    faRobot,
    faEarthAfrica,
    faCircleCheck
} from '@fortawesome/free-solid-svg-icons'
import authService from '../services/authService'
import '../styles/Login.css'

export default function Login({ onLoginSuccess, onNavigateToRegister }) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [rememberMe, setRememberMe] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.email || !formData.password) {
            setMessage({ type: 'error', text: 'Email and password are required' })
            return
        }

        setLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 500))
            const authenticatedUser = authService.loginUser(formData)

            setMessage({
                type: 'success',
                text: 'Login successful! Redirecting...'
            })

            setTimeout(() => {
                onLoginSuccess && onLoginSuccess(authenticatedUser)
            }, 800)
        } catch (error) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-form-section">
                <div className="form-logo">
                    <div className="form-logo-icon"><FontAwesomeIcon icon={faLeaf} /></div>
                    <div className="form-logo-text">
                        <h2>Farm2User</h2>
                        <p>Blockchain Supply Chain</p>
                    </div>
                </div>

                <div className="login-header">
                    <h1><FontAwesomeIcon icon={faLock} /> Welcome Back</h1>
                    <p>Access your supply chain dashboard</p>
                </div>

                {message && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
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
                        <div className="form-label-row">
                            <label>Password</label>
                            <a href="#" className="forgot-link">Forgot?</a>
                        </div>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="remember-me">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <label htmlFor="rememberMe">Remember me</label>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary login-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin /> Signing In...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faArrowRightToBracket} /> Sign In
                            </>
                        )}
                    </button>
                </form>

                <div className="social-login">
                    <p>Or continue with</p>
                    <div className="social-buttons">
                        <button className="social-btn apple-btn">
                            <span><FontAwesomeIcon icon={faApple} /></span> Apple
                        </button>
                        <button className="social-btn google-btn">
                            <span><FontAwesomeIcon icon={faGoogle} /></span> Google
                        </button>
                    </div>
                </div>

                <div className="login-footer">
                    <p>Don't have an account?{' '}
                        <button
                            className="link-btn"
                            onClick={onNavigateToRegister}
                        >
                            Create one
                        </button>
                    </p>
                    <a href="#" className="terms-link">Terms & Conditions</a>
                </div>
            </div>

            <div className="login-info-section">
                <div className="security-card">
                    <h2><FontAwesomeIcon icon={faLock} /> Enterprise Security</h2>
                    <div className="security-features">
                        <div className="security-item">
                            <div className="security-icon"><FontAwesomeIcon icon={faShieldHalved} /></div>
                            <h3>Military Grade Encryption</h3>
                            <p>End-to-end encryption for all data</p>
                        </div>
                        <div className="security-item">
                            <div className="security-icon"><FontAwesomeIcon icon={faKey} /></div>
                            <h3>Multi-Factor Authentication</h3>
                            <p>Extra layer of account protection</p>
                        </div>
                        <div className="security-item">
                            <div className="security-icon"><FontAwesomeIcon icon={faMobileScreenButton} /></div>
                            <h3>Biometric Login</h3>
                            <p>Fingerprint & Face Recognition</p>
                        </div>
                        <div className="security-item">
                            <div className="security-icon"><FontAwesomeIcon icon={faMagnifyingGlass} /></div>
                            <h3>24/7 Monitoring</h3>
                            <p>Real-time fraud detection system</p>
                        </div>
                    </div>
                </div>

                <div className="benefits-card">
                    <h2><FontAwesomeIcon icon={faCircleCheck} /> Platform Benefits</h2>
                    <ul className="benefits-list">
                        <li><FontAwesomeIcon icon={faLink} /> Immutable blockchain records</li>
                        <li><FontAwesomeIcon icon={faChartLine} /> Real-time analytics dashboard</li>
                        <li><FontAwesomeIcon icon={faRobot} /> AI-powered predictions</li>
                        <li><FontAwesomeIcon icon={faMobileScreenButton} /> Mobile app access</li>
                        <li><FontAwesomeIcon icon={faEarthAfrica} /> Global supply chain tracking</li>
                        <li><FontAwesomeIcon icon={faCircleCheck} /> Regulatory compliance tools</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
