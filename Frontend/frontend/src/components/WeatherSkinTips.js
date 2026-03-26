import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SKIN_TIPS = {
    Clear: {
        emoji: '☀️', label: 'Clear & Sunny', color: '#F59E0B',
        tips: ['Apply SPF 50 sunscreen — UV is at its strongest!', 'Wear a wide-brim hat if outdoors for 30+ min.', 'Vitamin C serum in the AM will enhance your glow.'],
        warning: 'UV Index is high today. Reapply sunscreen every 2 hours.',
    },
    Clouds: {
        emoji: '⛅', label: 'Partly Cloudy', color: '#6B7280',
        tips: ['UV still reaches skin through clouds — don\'t skip SPF!', 'Great day for a gentle exfoliation.', 'Antioxidant serum is perfect for overcast days.'],
        warning: 'Clouds block only 20% of UV. Sunscreen is still required.',
    },
    Rain: {
        emoji: '🌧️', label: 'Rainy Day', color: '#3B82F6',
        tips: ['High humidity — switch to a lightweight gel moisturiser.', 'Skip heavy oils today to prevent breakouts.', 'Perfect day for a hydrating sheet mask!'],
        warning: 'Rainy weather can increase bacterial skin exposure. Cleanse gently.',
    },
    Snow: {
        emoji: '❄️', label: 'Cold & Snowy', color: '#A5F3FC',
        tips: ['Cold air strips moisture — use a rich cream moisturiser.', 'Snow reflects UV — SPF is essential outdoors!', 'Apply lip balm and hand cream frequently.'],
        warning: 'Snow reflects up to 80% of UV radiation. SPF 50+ is a must.',
    },
    Thunderstorm: {
        emoji: '⛈️', label: 'Stormy', color: '#4B5563',
        tips: ['Stay indoors and do a deep conditioning hair & skin mask.', 'Now is a great time for your retinol or AHA treatment.', 'Drink plenty of water — indoor heating dehydrates skin.'],
        warning: '',
    },
    Drizzle: {
        emoji: '🌦️', label: 'Light Drizzle', color: '#60A5FA',
        tips: ['Use a water-resistant SPF today.', 'Opt for a matte-finish moisturiser to control shine.', 'A hydrating toner will balance your skin barrier.'],
        warning: '',
    },
    Mist: {
        emoji: '🌫️', label: 'Misty / Foggy', color: '#9CA3AF',
        tips: ['Humid air is great for skin! Focus on barrier protection.', 'A lightweight serum works perfectly in misty weather.', 'Don\'t over-moisturise — your skin is absorbing ambient humidity.'],
        warning: '',
    },
    Haze: {
        emoji: '😶‍🌫️', label: 'Hazy / Smoggy', color: '#D97706',
        tips: ['Double cleanse tonight to remove pollution particles.', 'Apply Vitamin C serum to combat free radical damage.', 'An antioxidant moisturiser will shield your skin barrier.'],
        warning: 'High pollution today. Use an antioxidant serum and cleanse twice at night.',
    },
};

const getWeatherType = (main) => {
    const map = { Clear: 'Clear', Clouds: 'Clouds', Rain: 'Rain', Drizzle: 'Drizzle', Thunderstorm: 'Thunderstorm', Snow: 'Snow', Mist: 'Mist', Fog: 'Mist', Haze: 'Haze', Smoke: 'Haze', Dust: 'Haze', Sand: 'Haze', Ash: 'Haze', Squall: 'Rain', Tornado: 'Thunderstorm' };
    return map[main] || 'Clear';
};

const WeatherSkinTips = () => {
    const [weather, setWeather] = useState(null);
    const [tips, setTips] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [city, setCity] = useState('');

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    try {
                        const { latitude, longitude } = pos.coords;
                        // Use open-meteo (no API key needed, free & unlimited)
                        const geoRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=precipitation,cloudcover,visibility`);
                        const geoData = await geoRes.json();

                        // Reverse geocode city name
                        const revGeo = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const revData = await revGeo.json();
                        setCity(revData.address?.city || revData.address?.town || revData.address?.state || 'Your Location');

                        const code = geoData.current_weather?.weathercode;
                        const temp = geoData.current_weather?.temperature;
                        const wind = geoData.current_weather?.windspeed;

                        // Map WMO weather codes to our categories
                        let weatherMain = 'Clear';
                        if (code === 0) weatherMain = 'Clear';
                        else if ([1, 2, 3].includes(code)) weatherMain = 'Clouds';
                        else if ([45, 48].includes(code)) weatherMain = 'Mist';
                        else if ([51, 53, 55, 56, 57].includes(code)) weatherMain = 'Drizzle';
                        else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) weatherMain = 'Rain';
                        else if ([71, 73, 75, 77, 85, 86].includes(code)) weatherMain = 'Snow';
                        else if ([95, 96, 99].includes(code)) weatherMain = 'Thunderstorm';

                        const wtype = getWeatherType(weatherMain);
                        setWeather({ main: weatherMain, temp: Math.round(temp), wind: Math.round(wind) });
                        setTips(SKIN_TIPS[wtype]);
                    } catch (err) {
                        setError('Weather data unavailable. Showing general tips.');
                        setTips(SKIN_TIPS['Clear']);
                    } finally {
                        setLoading(false);
                    }
                },
                () => {
                    setError('Location access denied. Enable location for personalised tips.');
                    setTips(SKIN_TIPS['Clear']);
                    setLoading(false);
                }
            );
        } else {
            setError('Geolocation not supported by this browser.');
            setTips(SKIN_TIPS['Clear']);
            setLoading(false);
        }
    }, []);

    if (loading) return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 animate-pulse">
            <div className="h-4 bg-slate-100 rounded-full w-1/3 mb-4" />
            <div className="h-8 bg-slate-100 rounded-full w-2/3 mb-6" />
            <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-4 bg-slate-100 rounded-full" />)}
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
        >
            {/* Colour accent strip based on weather */}
            <div className="h-2" style={{ backgroundColor: tips?.color || '#6366F1' }} />

            <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Live Weather Skin Tips</p>
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">{tips?.emoji}</span>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase italic">{tips?.label}</h3>
                                {city && <p className="text-xs text-slate-400 font-medium">{city}</p>}
                            </div>
                        </div>
                    </div>
                    {weather && (
                        <div className="text-right shrink-0 bg-slate-50 rounded-2xl px-5 py-3 border border-slate-100">
                            <p className="text-2xl font-black text-slate-900">{weather.temp}°C</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{weather.wind} km/h wind</p>
                        </div>
                    )}
                </div>

                {/* Warning */}
                {tips?.warning && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                        <span className="text-amber-500 text-lg shrink-0">⚠️</span>
                        <p className="text-xs font-medium text-amber-700 leading-relaxed">{tips.warning}</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3">
                        <span className="text-slate-400 shrink-0">ℹ️</span>
                        <p className="text-xs font-medium text-slate-500">{error}</p>
                    </div>
                )}

                {/* Tips */}
                <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Today's Skin Tips</p>
                    {tips?.tips.map((tip, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100"
                        >
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0" style={{ backgroundColor: tips.color }}>
                                {i + 1}
                            </div>
                            <p className="text-sm font-medium text-slate-700 leading-relaxed">{tip}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default WeatherSkinTips;
