module.exports = {
    darkMode: 'class',
    content: ["./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    50:  '#EFEDFE',
                    100: '#DDD9FD',
                    200: '#BCB5FB',
                    300: '#9A91F8',
                    400: '#7C6CF9',
                    500: '#5B4FF7',  // primary
                    600: '#4a41d4',  // hover
                    700: '#3831A1',
                    800: '#27216E',
                    900: '#15113A',
                },
            },
            fontFamily: {
                sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
                display: ['Outfit', 'Inter', 'sans-serif'],
            },
            fontSize: {
                '2xs': ['10px', { lineHeight: '1.4' }],
                'xs':  ['12px', { lineHeight: '1.5' }],
                'sm':  ['13px', { lineHeight: '1.5' }],
                'base':['15px', { lineHeight: '1.6' }],
                'lg':  ['17px', { lineHeight: '1.6' }],
                'xl':  ['20px', { lineHeight: '1.4' }],
                '2xl': ['24px', { lineHeight: '1.3' }],
                '3xl': ['30px', { lineHeight: '1.2' }],
                '4xl': ['36px', { lineHeight: '1.15' }],
                '5xl': ['48px', { lineHeight: '1.1' }],
                '6xl': ['56px', { lineHeight: '1.05' }],
                '7xl': ['64px', { lineHeight: '1.0' }],
            },
            spacing: {
                '18': '72px',
                '22': '88px',
                '26': '104px',
                '30': '120px',
            },
            borderRadius: {
                '4xl': '32px',
            },
            animation: {
                'fade-in-up':  'fadeInUp 0.5s ease-out forwards',
                'pulse-slow':  'pulse 3s infinite',
                'blob':        'blob 9s infinite ease-in-out',
            },
            keyframes: {
                fadeInUp: {
                    '0%':   { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                blob: {
                    '0%,100%': { transform: 'translate(0,0) scale(1)' },
                    '33%':     { transform: 'translate(20px,-30px) scale(1.06)' },
                    '66%':     { transform: 'translate(-15px,15px) scale(0.95)' },
                },
            },
            boxShadow: {
                'brand-sm': '0 2px 8px rgba(91,79,247,0.15)',
                'brand-md': '0 4px 20px rgba(91,79,247,0.20)',
                'brand-lg': '0 8px 32px rgba(91,79,247,0.25)',
            },
        },
    },
    plugins: [],
};
