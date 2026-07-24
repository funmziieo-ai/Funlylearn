import React from 'react';
import { UserProfile } from '../types';
import { SmartStudyNotebookAndRevision } from '../components/SmartStudyNotebookAndRevision';

interface SmartNotebookPageProps {
  profile: UserProfile;
  onProfileUpdate?: (updated: UserProfile) => void;
}

export const SmartNotebookPage: React.FC<SmartNotebookPageProps> = ({
  profile,
  onProfileUpdate = () => {}
}) => {
  return (
    <SmartStudyNotebookAndRevision
      profile={profile}
      onProfileUpdate={onProfileUpdate}
    />
  );
};
