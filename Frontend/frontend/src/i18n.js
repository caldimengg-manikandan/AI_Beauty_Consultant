import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: {
                    "welcome": "Welcome back",
                    "skin_analysis": "Skin Analysis",
                    "dashboard": "Dashboard",
                    "settings": "Settings",
                    "start_scan": "Start New Scan",
                    "premium": "Go Premium",
                    "history": "History",
                    "logout": "Logout",
                    "language": "Language"
                }
            },
            es: {
                translation: {
                    "welcome": "Bienvenido de nuevo",
                    "skin_analysis": "Análisis de piel",
                    "dashboard": "Panel",
                    "settings": "Configuración",
                    "start_scan": "Iniciar escaneo",
                    "premium": "Hazte Premium",
                    "history": "Historial",
                    "logout": "Cerrar sesión",
                    "language": "Idioma"
                }
            },
            hi: {
                translation: {
                    "welcome": "वापसी पर स्वागत है",
                    "skin_analysis": "त्वचा विश्लेषण",
                    "dashboard": "डैशबोर्ड",
                    "settings": "सेटिंग्स",
                    "start_scan": "नया स्कैन शुरू करें",
                    "premium": "प्रीमियम बनें",
                    "history": "इतिहास",
                    "logout": "लॉग आउट",
                    "language": "भाषा"
                }
            },
            ta: {
                translation: {
                    "welcome": "மீண்டும் வருக",
                    "skin_analysis": "தோல் பகுப்பாய்வு",
                    "dashboard": "டாஷ்போர்டு",
                    "settings": "அமைப்புகள்",
                    "start_scan": "புதிய ஸ்கேன் தொடங்கவும்",
                    "premium": "பிரீமியம் பெறுக",
                    "history": "வரலாறு",
                    "logout": "வெளியேறு",
                    "language": "மொழி"
                }
            },
            fr: {
                translation: {
                    "welcome": "Bon retour",
                    "skin_analysis": "Analyse de peau",
                    "dashboard": "Tableau de bord",
                    "settings": "Paramètres",
                    "start_scan": "Démarrer l'analyse",
                    "premium": "Passer au Premium",
                    "history": "Historique",
                    "logout": "Déconnexion",
                    "language": "Langue"
                }
            },
            ar: {
                translation: {
                    "welcome": "مرحباً بعودتك",
                    "skin_analysis": "تحليل البشرة",
                    "dashboard": "لوحة القيادة",
                    "settings": "الإعدادات",
                    "start_scan": "بدء مسح جديد",
                    "premium": "انتقل للنسخة المميزة",
                    "history": "السجل",
                    "logout": "تسجيل الخروج",
                    "language": "اللغة"
                }
            }
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
