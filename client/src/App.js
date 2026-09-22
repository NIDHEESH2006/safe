import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import SurvivorPortal from './components/SurvivorPortal';
import AdminDashboard from './components/AdminDashboard';
import VoiceAssistant from './components/VoiceAssistant';
import { VoiceGuideProvider, useVoiceGuide } from './context/VoiceGuideContext';

function Shell() {
  const [portal, setPortal] = useState('survivor');
  const [breadcrumb, setBreadcrumb] = useState('');
  const { speak, registerCommandHandler } = useVoiceGuide();

  const switchPortal = (next) => {
    setPortal(next);
    if (next === 'admin') {
      setBreadcrumb('ICC Command Center');
      speak('Opened the ICC Command Center. You can review live statistics, the incident heat map, urgent cases, and the audit trail here.');
    }
  };

  React.useEffect(
    () =>
      registerCommandHandler((text) => {
        if (/\b(admin|command center|dashboard|investigator)\b/.test(text)) { switchPortal('admin'); return true; }
        if (/\b(survivor|home|main)\b/.test(text) && !/\bhelp\b/.test(text)) { switchPortal('survivor'); return true; }
        if (/\bhelp\b/.test(text)) {
          speak('You can say "file a report", "check my case", "open the command center", or "next" and "back" while filling out the form.');
          return true;
        }
        return false;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="app-shell">
      <Header portal={portal} setPortal={switchPortal} breadcrumb={breadcrumb} />

      <main className="app-main">
        {portal === 'survivor' ? (
          <SurvivorPortal onBreadcrumb={setBreadcrumb} />
        ) : (
          <AdminDashboard />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-links">
          <span>Privacy Policy</span>
          <span>Terms &amp; Conditions</span>
          <span>FAQ</span>
          <span>Contact Us</span>
        </div>
        <p>
          SafeTrace is an anonymous reporting initiative. No IP addresses, device identifiers, or account data are
          ever collected or stored. National Cyber Crime Helpline: <strong>1930</strong>. In an emergency, contact
          local police: <strong>112</strong>.
        </p>
      </footer>

      <VoiceAssistant />
    </div>
  );
}

export default function App() {
  return (
    <VoiceGuideProvider>
      <Shell />
    </VoiceGuideProvider>
  );
}
