/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-emerald-500/30">
      <Dashboard />
    </div>
  );
}

