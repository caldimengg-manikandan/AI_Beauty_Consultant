import React from 'react';

/**
 * Professional Loading Component with Multiple Variants
 * Usage: <Loader variant="spinner" message="Analyzing your image..." />
 */

const Loader = ({ variant = 'spinner', message = 'Loading...', size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16'
    };

    // Spinner Variant (Default)
    if (variant === 'spinner') {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <svg
                    className={`animate-spin ${sizeClasses[size]} text-purple-600`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
                {message && (
                    <p className="mt-4 text-gray-600 font-medium animate-pulse">{message}</p>
                )}
            </div>
        );
    }

    // Dots Variant
    if (variant === 'dots') {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                {message && (
                    <p className="mt-4 text-gray-600 font-medium">{message}</p>
                )}
            </div>
        );
    }

    // Progress Bar Variant
    if (variant === 'progress') {
        return (
            <div className="flex flex-col items-center justify-center p-8 w-full max-w-md">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
                    <div className="h-2.5 bg-gradient-to-r from-purple-600 to-teal-600 rounded-full animate-progress"></div>
                </div>
                {message && (
                    <p className="text-gray-600 font-medium text-center">{message}</p>
                )}
            </div>
        );
    }

    // Pulse Variant (Skeleton)
    if (variant === 'pulse') {
        return (
            <div className="flex flex-col items-center justify-center p-8 w-full">
                <div className="w-full max-w-md space-y-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
                </div>
                {message && (
                    <p className="mt-6 text-gray-600 font-medium">{message}</p>
                )}
            </div>
        );
    }

    // AI Analysis Variant (Special for face analysis)
    if (variant === 'ai-analysis') {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <div className="relative">
                    {/* Outer rotating ring */}
                    <div className="w-24 h-24 border-4 border-purple-200 rounded-full animate-spin"></div>
                    {/* Inner pulsing circle */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-teal-600 rounded-full animate-pulse flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="mt-6 text-center">
                    <p className="text-lg font-bold text-gray-800 mb-1">{message || 'Analyzing Your Face...'}</p>
                    <p className="text-sm text-gray-500">This may take a few seconds</p>
                </div>
                {/* Progress steps */}
                <div className="mt-6 flex items-center space-x-2 text-xs text-gray-500">
                    <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                        Detecting face
                    </span>
                    <span className="text-gray-300">→</span>
                    <span className="flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-1 animate-pulse"></span>
                        Analyzing features
                    </span>
                    <span className="text-gray-300">→</span>
                    <span className="flex items-center opacity-50">
                        <span className="w-2 h-2 bg-gray-300 rounded-full mr-1"></span>
                        Generating insights
                    </span>
                </div>
            </div>
        );
    }

    return null;
};

export default Loader;
