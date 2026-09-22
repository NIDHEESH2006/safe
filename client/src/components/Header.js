import React from 'react';

export default function Header({ portal, setPortal, breadcrumb }) {
  return (
    <header className="st-header">
      <div className="st-topbar">
        <span>SafeTrace Initiative — Anonymous Harassment Reporting &amp; Investigation</span>
        <span className="st-topbar-right">Helpline: 1930 &nbsp;|&nbsp; Emergency: 112</span>
      </div>

      <div className="st-brandbar">
        <div className="st-brand">
          <span className="st-brand-icon" aria-hidden="true">🛡️</span>
          <div>
            <span className="st-brand-name">SafeTrace</span>
            <span className="st-brand-tagline">Anonymous Harassment Reporting &amp; Investigation Platform</span>
          </div>
        </div>
      </div>

      <nav className="st-navbar" role="tablist" aria-label="Portal selector">
        <button
          role="tab"
          aria-selected={portal === 'survivor'}
          className={`st-nav-btn ${portal === 'survivor' ? 'active' : ''}`}
          onClick={() => setPortal('survivor')}
        >
          Survivor Portal
        </button>
        <button
          role="tab"
          aria-selected={portal === 'admin'}
          className={`st-nav-btn ${portal === 'admin' ? 'active' : ''}`}
          onClick={() => setPortal('admin')}
        >
          ICC Command Center
        </button>
      </nav>

      {breadcrumb && (
        <div className="st-breadcrumb">
          <span>Home</span>
          <span aria-hidden="true"> › </span>
          <span>{breadcrumb}</span>
        </div>
      )}
    </header>
  );
}
