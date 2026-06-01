import type { Role } from "@/lib/store/types";

export const ROLE_NORMAL = "normal" as const; // anonymous / not signed in
export const ROLE_USER = "user" as const; // registered (invite-gated) user
export const ROLE_ADMIN = "admin" as const;

export interface Capabilities {
  canRecordDream: boolean;
  canRunDebate: boolean;
  canCast: boolean;
  canTarot: boolean;
  canPainterly: boolean;
  canHistory: boolean; // own journal/timeline
  canLongitudinal: boolean;
  canManageInvites: boolean;
  canViewLogs: boolean;
  isAdmin: boolean;
}

const NONE: Capabilities = {
  canRecordDream: false,
  canRunDebate: false,
  canCast: false,
  canTarot: false,
  canPainterly: false,
  canHistory: false,
  canLongitudinal: false,
  canManageInvites: false,
  canViewLogs: false,
  isAdmin: false,
};

export function getCapabilities(role: Role): Capabilities {
  switch (role) {
    case ROLE_USER:
    case "invite":
    case "pilot":
      return {
        ...NONE,
        canRecordDream: true,
        canRunDebate: true,
        canCast: true,
        canTarot: true,
        canPainterly: true,
        canHistory: true,
        canLongitudinal: true,
      };
    case ROLE_ADMIN:
      return {
        canRecordDream: true,
        canRunDebate: true,
        canCast: true,
        canTarot: true,
        canPainterly: true,
        canHistory: true,
        canLongitudinal: true,
        canManageInvites: true,
        canViewLogs: true,
        isAdmin: true,
      };
    default:
      return { ...NONE };
  }
}
