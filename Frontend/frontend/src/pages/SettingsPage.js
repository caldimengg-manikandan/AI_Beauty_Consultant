import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaUser, FaBell, FaLock, FaPalette, FaSave, FaCamera, FaChartLine, FaShieldAlt, FaClock, FaGlobe, FaTimes, FaDownload, FaExclamationTriangle, FaBullseye, FaShoppingCart, FaRobot, FaUniversalAccess, FaCreditCard, FaCode, FaCheck, FaKey, FaCrown } from 'react-icons/fa';
import { getSettings, updateSettings, changePassword, deleteAccount, enable2FA, verify2FA, disable2FA, get2FAStatus, sendTestEmail } from '../services/api';
import { getUserRole, cancelSubscription } from '../services/premiumApi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [email] = useState(localStorage.getItem('email') || '');

    // General Settings
    const [notifications, setNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [weeklyReport, setWeeklyReport] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [language, setLanguage] = useState('en');

    // Profile & Personalization
    const [ageRange, setAgeRange] = useState('25-34');
    const [gender, setGender] = useState('prefer-not-to-say');
    const [skinConcerns, setSkinConcerns] = useState(['acne', 'dark-spots']);
    const [allergies, setAllergies] = useState('');
    const [budgetPreference, setBudgetPreference] = useState('medium');

    // Analysis Preferences
    const [skinType, setSkinType] = useState('combination');
    const [analysisDetail, setAnalysisDetail] = useState('detailed');
    const [autoSave, setAutoSave] = useState(true);

    // Goals & Tracking
    const [skinGoals, setSkinGoals] = useState(['clear-skin']);
    const [targetTimeline, setTargetTimeline] = useState('3-months');
    const [progressPhotos, setProgressPhotos] = useState(true);
    const [goalReminders, setGoalReminders] = useState(true);

    // Product Recommendations
    const [ingredientPrefs, setIngredientPrefs] = useState(['natural']);
    const [priceRange, setPriceRange] = useState([0, 100]);
    const [showSponsored, setShowSponsored] = useState(true);

    // Camera Settings
    const [defaultCamera, setDefaultCamera] = useState('front');
    const [imageQuality, setImageQuality] = useState('high');
    const [lightingGuidance, setLightingGuidance] = useState(true);
    const [gridOverlay, setGridOverlay] = useState(false);
    const [autoCapture, setAutoCapture] = useState(false);

    // AI Model Preferences
    const [modelVersion, setModelVersion] = useState('latest');
    const [analysisSpeed, setAnalysisSpeed] = useState('balanced');
    const [confidenceThreshold, setConfidenceThreshold] = useState(70);
    const [betaFeatures, setBetaFeatures] = useState(false);

    // Privacy & Data
    const [dataSharing, setDataSharing] = useState(false);
    const [autoDelete, setAutoDelete] = useState('never');
    const [historyRetention, setHistoryRetention] = useState('forever');

    // Reminders
    const [skinRoutineReminder, setSkinRoutineReminder] = useState(false);
    const [reanalysisReminder, setReanalysisReminder] = useState('weekly');

    // Accessibility
    const [fontSize, setFontSize] = useState('medium');
    const [highContrast, setHighContrast] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    // Modals
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // 2FA State
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [twoFAStep, setTwoFAStep] = useState('initial'); // 'initial', 'setup', 'verify'
    const [qrCode, setQrCode] = useState('');
    const [twoFASecret, setTwoFASecret] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState('');

    const [isPremium, setIsPremium] = useState(false);
    const [subEndDate, setSubEndDate] = useState(null);

    const [saveMessage, setSaveMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const data = await getSettings();

                // Map nested settings to flat state
                setNotifications(data.notifications?.push_notifications ?? true);
                setEmailNotifications(data.notifications?.email_notifications ?? false);
                setWeeklyReport(data.notifications?.weekly_report ?? true);
                setDarkMode(data.dark_mode ?? false);
                setLanguage(data.language ?? 'en');

                setAgeRange(data.profile?.age_range ?? '25-34');
                setGender(data.profile?.gender ?? 'prefer-not-to-say');
                setSkinConcerns(data.profile?.skin_concerns ?? []);
                setAllergies(data.profile?.allergies ?? '');
                setBudgetPreference(data.profile?.budget_preference ?? 'medium');

                setSkinType(data.analysis?.skin_type ?? 'combination');
                setAnalysisDetail(data.analysis?.analysis_detail ?? 'detailed');
                setAutoSave(data.analysis?.auto_save ?? true);

                setSkinGoals(data.goals?.skin_goals ?? ['clear-skin']);
                setTargetTimeline(data.goals?.target_timeline ?? '3-months');
                setProgressPhotos(data.goals?.progress_photos ?? true);
                setGoalReminders(data.goals?.goal_reminders ?? true);

                setIngredientPrefs(data.products?.ingredient_prefs ?? ['natural']);
                setPriceRange(data.products?.price_range ?? [0, 100]);
                setShowSponsored(data.products?.show_sponsored ?? true);

                setDefaultCamera(data.camera?.default_camera ?? 'front');
                setImageQuality(data.camera?.image_quality ?? 'high');
                setLightingGuidance(data.camera?.lighting_guidance ?? true);
                setGridOverlay(data.camera?.grid_overlay ?? false);
                setAutoCapture(data.camera?.auto_capture ?? false);

                setModelVersion(data.ai_model?.model_version ?? 'latest');
                setAnalysisSpeed(data.ai_model?.analysis_speed ?? 'balanced');
                setConfidenceThreshold(data.ai_model?.confidence_threshold ?? 70);
                setBetaFeatures(data.ai_model?.beta_features ?? false);

                setDataSharing(data.privacy?.data_sharing ?? false);
                setAutoDelete(data.privacy?.auto_delete ?? 'never');
                setHistoryRetention(data.privacy?.history_retention ?? 'forever');

                setSkinRoutineReminder(data.notifications?.skin_routine_reminder ?? false);
                setReanalysisReminder(data.notifications?.reanalysis_reminder ?? 'weekly');

                setFontSize(data.accessibility?.font_size ?? 'medium');
                setHighContrast(data.accessibility?.high_contrast ?? false);
                setReduceMotion(data.accessibility?.reduce_motion ?? false);
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetch2FAStatus = async () => {
            try {
                const status = await get2FAStatus();
                setTwoFAEnabled(status.enabled);
            } catch (err) {
                console.error("Failed to fetch 2FA status:", err);
            }
        };

        const fetchPremiumStatus = async () => {
            try {
                const role = await getUserRole();
                setIsPremium(role.is_premium);
                setSubEndDate(role.subscription_end);
            } catch (err) {
                console.error("Failed to fetch premium status:", err);
            }
        };

        fetchSettings();
        fetch2FAStatus();
        fetchPremiumStatus();
    }, []);

    const tabs = [
        { id: 'general', label: 'General', icon: FaUser, color: 'from-blue-500 to-blue-600' },
        { id: 'profile', label: 'Profile', icon: FaUser, color: 'from-purple-500 to-purple-600' },
        { id: 'analysis', label: 'Analysis', icon: FaChartLine, color: 'from-green-500 to-green-600' },
        { id: 'goals', label: 'Goals', icon: FaBullseye, color: 'from-orange-500 to-orange-600' },
        { id: 'products', label: 'Products', icon: FaShoppingCart, color: 'from-pink-500 to-pink-600' },
        { id: 'camera', label: 'Camera', icon: FaCamera, color: 'from-indigo-500 to-indigo-600' },
        { id: 'ai', label: 'AI Model', icon: FaRobot, color: 'from-cyan-500 to-cyan-600' },
        { id: 'privacy', label: 'Privacy', icon: FaShieldAlt, color: 'from-teal-500 to-teal-600' },
        { id: 'accessibility', label: 'Accessibility', icon: FaUniversalAccess, color: 'from-violet-500 to-violet-600' },
        { id: 'security', label: 'Security', icon: FaLock, color: 'from-red-500 to-red-600' },
        { id: 'plan', label: 'My Plan', icon: FaCreditCard, color: 'from-amber-500 to-yellow-600' },
    ];

    const handleSave = async () => {
        const settingsPayload = {
            user_email: email,
            language,
            dark_mode: darkMode,
            profile: { age_range: ageRange, gender, skin_concerns: skinConcerns, allergies, budget_preference: budgetPreference },
            analysis: { skin_type: skinType, analysis_detail: analysisDetail, auto_save: autoSave },
            camera: { default_camera: defaultCamera, image_quality: imageQuality, lighting_guidance: lightingGuidance, grid_overlay: gridOverlay, auto_capture: autoCapture },
            ai_model: { model_version: modelVersion, analysis_speed: analysisSpeed, confidence_threshold: confidenceThreshold, beta_features: betaFeatures },
            notifications: { push_notifications: notifications, email_notifications: emailNotifications, skin_routine_reminder: skinRoutineReminder, reanalysis_reminder: reanalysisReminder },
            privacy: { data_sharing: dataSharing, auto_delete: autoDelete, history_retention: historyRetention },
            goals: { skin_goals: skinGoals, target_timeline: targetTimeline, progress_photos: progressPhotos, goal_reminders: goalReminders },
            products: { ingredient_prefs: ingredientPrefs, price_range: priceRange, show_sponsored: showSponsored },
            accessibility: { font_size: fontSize, high_contrast: highContrast, reduce_motion: reduceMotion }
        };

        try {
            await updateSettings(settingsPayload);
            setSaveMessage('Settings saved successfully to database!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (err) {
            toast.error('Failed to save settings: ' + (err.response?.data?.detail || 'Unknown error'));
        }
    };

    const handleExportData = () => {
        let doc;
        try {
            doc = new jsPDF();
            const timestamp = new Date().toLocaleString();

            // PDF Styling & Header
            doc.setFillColor(63, 81, 181); // Premium Indigo
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.text('AI Beauty Consultant', 20, 25);
            doc.setFontSize(10);
            doc.text('Your Personalized Beauty Profile & Settings', 20, 32);

            doc.setTextColor(100, 100, 100);
            doc.setFontSize(9);
            doc.text(`Exported on: ${timestamp}`, 140, 50);
            doc.text(`User Account: ${email}`, 20, 50);

            // Safe Array Handling
            const safeConcerns = Array.isArray(skinConcerns) ? skinConcerns.join(', ') : 'None';
            const safeGoals = Array.isArray(skinGoals) ? skinGoals.join(', ') : 'None';

            const sections = [
                {
                    title: 'Profile Information', data: [
                        ['Age Range', ageRange || 'N/A'],
                        ['Gender', gender || 'N/A'],
                        ['Skin Type', skinType || 'N/A'],
                        ['Budget', budgetPreference || 'N/A'],
                        ['Concerns', safeConcerns || 'None']
                    ]
                },
                {
                    title: 'Goal Analysis', data: [
                        ['Target Goals', safeGoals || 'None'],
                        ['Timeline', targetTimeline || 'N/A'],
                        ['Reminders', goalReminders ? 'Enabled' : 'Disabled']
                    ]
                },
                {
                    title: 'AI & Camera Preferences', data: [
                        ['Model Version', modelVersion || 'N/A'],
                        ['Analysis Speed', analysisSpeed || 'N/A'],
                        ['Confidence Threshold', `${confidenceThreshold || 70}%`],
                        ['Default Camera', defaultCamera || 'N/A'],
                        ['Image Quality', imageQuality || 'N/A']
                    ]
                }
            ];

            let yPos = 60;
            sections.forEach(section => {
                doc.setTextColor(63, 81, 181);
                doc.setFontSize(14);
                doc.text(section.title, 20, yPos);

                autoTable(doc, {
                    startY: yPos + 5,
                    head: [['Setting', 'Value']],
                    body: section.data,
                    theme: 'striped',
                    headStyles: { fillColor: [63, 81, 181] },
                    margin: { left: 20, right: 20 }
                });
                yPos = doc.lastAutoTable.finalY + 15;
            });

            doc.save(`AI_Beauty_Settings_${Date.now()}.pdf`);
            setSaveMessage('PDF Exported successfully!');
        } catch (err) {
            console.error("PDF Export failed:", err);
            toast.error("Error generating PDF. Please ensure all settings are loaded and try again.");
        }
    };

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }
        try {
            await changePassword({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            });
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setSaveMessage('Password changed successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (err) {
            toast.error('Password change failed: ' + (err.response?.data?.detail || 'Check password strength'));
        }
    };

    const handleEnable2FA = async () => {
        try {
            const data = await enable2FA();
            setQrCode(data.qr_code);
            setTwoFASecret(data.secret);
            setBackupCodes(data.backup_codes);
            setTwoFAStep('setup');
        } catch (err) {
            toast.error('Failed to initiate 2FA: ' + (err.response?.data?.detail || 'Unknown error'));
        }
    };

    const handleVerify2FA = async () => {
        try {
            await verify2FA(verificationCode);
            setTwoFAEnabled(true);
            setTwoFAStep('initial');
            setShow2FAModal(false);
            setSaveMessage('Two-Factor Authentication activated successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (err) {
            toast.error('Verification failed: ' + (err.response?.data?.detail || 'Invalid code'));
        }
    };

    const handleDisable2FA = async () => {
        if (!window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return;

        const code = prompt('Please enter your 2FA code to confirm:');
        if (!code) return;

        try {
            await disable2FA(code);
            setTwoFAEnabled(false);
            setSaveMessage('Two-Factor Authentication disabled.');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (err) {
            toast.error('Failed to disable 2FA: ' + (err.response?.data?.detail || 'Invalid code'));
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm('Permanently delete all data?');
        if (confirmed) {
            try {
                await deleteAccount();
                localStorage.clear();
                window.location.href = '/login';
            } catch (err) {
                toast.error('Deletion failed');
            }
        }
    };

    const handleCancelSubscription = async () => {
        if (!window.confirm('Are you sure you want to cancel your Premium subscription? You will lose access to unlimited analysis and AI tips.')) return;

        try {
            await cancelSubscription();
            setIsPremium(false);
            setSaveMessage('Subscription cancelled. You are now on the Free plan.');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (err) {
            toast.error('Failed to cancel subscription.');
        }
    };

    const toggleSkinConcern = (concern) => {
        setSkinConcerns(prev =>
            prev.includes(concern) ? prev.filter(c => c !== concern) : [...prev, concern]
        );
    };

    const toggleSkinGoal = (goal) => {
        setSkinGoals(prev =>
            prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
        );
    };

    const toggleIngredientPref = (pref) => {
        setIngredientPrefs(prev =>
            prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
        );
    };

    const ToggleSwitch = ({ enabled, onChange }) => (
        <button
            onClick={onChange}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 shadow-inner ${enabled ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-300'
                }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    );

    const SettingCard = ({ icon: Icon, title, children, gradient }) => (
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className={`bg-gradient-to-r ${gradient} p-4`}>
                <div className="flex items-center gap-3 text-white">
                    <div className="bg-white bg-opacity-20 p-2.5 rounded-xl backdrop-blur-sm">
                        <Icon className="text-xl" />
                    </div>
                    <h2 className="text-xl font-bold">{title}</h2>
                </div>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium animate-pulse">Loading settings from database...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4">
            {/* Header with Gradient */}
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-10 blur-3xl"></div>
                <div className="relative">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Settings
                    </h1>
                    <p className="text-gray-600 text-lg">Customize your AI Beauty Consultant experience</p>
                </div>
            </div>

            {/* Success Message */}
            {saveMessage && (
                <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-800 px-6 py-4 rounded-xl shadow-md animate-fade-in flex items-center gap-3">
                    <div className="bg-green-500 rounded-full p-1">
                        <FaCheck className="text-white text-sm" />
                    </div>
                    <span className="font-semibold">{saveMessage}</span>
                </div>
            )}

            {/* Premium Tabs */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 p-2 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 ${activeTab === tab.id
                                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <tab.icon className="text-lg" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6 pb-24">

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SettingCard icon={FaUser} title="Account Information" gradient="from-blue-500 to-blue-600">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="w-full px-4 py-3.5 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-600 cursor-not-allowed font-medium"
                                />
                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                    <FaLock className="text-gray-400" /> Your email cannot be changed
                                </p>
                            </div>
                        </SettingCard>

                        <SettingCard icon={FaBell} title="Notifications" gradient="from-yellow-500 to-orange-500">
                            <div className="space-y-5">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-semibold text-gray-800">Push Notifications</p>
                                        <p className="text-sm text-gray-500">Get real-time updates</p>
                                    </div>
                                    <ToggleSwitch enabled={notifications} onChange={() => setNotifications(!notifications)} />
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-semibold text-gray-800">Email Reports</p>
                                        <p className="text-sm text-gray-500">Weekly summaries</p>
                                    </div>
                                    <ToggleSwitch enabled={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-semibold text-gray-800">Weekly Skin Report</p>
                                        <p className="text-sm text-gray-500">Scheduled AI evolution summary</p>
                                    </div>
                                    <ToggleSwitch enabled={weeklyReport} onChange={() => setWeeklyReport(!weeklyReport)} />
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            await sendTestEmail();
                                            setSaveMessage('Test email sent! Check your inbox.');
                                            setTimeout(() => setSaveMessage(''), 3000);
                                        } catch (err) {
                                            toast.error('Failed to send test email.');
                                        }
                                    }}
                                    className="w-full py-3 bg-slate-100 text-slate-800 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
                                >
                                    Send Test Email
                                </button>
                            </div>
                        </SettingCard>

                        <SettingCard icon={FaGlobe} title="Language & Region" gradient="from-teal-500 to-cyan-600">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Preferred Language</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium bg-white"
                                >
                                    <option value="en">🇬🇧 English</option>
                                    <option value="es">🇪🇸 Español</option>
                                    <option value="fr">🇫🇷 Français</option>
                                    <option value="de">🇩🇪 Deutsch</option>
                                    <option value="zh">🇨🇳 中文</option>
                                    <option value="ja">🇯🇵 日本語</option>
                                </select>
                            </div>
                        </SettingCard>

                        <SettingCard icon={FaPalette} title="Appearance" gradient="from-pink-500 to-rose-600">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-semibold text-gray-800">Dark Mode</p>
                                    <p className="text-sm text-gray-500">Coming soon...</p>
                                </div>
                                <button
                                    disabled
                                    className="relative inline-flex h-7 w-12 items-center rounded-full bg-gray-300 opacity-50 cursor-not-allowed shadow-inner"
                                >
                                    <span className="inline-block h-5 w-5 rounded-full bg-white translate-x-1 shadow-lg" />
                                </button>
                            </div>
                        </SettingCard>
                    </div>
                )
                }

                {/* PROFILE TAB */}
                {
                    activeTab === 'profile' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <SettingCard icon={FaUser} title="Personal Information" gradient="from-purple-500 to-purple-600">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Age Range</label>
                                        <select value={ageRange} onChange={(e) => setAgeRange(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium">
                                            <option value="18-24">18-24 years</option>
                                            <option value="25-34">25-34 years</option>
                                            <option value="35-44">35-44 years</option>
                                            <option value="45-54">45-54 years</option>
                                            <option value="55+">55+ years</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Gender</label>
                                        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium">
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="non-binary">Non-binary</option>
                                            <option value="prefer-not-to-say">Prefer not to say</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Budget Preference</label>
                                        <select value={budgetPreference} onChange={(e) => setBudgetPreference(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium">
                                            <option value="low">💰 Budget-Friendly</option>
                                            <option value="medium">💰💰 Mid-Range</option>
                                            <option value="high">💰💰💰 Premium</option>
                                            <option value="luxury">💎 Luxury</option>
                                        </select>
                                    </div>
                                </div>
                            </SettingCard>

                            <SettingCard icon={FaChartLine} title="Skin Concerns" gradient="from-rose-500 to-pink-600">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        {['acne', 'wrinkles', 'dark-spots', 'redness', 'dryness', 'oiliness', 'pores', 'sensitivity'].map(concern => (
                                            <button
                                                key={concern}
                                                onClick={() => toggleSkinConcern(concern)}
                                                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${skinConcerns.includes(concern)
                                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {concern.charAt(0).toUpperCase() + concern.slice(1).replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Allergies / Ingredients to Avoid</label>
                                        <textarea
                                            value={allergies}
                                            onChange={(e) => setAllergies(e.target.value)}
                                            placeholder="e.g., fragrance, parabens, sulfates..."
                                            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all resize-none"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                            </SettingCard>
                        </div>
                    )
                }

                {/* ANALYSIS TAB */}
                {
                    activeTab === 'analysis' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <SettingCard icon={FaChartLine} title="Analysis Preferences" gradient="from-green-500 to-emerald-600">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Your Skin Type</label>
                                        <select value={skinType} onChange={(e) => setSkinType(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-medium">
                                            <option value="oily">Oily Skin</option>
                                            <option value="dry">Dry Skin</option>
                                            <option value="combination">Combination Skin</option>
                                            <option value="sensitive">Sensitive Skin</option>
                                            <option value="normal">Normal Skin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Analysis Detail Level</label>
                                        <select value={analysisDetail} onChange={(e) => setAnalysisDetail(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-medium">
                                            <option value="quick">⚡ Quick Scan</option>
                                            <option value="detailed">📊 Detailed Analysis</option>
                                            <option value="comprehensive">📋 Comprehensive Report</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-gray-800">Auto-save Results</p>
                                            <p className="text-sm text-gray-500">Save automatically</p>
                                        </div>
                                        <ToggleSwitch enabled={autoSave} onChange={() => setAutoSave(!autoSave)} />
                                    </div>
                                </div>
                            </SettingCard>

                            <SettingCard icon={FaClock} title="Reminders & Scheduling" gradient="from-orange-500 to-amber-600">
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-gray-800">Daily Skincare Routine</p>
                                            <p className="text-sm text-gray-500">Morning & evening reminders</p>
                                        </div>
                                        <ToggleSwitch enabled={skinRoutineReminder} onChange={() => setSkinRoutineReminder(!skinRoutineReminder)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Re-analysis Frequency</label>
                                        <select value={reanalysisReminder} onChange={(e) => setReanalysisReminder(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium">
                                            <option value="never">Never</option>
                                            <option value="weekly">📅 Weekly</option>
                                            <option value="biweekly">📅 Bi-weekly</option>
                                            <option value="monthly">📅 Monthly</option>
                                        </select>
                                    </div>
                                </div>
                            </SettingCard>
                        </div>
                    )
                }

                {/* GOALS TAB */}
                {
                    activeTab === 'goals' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <SettingCard icon={FaBullseye} title="Skin Goals" gradient="from-orange-500 to-red-600">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        {['clear-skin', 'anti-aging', 'hydration', 'brightening', 'even-tone', 'minimize-pores'].map(goal => (
                                            <button
                                                key={goal}
                                                onClick={() => toggleSkinGoal(goal)}
                                                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${skinGoals.includes(goal)
                                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {goal.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                            </button>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Target Timeline</label>
                                        <select value={targetTimeline} onChange={(e) => setTargetTimeline(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium">
                                            <option value="1-month">🎯 1 Month Challenge</option>
                                            <option value="3-months">🎯 3 Months Journey</option>
                                            <option value="6-months">🎯 6 Months Transformation</option>
                                            <option value="1-year">🎯 1 Year Commitment</option>
                                        </select>
                                    </div>
                                </div>
                            </SettingCard>

                            <SettingCard icon={FaCamera} title="Progress Tracking" gradient="from-violet-500 to-purple-600">
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-gray-800">Weekly Progress Photos</p>
                                            <p className="text-sm text-gray-500">Auto-capture for comparison</p>
                                        </div>
                                        <ToggleSwitch enabled={progressPhotos} onChange={() => setProgressPhotos(!progressPhotos)} />
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-gray-800">Goal Milestone Alerts</p>
                                            <p className="text-sm text-gray-500">Celebrate your progress</p>
                                        </div>
                                        <ToggleSwitch enabled={goalReminders} onChange={() => setGoalReminders(!goalReminders)} />
                                    </div>
                                </div>
                            </SettingCard>
                        </div>
                    )
                }

                {/* PRODUCTS TAB */}
                {
                    activeTab === 'products' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <SettingCard icon={FaShoppingCart} title="Ingredient Preferences" gradient="from-pink-500 to-rose-600">
                                <div className="grid grid-cols-2 gap-2">
                                    {['natural', 'vegan', 'cruelty-free', 'fragrance-free', 'paraben-free', 'sulfate-free'].map(pref => (
                                        <button
                                            key={pref}
                                            onClick={() => toggleIngredientPref(pref)}
                                            className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${ingredientPrefs.includes(pref)
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {pref.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </button>
                                    ))}
                                </div>
                            </SettingCard>

                            <SettingCard icon={FaCreditCard} title="Price Preferences" gradient="from-emerald-500 to-teal-600">
                                <div className="space-y-5">
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm font-semibold text-gray-700">Maximum Price</label>
                                            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                                ₹{priceRange[1]}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="200"
                                            value={priceRange[1]}
                                            onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-gray-800">Show Sponsored Products</p>
                                            <p className="text-sm text-gray-500">Support our partners</p>
                                        </div>
                                        <ToggleSwitch enabled={showSponsored} onChange={() => setShowSponsored(!showSponsored)} />
                                    </div>
                                </div>
                            </SettingCard>
                        </div>
                    )
                }

                {/* CAMERA TAB */}
                {
                    activeTab === 'camera' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <SettingCard icon={FaCamera} title="Camera Settings" gradient="from-indigo-500 to-blue-600">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Default Camera</label>
                                        <select value={defaultCamera} onChange={(e) => setDefaultCamera(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium">
                                            <option value="front">📱 Front Camera (Selfie)</option>
                                            <option value="back">📷 Back Camera</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Image Quality</label>
                                        <select value={imageQuality} onChange={(e) => setImageQuality(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium">
                                            <option value="high">⭐ High (Best accuracy)</option>
                                            <option value="medium">⚡ Medium (Balanced)</option>
                                            <option value="low">🚀 Low (Faster upload)</option>
                                        </select>
                                    </div>
                                </div>
                            </SettingCard>

                            <SettingCard icon={FaCamera} title="Capture Features" gradient="from-cyan-500 to-blue-600">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-gray-800">Lighting Guidance</p>
                                            <p className="text-sm text-gray-500">Optimal lighting tips</p>
                                        </div>
                                        <ToggleSwitch enabled={lightingGuidance} onChange={() => setLightingGuidance(!lightingGuidance)} />
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-gray-800">Grid Overlay</p>
                                            <p className="text-sm text-gray-500">Consistent positioning</p>
                                        </div>
                                        <ToggleSwitch enabled={gridOverlay} onChange={() => setGridOverlay(!gridOverlay)} />
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-gray-800">Auto-Capture</p>
                                            <p className="text-sm text-gray-500">On face detection</p>
                                        </div>
                                        <ToggleSwitch enabled={autoCapture} onChange={() => setAutoCapture(!autoCapture)} />
                                    </div>
                                </div>
                            </SettingCard>
                        </div>
                    )
                }

                {/* AI MODEL TAB */}
                {
                    activeTab === 'ai' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <SettingCard icon={FaRobot} title="AI Model Configuration" gradient="from-cyan-500 to-blue-600">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Model Version</label>
                                        <select value={modelVersion} onChange={(e) => setModelVersion(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium">
                                            <option value="latest">🚀 Latest (Recommended)</option>
                                            <option value="stable">✅ Stable</option>
                                            <option value="legacy">📦 Legacy</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Analysis Speed</label>
                                        <select value={analysisSpeed} onChange={(e) => setAnalysisSpeed(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium">
                                            <option value="fast">⚡ Fast (Less accurate)</option>
                                            <option value="balanced">⚖️ Balanced</option>
                                            <option value="accurate">🎯 Accurate (Slower)</option>
                                        </select>
                                    </div>
                                </div>
                            </SettingCard>

                            <SettingCard icon={FaChartLine} title="Advanced AI Settings" gradient="from-violet-500 to-purple-600">
                                <div className="space-y-5">
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm font-semibold text-gray-700">Confidence Threshold</label>
                                            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                                {confidenceThreshold}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="50"
                                            max="95"
                                            value={confidenceThreshold}
                                            onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Only show results above this confidence level</p>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-gray-800">Beta Features</p>
                                            <p className="text-sm text-gray-500">Experimental AI capabilities</p>
                                        </div>
                                        <ToggleSwitch enabled={betaFeatures} onChange={() => setBetaFeatures(!betaFeatures)} />
                                    </div>
                                </div>
                            </SettingCard>
                        </div>
                    )
                }

                {/* PRIVACY TAB */}
                {
                    activeTab === 'privacy' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <SettingCard icon={FaShieldAlt} title="Data Privacy" gradient="from-teal-500 to-emerald-600">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-gray-800">Help Improve AI</p>
                                            <p className="text-sm text-gray-500">Share anonymous data</p>
                                        </div>
                                        <ToggleSwitch enabled={dataSharing} onChange={() => setDataSharing(!dataSharing)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">History Retention</label>
                                        <select value={historyRetention} onChange={(e) => setHistoryRetention(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium">
                                            <option value="30days">30 Days</option>
                                            <option value="90days">90 Days</option>
                                            <option value="1year">1 Year</option>
                                            <option value="forever">Forever</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Auto-delete After</label>
                                        <select value={autoDelete} onChange={(e) => setAutoDelete(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium">
                                            <option value="never">Never</option>
                                            <option value="30days">30 Days</option>
                                            <option value="90days">90 Days</option>
                                            <option value="1year">1 Year</option>
                                        </select>
                                    </div>
                                </div>
                            </SettingCard>

                            <SettingCard icon={FaDownload} title="Data Management" gradient="from-blue-500 to-indigo-600">
                                <div className="space-y-3">
                                    <button
                                        onClick={handleExportData}
                                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                                    >
                                        <FaDownload className="text-lg" />
                                        Export My Data
                                    </button>
                                    <button className="w-full px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-bold rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all border-2 border-gray-300 transform hover:scale-105">
                                        Clear Analysis History
                                    </button>
                                    <p className="text-xs text-gray-500 text-center mt-3">
                                        🔒 Your data is encrypted and secure
                                    </p>
                                </div>
                            </SettingCard>
                        </div>
                    )
                }

                {/* ACCESSIBILITY TAB */}
                {
                    activeTab === 'accessibility' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <SettingCard icon={FaUniversalAccess} title="Visual Accessibility" gradient="from-violet-500 to-purple-600">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Font Size</label>
                                        <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all font-medium">
                                            <option value="small">Small</option>
                                            <option value="medium">Medium</option>
                                            <option value="large">Large</option>
                                            <option value="xlarge">Extra Large</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-gray-800">High Contrast Mode</p>
                                            <p className="text-sm text-gray-500">Better visibility</p>
                                        </div>
                                        <ToggleSwitch enabled={highContrast} onChange={() => setHighContrast(!highContrast)} />
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-gray-800">Reduce Motion</p>
                                            <p className="text-sm text-gray-500">Disable animations</p>
                                        </div>
                                        <ToggleSwitch enabled={reduceMotion} onChange={() => setReduceMotion(!reduceMotion)} />
                                    </div>
                                </div>
                            </SettingCard>

                            <SettingCard icon={FaUser} title="Assistive Features" gradient="from-indigo-500 to-blue-600">
                                <div className="space-y-3">
                                    <button className="w-full px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 font-semibold rounded-xl hover:from-indigo-100 hover:to-blue-100 transition-all border-2 border-indigo-200 text-left flex items-center gap-3">
                                        <div className="bg-indigo-500 p-2 rounded-lg text-white">
                                            <FaUser />
                                        </div>
                                        Screen Reader Support
                                    </button>
                                    <button className="w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-500 font-semibold rounded-xl border-2 border-gray-200 text-left flex items-center gap-3 opacity-60 cursor-not-allowed">
                                        <div className="bg-gray-400 p-2 rounded-lg text-white">
                                            <FaBell />
                                        </div>
                                        Voice Commands (Coming Soon)
                                    </button>
                                    <button className="w-full px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 font-semibold rounded-xl hover:from-indigo-100 hover:to-blue-100 transition-all border-2 border-indigo-200 text-left flex items-center gap-3">
                                        <div className="bg-indigo-500 p-2 rounded-lg text-white">
                                            <FaCode />
                                        </div>
                                        Keyboard Shortcuts
                                    </button>
                                </div>
                            </SettingCard>
                        </div>
                    )
                }

                {/* SECURITY TAB */}
                {
                    activeTab === 'security' && (
                        <div className="grid grid-cols-1 gap-6">
                            <SettingCard icon={FaLock} title="Security Settings" gradient="from-red-500 to-rose-600">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className="px-6 py-4 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 font-bold rounded-xl hover:from-red-100 hover:to-rose-100 transition-all border-2 border-red-200 transform hover:scale-105 flex flex-col items-center gap-2"
                                    >
                                        <FaLock className="text-2xl" />
                                        <span>Change Password</span>
                                    </button>
                                    <button
                                        onClick={() => setShow2FAModal(true)}
                                        className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-bold rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all border-2 border-blue-200 transform hover:scale-105 flex flex-col items-center gap-2"
                                    >
                                        <FaShieldAlt className="text-2xl" />
                                        <span>Two-Factor Auth</span>
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex flex-col items-center gap-2"
                                    >
                                        <FaExclamationTriangle className="text-2xl" />
                                        <span>Delete Account</span>
                                    </button>
                                </div>
                            </SettingCard>
                        </div>
                    )
                }

                {/* MY PLAN TAB */}
                {
                    activeTab === 'plan' && (
                        <div className="max-w-2xl mx-auto animate-fade-in">
                            <SettingCard icon={FaCreditCard} title="Subscription Management" gradient="from-amber-500 to-yellow-600">
                                <div className="text-center py-6">
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 ${isPremium ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {isPremium ? <><FaCrown className="text-amber-500" /> Premium Member</> : 'Free Plan'}
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                        {isPremium ? 'You have full access!' : 'Unlock Premium Access'}
                                    </h3>
                                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                                        {isPremium
                                            ? `Your subscription is active until ${subEndDate ? new Date(subEndDate).toLocaleDateString() : 'N/A'}. Enjoy unlimited beauty analysis and priority AI tips.`
                                            : 'Upgrade to get unlimited face analysis, personalized skincare routines, and exclusive AI-powered beauty insights.'}
                                    </p>

                                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8 text-left">
                                        <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                            <FaCheck className="text-green-500" /> Included Features
                                        </h4>
                                        <ul className="space-y-3">
                                            <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                Unlimited Real-time Analysis
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                Deep Skin Health Insights
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                Exportable PDF Reports
                                            </li>
                                        </ul>
                                    </div>

                                    {isPremium ? (
                                        <div className="space-y-4">
                                            <button
                                                onClick={handleCancelSubscription}
                                                className="w-full py-4 bg-white border-2 border-red-100 text-red-600 font-bold rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                <FaTimes /> Cancel Subscription
                                            </button>
                                            <p className="text-xs text-gray-400">
                                                If you cancel, you will maintain access until the end of your billing cycle.
                                            </p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => window.location.href = '/premium'}
                                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold rounded-2xl hover:shadow-lg transform hover:-translate-y-1 transition-all"
                                        >
                                            Upgrade Now
                                        </button>
                                    )}
                                </div>
                            </SettingCard>
                        </div>
                    )
                }
            </div >

            {/* Floating Save Button */}
            < div className="fixed bottom-8 right-8 z-50" >
                <button
                    onClick={handleSave}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300"
                >
                    <FaSave className="text-xl" />
                    <span className="text-lg">Save All Changes</span>
                </button>
            </div >

            {/* Modals with Premium Design */}
            {
                showPasswordModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold flex items-center gap-3">
                                        <FaLock /> Change Password
                                    </h3>
                                    <button onClick={() => setShowPasswordModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all">
                                        <FaTimes className="text-xl" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current Password" className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all" />
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all" />
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all" />
                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setShowPasswordModal(false)} className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
                                    <button onClick={handlePasswordChange} className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-rose-700 transition-all shadow-lg">Change Password</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                show2FAModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold flex items-center gap-3">
                                        <FaShieldAlt /> Two-Factor Authentication
                                    </h3>
                                    <button onClick={() => { setShow2FAModal(false); setTwoFAStep('initial'); }} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all">
                                        <FaTimes className="text-xl" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                {twoFAStep === 'initial' && (
                                    <>
                                        <p className="text-gray-600 mb-4 leading-relaxed">
                                            {twoFAEnabled
                                                ? "Two-factor authentication is currently enabled for your account. This adds an extra layer of security when you log in."
                                                : "Add an extra layer of security to your account with two-factor authentication using an authenticator app."}
                                        </p>
                                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                                            <p className="text-sm text-blue-800 flex items-start gap-2">
                                                <span className="text-xl">📱</span>
                                                <span><strong>Note:</strong> You'll need an app like Google Authenticator or Authy.</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => setShow2FAModal(false)} className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Close</button>
                                            {twoFAEnabled ? (
                                                <button onClick={handleDisable2FA} className="flex-1 px-6 py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg">Disable 2FA</button>
                                            ) : (
                                                <button onClick={handleEnable2FA} className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg">Begin Setup</button>
                                            )}
                                        </div>
                                    </>
                                )}

                                {twoFAStep === 'setup' && (
                                    <div className="text-center animate-fade-in">
                                        <p className="text-sm text-gray-600 mb-4">Scan this QR code with your authenticator app:</p>
                                        {qrCode && (
                                            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 inline-block mb-4 shadow-inner">
                                                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 mx-auto" />
                                            </div>
                                        )}
                                        <div className="bg-gray-50 p-3 rounded-xl mb-6 text-left border border-gray-200">
                                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Manual Entry Secret:</p>
                                            <code className="text-xs font-mono break-all text-blue-700 font-bold">{twoFASecret}</code>
                                        </div>
                                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6 text-left">
                                            <p className="text-[10px] uppercase font-bold text-yellow-700 mb-2">Emergency Backup Codes:</p>
                                            <div className="grid grid-cols-2 gap-1 mb-2">
                                                {backupCodes.slice(0, 4).map((code, i) => (
                                                    <code key={i} className="text-[10px] font-mono text-gray-600">{code}</code>
                                                ))}
                                            </div>
                                            <p className="text-[9px] text-yellow-600 font-medium">⚠️ Save these codes! They are the only way to recover your account if you lose your phone.</p>
                                        </div>
                                        <button
                                            onClick={() => setTwoFAStep('verify')}
                                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                                        >
                                            I've scanned it, continue
                                        </button>
                                    </div>
                                )}

                                {twoFAStep === 'verify' && (
                                    <div className="text-center animate-fade-in">
                                        <div className="bg-blue-500 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl mb-4 shadow-lg">
                                            <FaKey />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-800 mb-2">Enter Verification Code</h4>
                                        <p className="text-sm text-gray-500 mb-6">Enter the 6-digit code from your app to confirm setup.</p>

                                        <input
                                            type="text"
                                            maxLength="6"
                                            placeholder="000000"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            className="w-full text-center text-3xl tracking-[1rem] py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono mb-6"
                                        />

                                        <div className="flex gap-3">
                                            <button onClick={() => setTwoFAStep('setup')} className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Back</button>
                                            <button
                                                onClick={handleVerify2FA}
                                                disabled={verificationCode.length !== 6}
                                                className={`flex-1 px-6 py-3.5 font-bold rounded-xl transition-all shadow-lg ${verificationCode.length === 6
                                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                Complete Activation
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                            <div className="bg-gradient-to-r from-red-600 to-rose-700 p-6 text-white">
                                <div className="flex items-center gap-3">
                                    <FaExclamationTriangle className="text-3xl" />
                                    <h3 className="text-2xl font-bold">Delete Account</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 mb-6">
                                    <p className="text-red-800 font-bold mb-3 flex items-center gap-2">
                                        <FaExclamationTriangle /> Warning: This action cannot be undone!
                                    </p>
                                    <p className="text-sm text-red-700 mb-2">Deleting your account will permanently remove:</p>
                                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1 ml-2">
                                        <li>All your analysis history</li>
                                        <li>Saved preferences and settings</li>
                                        <li>Account information</li>
                                        <li>All associated data</li>
                                    </ul>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
                                    <button onClick={handleDeleteAccount} className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-rose-700 transition-all shadow-lg">Delete Forever</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
};

export default SettingsPage;
