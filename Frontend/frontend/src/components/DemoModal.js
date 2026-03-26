import React, { useState } from 'react';
import { FaTimes, FaMagic, FaInfoCircle } from 'react-icons/fa';
import { getDemoOptions } from '../data/demoData';

/**
 * Demo Mode Modal
 * Allows users to try the app with pre-loaded sample analyses
 */

const DemoModal = ({ isOpen, onClose, onSelectDemo }) => {
    const [selectedDemo, setSelectedDemo] = useState(null);
    const demoOptions = getDemoOptions();

    if (!isOpen) return null;

    const handleTryDemo = () => {
        if (selectedDemo) {
            onSelectDemo(selectedDemo);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-teal-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                        <FaTimes className="text-xl" />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <FaMagic className="text-3xl" />
                        <h2 className="text-3xl font-bold">Try Demo Mode</h2>
                    </div>
                    <p className="text-purple-100">
                        Experience our AI beauty analysis with pre-loaded sample results
                    </p>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 m-6 rounded-lg">
                    <div className="flex items-start gap-3">
                        <FaInfoCircle className="text-blue-500 text-xl mt-1" />
                        <div>
                            <h3 className="font-bold text-blue-900 mb-1">Demo Mode</h3>
                            <p className="text-sm text-blue-800">
                                These are sample analyses to showcase our AI capabilities.
                                <span className="font-semibold"> Sign up to analyze your own photos!</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Demo Options Grid */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Choose a Sample Analysis:</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {demoOptions.map((demo) => (
                            <button
                                key={demo.id}
                                onClick={() => setSelectedDemo(demo.id)}
                                className={`text-left p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${selectedDemo === demo.id
                                        ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                                        : 'border-gray-200 hover:border-purple-300'
                                    }`}
                            >
                                <div className="flex gap-4">
                                    {/* Demo Image */}
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={demo.imageUrl}
                                            alt={demo.name}
                                            className="w-24 h-24 rounded-xl object-cover"
                                        />
                                        {selectedDemo === demo.id && (
                                            <div className="absolute inset-0 bg-purple-600/20 rounded-xl flex items-center justify-center">
                                                <div className="bg-purple-600 text-white rounded-full p-2">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Demo Info */}
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 mb-1">{demo.name}</h4>
                                        <p className="text-sm text-gray-600">{demo.description}</p>

                                        {selectedDemo === demo.id && (
                                            <div className="mt-2 flex items-center gap-2 text-purple-600 text-sm font-semibold">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Selected
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-gray-700 font-semibold hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleTryDemo}
                        disabled={!selectedDemo}
                        className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex items-center gap-2 ${selectedDemo
                                ? 'bg-gradient-to-r from-purple-600 to-teal-600 hover:scale-105 hover:shadow-xl'
                                : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <FaMagic />
                        Try This Demo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DemoModal;
