'use client';
import InviteMemberModal from '@/components/dashboard/members/list/InviteMemberModal';
import { User } from '@prisma/client';
import { createContext, useState } from 'react';

export const MemberModalContext = createContext({
  setMemberModalOpen: (open: boolean) => {},
  setMemberToKick: (member: Omit<User, 'passwordHash'> | null) => {},
  setMemberToKickModalOpen: (open: boolean) => {},
  memberModalOpen: false,
  memberToKick: null as Omit<User, 'passwordHash'> | null,
  memberToKickModalOpen: false,
});

export const MemberModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [memberToKickModalOpen, setMemberToKickModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberToKick, setMemberToKick] = useState<Omit<
    User,
    'passwordHash'
  > | null>(null);

  return (
    <MemberModalContext.Provider
      value={{
        setMemberModalOpen,
        setMemberToKick,
        setMemberToKickModalOpen,
        memberModalOpen,
        memberToKick,
        memberToKickModalOpen,
      }}
    >
      <InviteMemberModal />
      {children}
    </MemberModalContext.Provider>
  );
};
