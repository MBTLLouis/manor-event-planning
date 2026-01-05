/**
 * In-memory store for event permissions
 * This persists permissions during the session
 */

export type SectionPermissions = {
  guestListEnabled: boolean;
  seatingEnabled: boolean;
  timelineEnabled: boolean;
  menuEnabled: boolean;
  notesEnabled: boolean;
  hotelEnabled: boolean;
  websiteEnabled: boolean;
};

const DEFAULT_PERMISSIONS: SectionPermissions = {
  guestListEnabled: true,
  seatingEnabled: true,
  timelineEnabled: true,
  menuEnabled: true,
  notesEnabled: true,
  hotelEnabled: true,
  websiteEnabled: true,
};

// In-memory store: eventId -> permissions
const permissionsStore = new Map<number, SectionPermissions>();

export function getPermissions(eventId: number): SectionPermissions {
  return permissionsStore.get(eventId) || { ...DEFAULT_PERMISSIONS };
}

export function setPermissions(eventId: number, permissions: SectionPermissions): void {
  permissionsStore.set(eventId, permissions);
}

export function resetPermissions(eventId: number): void {
  permissionsStore.delete(eventId);
}
