import React from 'react';
import { Link } from 'react-router-dom';
import { LEARN_HUB_NAVIGATION, LEGAL_NAVIGATION } from '../content/navigationLinks';
import './WorkbenchStatusBar.css';

interface WorkbenchStatusBarProps {
  isProxied?: boolean;
}

/** Guides first, then the legal links the site footer carries elsewhere. */
const STATUS_BAR_LINKS = [
  { label: LEARN_HUB_NAVIGATION.label, href: LEARN_HUB_NAVIGATION.path },
  ...LEGAL_NAVIGATION,
];

/**
 * The connected playground's bottom edge: a slim status bar in place of the
 * site footer, so the three-pane workbench stays one viewport tall. In-app
 * links use the router, which keeps the session connected.
 */
const WorkbenchStatusBar: React.FC<WorkbenchStatusBarProps> = ({ isProxied }) => (
  <footer className="workbench-status-bar" aria-label="Session status and site links">
    <p className="workbench-status-session">
      <span className="workbench-status-dot" aria-hidden="true"></span>
      <span>Connected</span>
      <span aria-hidden="true">·</span>
      <span>{isProxied ? 'Via CORS proxy' : 'Direct HTTP'}</span>
    </p>
    <nav className="workbench-status-links" aria-label="Guides and legal links">
      {STATUS_BAR_LINKS.map((link) => <Link key={link.href} to={link.href}>{link.label}</Link>)}
      <small>© {new Date().getFullYear()} Unchained Development OÜ</small>
    </nav>
  </footer>
);

export default WorkbenchStatusBar;
