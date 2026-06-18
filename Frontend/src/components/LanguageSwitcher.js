import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe, FaCheck } from 'react-icons/fa';

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇦🇪', isRtl: true },
];

const LanguageSwitcher = ({ variant = 'default' }) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (lang) => {
        setIsOpen(false);

        // 1. Update React Language
        i18n.changeLanguage(lang.code);

        // 2. Handle RTL
        document.documentElement.dir = lang.isRtl ? 'rtl' : 'ltr';
        document.documentElement.lang = lang.code;

        // 3. Forced Cookie Method (Pro) - Ensures persistence and instant trigger
        document.cookie = `googtrans=/en/${lang.code}; path=/`;
        document.cookie = `googtrans=/en/${lang.code}; path=/; domain=${window.location.hostname}`;

        // 4. Trigger Widget Fallback
        const googleSelect = document.querySelector('.goog-te-combo');
        if (googleSelect) {
            googleSelect.value = lang.code;
            googleSelect.dispatchEvent(new Event('change'));
        }

        // 5. Reload to capture the entire React DOM for translation
        window.location.reload();
    };

    if (variant === 'minimal') {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 p-3 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100 bg-white"
                >
                    <span className="text-xl">{currentLanguage.flag}</span>
                </button>
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-3xl shadow-2xl py-3 z-[100] animate-fade-in-up">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang)}
                                className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors text-sm"
                            >
                                <span className="flex items-center gap-3">
                                    <span>{lang.flag}</span>
                                    <span className="font-bold text-slate-700">{lang.name}</span>
                                </span>
                                {i18n.language === lang.code && <FaCheck className="text-indigo-600 size-3" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 border ${isOpen
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.05]'
                    : 'bg-white/80 backdrop-blur-md text-slate-700 border-slate-200 hover:border-indigo-400 hover:shadow-md'
                    }`}
            >
                <FaGlobe className={isOpen ? 'animate-spin-slow' : ''} />
                <span className="font-black text-xs uppercase tracking-widest hidden sm:block">
                    {currentLanguage.name}
                </span>
                <span className="text-lg">{currentLanguage.flag}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-64 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.15)] py-6 z-[100] animate-fade-in-up">
                    <div className="px-8 py-2 mb-3 border-b border-slate-50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Language</span>
                    </div>
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang)}
                            className={`w-full flex items-center justify-between px-8 py-4 transition-all duration-200 ${i18n.language === lang.code
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'hover:bg-slate-50 text-slate-600 hover:translate-x-1'
                                }`}
                        >
                            <span className="flex items-center gap-4">
                                <span className="text-2xl">{lang.flag}</span>
                                <span className="font-black text-xs uppercase tracking-tighter">{lang.name}</span>
                            </span>
                            {i18n.language === lang.code && <FaCheck className="size-3" />}
                        </button>
                    ))}

                    <div className="mt-6 px-8 py-3 bg-slate-50/50 rounded-b-[2.5rem] border-t border-slate-100 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                Adaptive Neural Engine
                            </p>
                        </div>
                        <p className="text-[8px] text-slate-400 font-medium uppercase tracking-tighter">
                            Real-time AI Optimization Active
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;
