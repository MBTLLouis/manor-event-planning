import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  eventTitle: string;
}

export type SectionPermissions = {
  guestListEnabled: boolean;
  seatingEnabled: boolean;
  timelineEnabled: boolean;
  menuEnabled: boolean;
  notesEnabled: boolean;
  hotelEnabled: boolean;
  websiteEnabled: boolean;
};

const SECTION_LABELS: Record<keyof SectionPermissions, string> = {
  guestListEnabled: "Guest List",
  seatingEnabled: "Seating Chart",
  timelineEnabled: "Timeline",
  menuEnabled: "Menu Selection",
  notesEnabled: "Notes",
  hotelEnabled: "Hotel Information",
  websiteEnabled: "Wedding Website",
};

export default function PermissionsModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
}: PermissionsModalProps) {
  const [permissions, setPermissions] = useState<SectionPermissions>({
    guestListEnabled: true,
    seatingEnabled: true,
    timelineEnabled: true,
    menuEnabled: true,
    notesEnabled: true,
    hotelEnabled: true,
    websiteEnabled: true,
  });

  const { data: fetchedPermissions, isLoading } = trpc.events.getPermissions.useQuery(
    { id: eventId },
    { enabled: isOpen }
  );

  const updateMutation = trpc.events.updatePermissions.useMutation({
    onSuccess: () => {
      alert("Permissions updated successfully");
      onClose();
    },
    onError: (error: any) => {
      alert("Failed to update permissions: " + error.message);
    },
  });

  useEffect(() => {
    if (fetchedPermissions) {
      setPermissions(fetchedPermissions);
    }
  }, [fetchedPermissions]);

  const handleToggle = (key: keyof SectionPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    updateMutation.mutate({ id: eventId, permissions });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Couple Permissions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Control which sections the couple can view and modify for <strong>{eventTitle}</strong>
          </p>

          <div className="space-y-3">
            {Object.entries(SECTION_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key} className="cursor-pointer">
                  {label}
                </Label>
                <Switch
                  id={key}
                  checked={permissions[key as keyof SectionPermissions]}
                  onCheckedChange={() => handleToggle(key as keyof SectionPermissions)}
                  disabled={isLoading || updateMutation.isPending}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
