/**
 * Settings API Service
 * Handles all settings-related API calls
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const settingsApi = {
    /**
     * Get user settings
     */
    async getSettings() {
        const response = await fetch(`${API_BASE_URL}/api/settings/`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch settings');
        }

        return response.json();
    },

    /**
     * Save all settings
     */
    async saveSettings(settings) {
        const response = await fetch(`${API_BASE_URL}/api/settings/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(settings)
        });

        if (!response.ok) {
            throw new Error('Failed to save settings');
        }

        return response.json();
    },

    /**
     * Update specific settings
     */
    async updateSettings(updates) {
        const response = await fetch(`${API_BASE_URL}/api/settings/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            throw new Error('Failed to update settings');
        }

        return response.json();
    },

    /**
     * Reset settings to defaults
     */
    async resetSettings() {
        const response = await fetch(`${API_BASE_URL}/api/settings/`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to reset settings');
        }

        return response.json();
    },

    /**
     * Export settings as JSON
     */
    async exportSettings() {
        const response = await fetch(`${API_BASE_URL}/api/settings/export`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to export settings');
        }

        return response.json();
    }
};

export const passwordApi = {
    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword, confirmPassword) {
        const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to change password');
        }

        return response.json();
    },

    /**
     * Check password strength
     */
    async checkPasswordStrength(password) {
        const response = await fetch(`${API_BASE_URL}/api/auth/password-strength/${encodeURIComponent(password)}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to check password strength');
        }

        return response.json();
    }
};

export const twofaApi = {
    /**
     * Enable 2FA
     */
    async enable2FA() {
        const response = await fetch(`${API_BASE_URL}/api/auth/2fa/enable`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to enable 2FA');
        }

        return response.json();
    },

    /**
     * Verify and activate 2FA
     */
    async verify2FA(code) {
        const response = await fetch(`${API_BASE_URL}/api/auth/2fa/verify`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ code })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Invalid verification code');
        }

        return response.json();
    },

    /**
     * Disable 2FA
     */
    async disable2FA(code) {
        const response = await fetch(`${API_BASE_URL}/api/auth/2fa/disable`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ code })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to disable 2FA');
        }

        return response.json();
    },

    /**
     * Get 2FA status
     */
    async get2FAStatus() {
        const response = await fetch(`${API_BASE_URL}/api/auth/2fa/status`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to get 2FA status');
        }

        return response.json();
    },

    /**
     * Regenerate backup codes
     */
    async regenerateBackupCodes(code) {
        const response = await fetch(`${API_BASE_URL}/api/auth/2fa/backup-codes/regenerate`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ code })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to regenerate backup codes');
        }

        return response.json();
    }
};
