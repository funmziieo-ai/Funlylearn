import React from 'react';
import { UserProfile, UserSubscription } from '../types';
import { SmartStudyNotebookAndRevision } from '../components/SmartStudyNotebookAndRevision';

interface ProfilePageProps {
  profile: UserProfile;
  subscription?: UserSubscription;
  userEmail?: string;
  onProfileUpdate: (updated: UserProfile) => void;
  onOpenPricingModal?: () => void;
  onSignOut?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  onProfileUpdate
}) => {
  return (
    <div className="space-y-6 pb-20">
      {/* Exam Prep & Smart Study Notebook */}
      <SmartStudyNotebookAndRevision
        profile={profile}
        onProfileUpdate={onProfileUpdate}
      />
    </div>
  );
};

