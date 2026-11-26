import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom hook wrapping the browser Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * Supports English (en-IN) and Hindi (hi-IN), real-time interim transcripts,
 * graceful unsupported-browser detection, and explicit microphone permission handling.
 */
export function useSpeechRecognition({ language = 'en-IN', onFinalTranscript }) {
  const SpeechRecognitionClass =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = Boolean(SpeechRecognitionClass);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const manualStopRef = useRef(false);
  const onFinalRef = useRef(onFinalTranscript);

  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors if already stopped
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(async () => {
    setError(null);

    if (!SpeechRecognitionClass) {
      setError(
        'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge, or switch to Text Input.'
      );
      return;
    }

    // Check microphone permission explicitly via MediaDevices when available
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (permErr) {
        const name = permErr?.name || '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setError(
            'Microphone access was denied. Please allow microphone permission in your browser address bar or switch to Text Input.'
          );
        } else if (name === 'NotFoundError') {
          setError('No microphone device was detected. Please connect a microphone or use Text Input.');
        } else {
          setError('Could not access the microphone. Please check your device settings or use Text Input.');
        }
        return;
      }
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      manualStopRef.current = false;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalChunk += piece + ' ';
          } else {
            interim += piece;
          }
        }

        setInterimTranscript(interim.trim());
        if (finalChunk.trim() && onFinalRef.current) {
          onFinalRef.current(finalChunk.trim());
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError(
            'Microphone permission was denied by the browser. Allow mic access and try again, or use Text Input.'
          );
        } else if (event.error === 'no-speech') {
          setError('No speech was detected. Please speak closer to your microphone and try again.');
        } else if (event.error === 'audio-capture') {
          setError('No microphone was found or it is busy in another application.');
        } else if (event.error === 'network') {
          setError(
            'Browser speech recognition service encountered a network issue. You can type or edit your complaint manually.'
          );
        } else if (event.error !== 'aborted') {
          setError(`Speech recognition error: ${event.error}. You can continue editing manually.`);
        }
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setError('Failed to start voice recognition. Please try again or switch to Text Input.');
      setIsListening(false);
    }
  }, [SpeechRecognitionClass, language]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    error,
    clearError: () => setError(null),
    startListening,
    stopListening,
  };
}
