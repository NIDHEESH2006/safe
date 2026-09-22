import React, { useEffect, useState } from 'react';
import ReportForm from './ReportForm';
import TrackingTokenDisplay from './TrackingTokenDisplay';
import CaseTracker from './CaseTracker';
import TermsModal from './TermsModal';
import { useVoiceGuide } from '../context/VoiceGuideContext';

const TERMS_KEY = 'safetrace_terms_accepted';

export default function SurvivorPortal({ onBreadcrumb }) {
  const [view, setView] = useState('landing'); // landing | terms | report | token | track
  const [newToken, setNewToken] = useState('');
  const { speak, registerCommandHandler } = useVoiceGuide();

  useEffect(() => {
    const labels = { landing: 'Home', terms: 'Terms & Conditions', report: 'Report Anonymously', token: 'Tracking Token', track: 'Track Complaint' };
    onBreadcrumb?.(labels[view]);
  }, [view, onBreadcrumb]);

  useEffect(() => {
    if (view === 'landing') {
      speak('This is the Survivor Portal. You can file a report or check the status of an existing case. Everything here is fully anonymous.');
    } else if (view === 'track') {
      speak('Enter the tracking token you were given when you submitted your report to see its status and message the investigator.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(
    () =>
      registerCommandHandler((text) => {
        if (/\b(file|new|start).*(report|complaint)\b/.test(text) || /report anonymously/.test(text)) {
          startReport();
          return true;
        }
        if (/\b(check|track|status|my case)\b/.test(text)) {
          setView('track');
          return true;
        }
        return false;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const startReport = () => {
    const accepted = window.localStorage.getItem(TERMS_KEY) === 'true';
    setView(accepted ? 'report' : 'terms');
  };

  const acceptTerms = () => {
    window.localStorage.setItem(TERMS_KEY, 'true');
    setView('report');
  };

  return (
    <div className="survivor-portal">
      <div className="disclaimer-box">
        <h1>Filing a Report on SafeTrace</h1>
        <p>
          This portal is an initiative to help survivors report harassment safely and follow up on their case —
          fully anonymously. Complaints filed here are reviewed by the ICC investigation team. It is imperative
          to provide correct and accurate details for prompt action.
        </p>
        <p>
          Please contact local police in case of an emergency. National police helpline: <strong>112</strong>.
          National women helpline: <strong>181</strong>. Cyber crime helpline: <strong>1930</strong>.
        </p>
        <div className="disclaimer-actions">
          <button className="btn btn-outline" onClick={() => setView('track')}>Track an Existing Complaint</button>
          <button className="btn btn-primary" onClick={startReport}>Report Anonymously</button>
        </div>
      </div>

      <div className="privacy-banner">
        No IP logging. Zero device identifiers stored. Your report is 100% anonymous — always.
      </div>

      {view !== 'landing' && (
        <div className="portal-tabs">
          <button className={`portal-tab ${view === 'report' || view === 'token' ? 'active' : ''}`} onClick={startReport}>
            File a Report
          </button>
          <button className={`portal-tab ${view === 'track' ? 'active' : ''}`} onClick={() => setView('track')}>
            Check Case Status
          </button>
        </div>
      )}

      {view === 'terms' && <TermsModal onAccept={acceptTerms} />}

      {view === 'report' && (
        <ReportForm
          onSubmitted={(created) => {
            setNewToken(created.token);
            setView('token');
          }}
        />
      )}

      {view === 'token' && (
        <TrackingTokenDisplay token={newToken} onDone={() => setView('track')} />
      )}

      {view === 'track' && <CaseTracker />}
    </div>
  );
}
