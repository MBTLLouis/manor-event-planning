import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface LoginDetailsModalProps {
  eventId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function LoginDetailsModal({ eventId, isOpen, onClose }: LoginDetailsModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: loginDetails, isLoading } = trpc.events.getCoupleLoginDetails.useQuery(
    { id: eventId },
    { enabled: isOpen }
  );

  const updateMutation = trpc.events.updateCoupleLoginDetails.useMutation({
    onSuccess: () => {
      alert("Login details updated successfully");
      setEditMode(false);
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleEditClick = () => {
    if (loginDetails) {
      setEditUsername(loginDetails.username || "");
      setEditPassword(loginDetails.password || "");
      setEditMode(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: eventId,
      username: editUsername,
      password: editPassword,
    });
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    // Visual feedback provided by setCopiedField
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Couple Login Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : editMode ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-password">Password</Label>
              <Input
                id="edit-password"
                type={showPassword ? "text" : "password"}
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={() => setEditMode(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <Label className="text-xs text-gray-600">Username</Label>
                <div className="flex items-center justify-between mt-1 bg-white p-2 rounded border">
                  <code className="text-sm font-mono">{loginDetails?.username}</code>
                  <button
                    onClick={() => handleCopy(loginDetails?.username || "", "username")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {copiedField === "username" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600">Password</Label>
                <div className="flex items-center justify-between mt-1 bg-white p-2 rounded border">
                  <code className="text-sm font-mono">
                    {showPassword ? loginDetails?.password : "••••••••"}
                  </code>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleCopy(loginDetails?.password || "", "password")}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {copiedField === "password" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
              Share these credentials with the couple so they can log in to view and manage their event details.
            </div>

            <Button onClick={handleEditClick} className="w-full">
              Edit Credentials
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
