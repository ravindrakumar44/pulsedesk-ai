import { Mic, MicOff, Square, AlertTriangle, Globe, Sparkles } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export default function VoiceRecorder({
  language,
  onLanguageChange,
  onTranscriptAppend,
  onSwitchToText,
}) {
  const {
    isSupported,
    isListening,
    interimTranscript,
    error,
    clearError,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    language,
    onFinalTranscript: (chunk) => {
      onTranscriptAppend(chunk);
    },
  });

  if (!isSupported) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900">
              Web Speech API Not Supported in This Browser
            </h4>
            <p className="mt-1 text-sm text-amber-800">
              Your current browser does not support built-in speech recognition (`SpeechRecognition`).
              Please open this page in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> for voice recording, or switch to manual text input below.
            </p>
            {onSwitchToText && (
              <button
                type="button"
                onClick={onSwitchToText}
                className="mt-3 inline-flex items-center rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
              >
                Switch to Text Input
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-all focus:outline-none focus:ring-4 ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-200 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-200'
            }`}
            aria-label={isListening ? 'Stop voice recording' : 'Start voice recording'}
          >
            {isListening ? <Square className="h-6 w-6 fill-current" /> : <Mic className="h-7 w-7" />}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  isListening ? 'bg-rose-500 animate-ping' : 'bg-slate-300'
                }`}
              />
              <h4 className="text-sm font-semibold text-slate-900">
                {isListening ? 'Listening... Speak clearly into your microphone' : 'Ready for Voice Input'}
              </h4>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {isListening
                ? 'Click the red square button to stop recording. Your words appear live below and can be edited before submitting.'
                : 'Click the microphone button to speak your complaint. You will review & edit the transcript before submitting.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Globe className="h-4 w-4 text-slate-500" />
          <select
            value={language}
            onChange={(e) => {
              if (isListening) stopListening();
              onLanguageChange(e.target.value);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            aria-label="Speech recognition language"
          >
            <option value="en-IN">English (India — en-IN)</option>
            <option value="hi-IN">Hindi (India — hi-IN)</option>
          </select>
        </div>
      </div>

      {isListening && (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-white/90 px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            Live Recognition Preview
          </div>
          <p className="text-sm text-slate-700 italic min-h-[1.25rem]">
            {interimTranscript || 'Waiting for speech...'}
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <MicOff className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="text-xs font-semibold text-rose-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
