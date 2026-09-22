import React, { useEffect, useState } from 'react';
import EvidenceLocker from './EvidenceLocker';
import DictateButton from './DictateButton';
import { polishDescription } from '../utils/polish';
import { api } from '../utils/api';
import { INDIA_STATES, INCIDENT_LOCATIONS } from '../utils/indiaStates';
import { useVoiceGuide } from '../context/VoiceGuideContext';

const CATEGORIES = [
  'Cyberbullying',
  'Stalking',
  'Threats',
  'Impersonation',
  'Campus/Workplace Sexual Harassment',
];

const STEPS = ['Complaint & Incident Details', 'Suspect Details', 'Preview & Submit'];

const initialState = {
  category: '',
  incidentDate: '',
  incidentTime: '',
  delayReason: '',
  state: '',
  incidentLocation: '',
  description: '',
  handles: '',
  urls: '',
  phone: '',
};

export default function ReportForm({ onSubmitted }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialState);
  const [polished, setPolished] = useState('');
  const [evidence, setEvidence] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { speak, registerCommandHandler } = useVoiceGuide();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const goNext = () => {
    if (step === 0) {
      if (!form.category) return setError('Please select a category before continuing.');
      if (!form.description.trim()) return setError('Please describe what happened before continuing.');
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  useEffect(() => {
    const prompts = [
      'Step 1 of 3. Choose the category that best matches what happened, then describe the incident in your own words. Tap the microphone next to the description box to dictate instead of typing.',
      'Step 2 of 3. If you know any identifying details about the person involved — a username, profile link, or phone number — add them here. This step is optional.',
      'Step 3 of 3. Review your report, attach any evidence files, and submit when ready. Nothing is sent until you press submit.',
    ];
    speak(prompts[step]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(
    () =>
      registerCommandHandler((text) => {
        if (/\b(next|continue)\b/.test(text)) { goNext(); return true; }
        if (/\b(back|previous|go back)\b/.test(text)) { goBack(); return true; }
        if (/\bsubmit\b/.test(text) && step === STEPS.length - 1) { handleSubmit(); return true; }
        if (/\bpolish\b/.test(text)) { handlePolish(); return true; }
        return false;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, form, polished]
  );

  const handlePolish = () => {
    if (!form.description.trim()) return;
    const result = polishDescription(form.description, {
      category: form.category,
      suspectIdentifiers: { handles: form.handles, urls: form.urls, phone: form.phone },
    });
    setPolished(result);
    speak('Here is an objective, chronological summary of your report, ready for the investigator.');
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.category) return setError('Please select a category.');
    if (!form.description.trim()) return setError('Please describe what happened.');

    setSubmitting(true);
    try {
      const { case: created } = await api.createCase({
        category: form.category,
        description: form.description,
        polishedDescription: polished || null,
        incidentDate: form.incidentDate,
        incidentTime: form.incidentTime,
        delayReason: form.delayReason,
        state: form.state,
        incidentLocation: form.incidentLocation,
        suspectIdentifiers: { handles: form.handles, urls: form.urls, phone: form.phone },
        evidence,
      });
      speak(`Your report has been secured. Your tracking token is ${created.token.split('').join(' ')}. Please save it.`);
      onSubmitted(created);
      setForm(initialState);
      setPolished('');
      setEvidence([]);
      setStep(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card wizard-card">
      <h2 className="wizard-title">Guided Incident Report</h2>
      <p className="muted">Take your time. Nothing is submitted until you reach the final step and choose to send it.</p>

      <div className="wizard-tabs" role="tablist">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={step === i}
            className={`wizard-tab ${step === i ? 'active' : ''} ${step > i ? 'complete' : ''}`}
            onClick={() => i < step && setStep(i)}
            disabled={i > step}
          >
            <span className="wizard-tab-num">{step > i ? '✓' : i + 1}</span>
            {label}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      {step === 0 && (
        <div className="wizard-step">
          <div className="field">
            <label className="field-label" htmlFor="category">Category of Complaint <span className="required">*</span></label>
            <select id="category" value={form.category} onChange={update('category')} required>
              <option value="" disabled>--- Select ---</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label" htmlFor="incidentDate">Approximate Date of Incident</label>
              <input id="incidentDate" type="date" value={form.incidentDate} onChange={update('incidentDate')} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="incidentTime">Approximate Time</label>
              <input id="incidentTime" type="time" value={form.incidentTime} onChange={update('incidentTime')} />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="delayReason">Reason for Delay in Reporting (if any)</label>
            <input id="delayReason" value={form.delayReason} onChange={update('delayReason')} placeholder="Optional" />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label" htmlFor="state">State / UT</label>
              <select id="state" value={form.state} onChange={update('state')}>
                <option value="">--- Select ---</option>
                {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="incidentLocation">Where Did the Incident Occur?</label>
              <select id="incidentLocation" value={form.incidentLocation} onChange={update('incidentLocation')}>
                <option value="">--- Select ---</option>
                {INCIDENT_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <div className="field-label-row">
              <label className="field-label" htmlFor="description">
                Describe the Incident <span className="required">*</span>
                <span className="mic-hint" title="You can dictate this field">🎤 speech-enabled</span>
              </label>
              <DictateButton value={form.description} onChange={(text) => setForm((f) => ({ ...f, description: text }))} label="Dictate description" />
            </div>
            <textarea
              id="description"
              rows={6}
              placeholder="Describe the incident in your own words, in as much or as little detail as feels okay…"
              value={form.description}
              onChange={update('description')}
            />
            <button type="button" className="btn btn-outline btn-sm ai-polish-btn" onClick={handlePolish}>
              Generate Objective Summary (AI Auto-Polish)
            </button>
            {polished && (
              <div className="polished-preview">
                <label className="field-label">Law-enforcement-ready summary (attached to your report)</label>
                <pre>{polished}</pre>
              </div>
            )}
          </div>

          <div className="wizard-nav">
            <span />
            <button type="button" className="btn btn-primary" onClick={goNext}>Next: Suspect Details →</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="wizard-step">
          <p className="muted">If you know any identifying details about the person involved, add them below. This step is optional — leave any field blank if you don't know it.</p>
          <div className="field">
            <label className="field-label" htmlFor="handles">Handles / Usernames</label>
            <input id="handles" value={form.handles} onChange={update('handles')} placeholder="e.g. @username on Instagram" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="urls">Profile URLs / Links</label>
            <input id="urls" value={form.urls} onChange={update('urls')} placeholder="e.g. https://…" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="phone">Phone Number</label>
            <input id="phone" value={form.phone} onChange={update('phone')} placeholder="Optional" />
          </div>
          <div className="wizard-nav">
            <button type="button" className="btn btn-outline" onClick={goBack}>← Back</button>
            <button type="button" className="btn btn-primary" onClick={goNext}>Next: Preview &amp; Submit →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-step">
          <div className="preview-summary">
            <h3>Review Your Report</h3>
            <dl>
              <dt>Category</dt><dd>{form.category || '—'}</dd>
              <dt>Date / Time</dt><dd>{form.incidentDate || '—'} {form.incidentTime}</dd>
              <dt>State / UT</dt><dd>{form.state || '—'}</dd>
              <dt>Location</dt><dd>{form.incidentLocation || '—'}</dd>
              <dt>Description</dt><dd>{form.description || '—'}</dd>
              {(form.handles || form.urls || form.phone) && (
                <>
                  <dt>Suspect Identifiers</dt>
                  <dd>{[form.handles, form.urls, form.phone].filter(Boolean).join(' · ')}</dd>
                </>
              )}
            </dl>
          </div>

          <EvidenceLocker evidence={evidence} setEvidence={setEvidence} />

          <div className="wizard-nav">
            <button type="button" className="btn btn-outline" onClick={goBack}>← Back</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Securing report…' : 'Submit Anonymous Report'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
