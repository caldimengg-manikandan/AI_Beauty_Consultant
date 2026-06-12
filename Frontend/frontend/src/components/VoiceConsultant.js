import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiMic, FiMicOff, FiVolumeX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../services/api';

const SUPPORTED = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

export default function VoiceConsultant({ onTranscript }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [displayTranscript, setDisplayTranscript] = useState('');
  const [pulse, setPulse] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  // Use a ref so onend callback always reads the latest value (no stale closure)
  const transcriptRef = useRef('');
  const isMountedRef = useRef(true);

  const sendToAI = useCallback(async (text) => {
    if (onTranscript) onTranscript(text);
    try {
      const res = await api.post('/api/chat/message', { message: text });
      const reply = res.data?.reply || "I'm here to help with your beauty queries!";
      speak(reply);
    } catch {
      speak("Sorry, I couldn't connect right now. Please try again.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTranscript]);

  useEffect(() => {
    if (!SUPPORTED) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      setPulse(true);
      transcriptRef.current = '';
      setDisplayTranscript('');
    };

    recognition.onresult = (e) => {
      const current = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      transcriptRef.current = current;    // update ref (no stale closure)
      setDisplayTranscript(current);       // update display state
    };

    recognition.onend = async () => {
      setIsListening(false);
      setPulse(false);
      const final = transcriptRef.current; // always fresh value
      if (final.trim()) {
        await sendToAI(final);
      }
    };

    recognition.onerror = (e) => {
      if (!isMountedRef.current) return;
      setIsListening(false);
      setPulse(false);
      // 'no-speech'  → user was silent, ignore silently
      // 'aborted'    → we called abort() ourselves during cleanup / restart, ignore
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (e.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone in your browser settings.');
      } else if (e.error === 'audio-capture') {
        toast.error('No microphone detected. Please connect one and try again.');
      } else if (e.error === 'network') {
        toast.error('Voice recognition needs an internet connection. Please check and retry.');
      } else {
        toast.error('Microphone error. Please try again.');
      }
    };

    recognitionRef.current = recognition;
    return () => {
      isMountedRef.current = false;
      recognition.abort();
    };
  }, [sendToAI]); // only re-register when sendToAI changes (stable)

  // Reset isMounted on first mount; flip false only on final unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);


  const speak = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    // Prefer a female voice if available
    const voices = synthRef.current.getVoices();
    const femaleVoice = voices.find(v =>
      v.name.toLowerCase().includes('female') ||
      v.name.includes('Samantha') ||
      v.name.includes('Google UK English Female') ||
      v.name.includes('Microsoft Zira')
    );
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); setDisplayTranscript(''); };
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  const toggleListening = () => {
    if (!SUPPORTED) {
      toast.error('Voice recognition is not supported in this browser. Please use Chrome.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      transcriptRef.current = '';
      setDisplayTranscript('');
      try {
        recognitionRef.current?.start();
      } catch (err) {
        // InvalidStateError means recognition already started — safe to ignore
        if (!err?.message?.toLowerCase().includes('already started')) {
          toast.error('Could not start microphone. Please try again.');
        }
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Transcript Display */}
      <AnimatePresence>
        {displayTranscript && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-20 right-4 max-w-xs bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 italic"
          >
            "{displayTranscript}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stop Speaking Button */}
      {isSpeaking && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={stopSpeaking}
          className="w-10 h-10 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition-all"
          title="Stop speaking"
        >
          <FiVolumeX size={16} />
        </motion.button>
      )}

      {/* Speaking Indicator */}
      {isSpeaking && !isListening && (
        <div className="flex items-center gap-1">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-indigo-400 rounded-full"
              animate={{ height: ['6px', '18px', '6px'] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {/* Mic Button */}
      <motion.button
        onClick={toggleListening}
        whileTap={{ scale: 0.9 }}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
          isListening
            ? 'bg-red-500 text-white shadow-red-500/40'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/30'
        }`}
        title={isListening ? 'Stop listening' : 'Ask AI with voice'}
      >
        {isListening ? <FiMicOff size={20} /> : <FiMic size={20} />}
        {/* Pulse Rings */}
        {pulse && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full bg-red-400"
              animate={{ scale: [1, 1.6, 1.8], opacity: [0.6, 0.2, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.span
              className="absolute inset-0 rounded-full bg-red-300"
              animate={{ scale: [1, 1.3, 1.5], opacity: [0.4, 0.15, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}
      </motion.button>
    </div>
  );
}
