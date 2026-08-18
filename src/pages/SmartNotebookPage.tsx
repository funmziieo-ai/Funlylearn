import React from 'react';
import { UserProfile, UserSubscription } from '../types';
import { SmartStudyNotebookAndRevision } from '../components/SmartStudyNotebookAndRevision';

interface SmartNotebookPageProps {
  profile: UserProfile;
  onProfileUpdate?: (updated: UserProfile) => void;
  userId: string;
  subscription?: UserSubscription;
  onOpenPricingModal: () => void;
}

export const SmartNotebookPage: React.FC<SmartNotebookPageProps> = ({
  profile,
  onProfileUpdate = () => {},
  userId,
  subscription,
  onOpenPricingModal
}) => {
  return (
    <SmartStudyNotebookAndRevision
      profile={profile}
      onProfileUpdate={onProfileUpdate}
      userId={userId}
      subscription={subscription}
      onOpenPricingModal={onOpenPricingModal}
    />
  );
};
