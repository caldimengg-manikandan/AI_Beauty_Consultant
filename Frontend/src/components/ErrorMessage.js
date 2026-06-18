import React from 'react';
import { FaExclamationTriangle, FaTimesCircle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';

/**
 * Friendly Error/Alert Message Component
 * Converts technical errors into user-friendly messages
 * Usage: <ErrorMessage type="error" message="..." onRetry={() => {}} />
 */

const ErrorMessage = ({
    type = 'error',
    message,
    technicalDetails,
    onRetry,
    onDismiss,
    showDetails = false
}) => {
    const [detailsVisible, setDetailsVisible] = React.useState(false);

    // Convert technical errors to friendly messages
    const getFriendlyMessage = (msg) => {
        if (!msg) return 'Something went wrong. Please try again.';

        const msgLower = msg.toLowerCase();

        // Network errors
        if (msgLower.includes('network') || msgLower.includes('fetch')) {
            return '🌐 Connection issue. Please check your internet and try again.';
        }

        // Authentication errors
        if (msgLower.includes('401') || msgLower.includes('unauthorized') || msgLower.includes('token')) {
            return '🔒 Your session has expired. Please log in again.';
        }

        // Server errors
        if (msgLower.includes('500') || msgLower.includes('internal server')) {
            return '⚠️ Our servers are having a moment. Please try again in a few seconds.';
        }

        // Face detection errors
        if (msgLower.includes('no face') || msgLower.includes('face not found')) {
            return '😊 No face detected. Please ensure your face is clearly visible and well-lit.';
        }

        // Image quality errors
        if (msgLower.includes('blur') || msgLower.includes('quality')) {
            return '📸 Image quality is too low. Please upload a clearer photo.';
        }

        // Module/dependency errors (backend)
        if (msgLower.includes('sklearn') || msgLower.includes('module')) {
            return '🔧 Our AI is updating. Please try again in a moment or contact support.';
        }

        // Timeout errors
        if (msgLower.includes('timeout')) {
            return '⏱️ Analysis took too long. Please try with a smaller image.';
        }

        // Default: use the original message if it's already user-friendly
        if (msg.length < 100 && !msg.includes('{') && !msg.includes('Error:')) {
            return msg;
        }

        return 'Something unexpected happened. Our team has been notified.';
    };

    const config = {
        error: {
            icon: <FaTimesCircle className="text-2xl" />,
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            textColor: 'text-red-800',
            iconColor: 'text-red-500'
        },
        warning: {
            icon: <FaExclamationTriangle className="text-2xl" />,
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            textColor: 'text-orange-800',
            iconColor: 'text-orange-500'
        },
        info: {
            icon: <FaInfoCircle className="text-2xl" />,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-800',
            iconColor: 'text-blue-500'
        },
        success: {
            icon: <FaCheckCircle className="text-2xl" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            textColor: 'text-green-800',
            iconColor: 'text-green-500'
        }
    };

    const style = config[type] || config.error;
    const friendlyMsg = getFriendlyMessage(message);

    return (
        <div className={`${style.bgColor} ${style.borderColor} border-l-4 p-6 rounded-lg shadow-md`}>
            <div className="flex items-start">
                <div className={`${style.iconColor} mr-4 mt-1`}>
                    {style.icon}
                </div>
                <div className="flex-1">
                    <h3 className={`font-bold ${style.textColor} mb-2`}>
                        {type === 'error' && 'Analysis Could Not Complete'}
                        {type === 'warning' && 'Heads Up!'}
                        {type === 'info' && 'Information'}
                        {type === 'success' && 'Success!'}
                    </h3>
                    <p className={`${style.textColor} mb-3`}>{friendlyMsg}</p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-4">
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Try Again
                            </button>
                        )}

                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                            >
                                Dismiss
                            </button>
                        )}

                        {technicalDetails && showDetails && (
                            <button
                                onClick={() => setDetailsVisible(!detailsVisible)}
                                className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                            >
                                {detailsVisible ? 'Hide' : 'Show'} Technical Details
                            </button>
                        )}
                    </div>

                    {/* Technical Details (Collapsible) */}
                    {detailsVisible && technicalDetails && (
                        <div className="mt-4 p-3 bg-gray-100 rounded border border-gray-200">
                            <p className="text-xs font-mono text-gray-600 break-all">
                                {technicalDetails}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErrorMessage;
