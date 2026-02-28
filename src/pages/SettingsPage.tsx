import React from 'react';
import { SettingsForm } from '../components/settings/SettingsForm';

export const SettingsPage: React.FC = () => {
  return (
    <div>
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure application preferences and manage data</p>
      </div>
      <SettingsForm />
    </div>
  );
};
