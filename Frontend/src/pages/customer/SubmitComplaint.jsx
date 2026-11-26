import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mic, Keyboard, Send, CheckCircle2, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import { extractErrorMessage } from '../../services/api';
import { COMPLAINT_CATEGORIES, formatScore } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import VoiceRecorder from '../../components/VoiceRecorder';
import ConfirmDialog from '../../components/ConfirmDialog';
import { SentimentBadge, EmotionBadge, StatusBadge } from '../../components/SentimentBadge';

export default function SubmitComplaint() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'Text' ? 'Text' : 'Voice';
  const toast = useToast();

  const [inputMethod, setInputMethod] = useState(initialMode);
  const [language, setLanguage] = useState('en-IN');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(COMPLAINT_CATEGORIES[0]);
  const [transcript, setTranscript] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRecord, setSubmittedRecord] = useState(null);

  const handleAppendTranscript = (chunk) => {
    setTranscript((prev) => {
      const base = prev.trimEnd();
      return base ? `${base} ${chunk}` : chunk;
    });
  };

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    setError('');

    if (title.trim().length < 3) {
      setError('Please enter a short complaint title (at least 3 characters).');
      return;
    }
    if (transcript.trim().length < 5) {
      setError(
        inputMethod === 'Voice'
          ? 'Your voice transcript is empty or too short. Please record your complaint or type it into the box.'
          : 'Please describe your issue (at least 5 characters).'
      );
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        complaintTitle: title.trim(),
        complaintDescription: transcript.trim(),
        complaintCategory: category,
        inputMethod,
        transcript: transcript.trim(),
      };
      const created = await complaintService.createComplaint(payload);
      setSubmittedRecord(created);
      setConfirmOpen(false);
      toast.success(`Complaint #${created.id} submitted and analyzed!`);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Could not submit your complaint.');
      setError(msg);
      toast.error(msg);
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedRecord(null);
    setTitle('');
    setTranscript('');
    setError('');
  };

  if (submittedRecord) {
    const sa = submittedRecord.sentimentAnalysis;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Submission Confirmed
              </span>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Complaint #{submittedRecord.id} Logged
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Your complaint has been saved and analyzed by our helpdesk sentiment engine.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200/80 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                {submittedRecord.complaintTitle}
              </h2>
              <StatusBadge status={submittedRecord.status} />
            </div>

            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {submittedRecord.transcript}
            </p>

            {sa && (
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Automated Sentiment Analysis Result
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <SentimentBadge sentiment={sa.sentiment} />
                  <EmotionBadge emotion={sa.emotion} />
                  <span className="rounded-full bg-white border border-slate-200 px-3 py-0.5 text-xs font-mono font-semibold text-slate-700">
                    Heuristic Score: {formatScore(sa.sentimentScore)}
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">{sa.explanation}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={`/customer/complaints/${submittedRecord.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              View Full Ticket <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Submit a Support Complaint</h1>
        <p className="mt-1 text-sm text-slate-600">
          Speak into your microphone for instant speech-to-text transcription, or type your issue manually.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-200/70 p-1.5">
        <button
          type="button"
          onClick={() => setInputMethod('Voice')}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            inputMethod === 'Voice'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mic className="h-4 w-4" />
          Voice Input (Web Speech API)
        </button>
        <button
          type="button"
          onClick={() => setInputMethod('Text')}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            inputMethod === 'Text'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Keyboard className="h-4 w-4" />
          Text Input
        </button>
      </div>

      <form
        onSubmit={handleOpenConfirm}
        className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6"
      >
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Complaint Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Frequent Wi-Fi disconnection"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {COMPLAINT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {inputMethod === 'Voice' && (
          <VoiceRecorder
            language={language}
            onLanguageChange={setLanguage}
            onTranscriptAppend={handleAppendTranscript}
            onSwitchToText={() => setInputMethod('Text')}
          />
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              {inputMethod === 'Voice'
                ? 'Generated Voice Transcript (Editable — review before submitting)'
                : 'Complaint Description'}
            </label>
            {transcript && (
              <button
                type="button"
                onClick={() => setTranscript('')}
                className="text-xs font-medium text-slate-500 hover:text-rose-600"
              >
                Clear text
              </button>
            )}
          </div>
          <textarea
            rows={6}
            required
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={
              inputMethod === 'Voice'
                ? 'Click the microphone button above and speak. Your recognized speech will appear here so you can edit or correct it before submitting...'
                : 'Describe your issue in detail...'
            }
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 leading-relaxed focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Complaints are never auto-submitted after speech ends. Please verify your transcript and click Submit.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Send className="h-4 w-4" />
            Review &amp; Submit Complaint
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Complaint Submission"
        message={`Submit this ${inputMethod.toLowerCase()} complaint under "${category}"? Our sentiment analyzer will evaluate the transcript immediately.`}
        confirmLabel="Yes, Submit Complaint"
        loading={submitting}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
