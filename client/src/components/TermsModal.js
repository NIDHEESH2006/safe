import React from 'react';

export default function TermsModal({ onAccept }) {
  return (
    <div className="modal-overlay">
      <div className="modal-panel terms-panel" role="dialog" aria-label="Terms and conditions">
        <h2 className="terms-title">Filing a Report on SafeTrace</h2>
        <div className="terms-body">
          <p>
            Prior to filing a report on this platform, please read the following information regarding
            terms and conditions.
          </p>
          <ul>
            <li>The information you provide is used solely to route and investigate your report.</li>
            <li>Providing knowingly false information may make you liable under applicable law.</li>
            <li>Action on reports filed here is taken by the concerned ICC investigators in accordance with organizational policy and applicable law.</li>
            <li>No IP address, device identifier, or account information is collected or stored at any point.</li>
            <li>Your tracking token is the only credential linking you to your case — keep it private and do not share it with anyone you do not trust.</li>
          </ul>
          <p>We thank you for your cooperation.</p>
        </div>
        <button className="btn btn-primary" onClick={onAccept}>I Accept — Continue to Report</button>
      </div>
    </div>
  );
}
