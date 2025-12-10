import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function PublicRSVP() {
  const [location] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  
  const [rsvpResponse, setRsvpResponse] = useState<"confirmed" | "declined" | "">("");
  const [starterSelection, setStarterSelection] = useState("");
  const [mainSelection, setMainSelection] = useState("");
  const [dessertSelection, setDessertSelection] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: guest, isLoading: guestLoading } = trpc.guests.getByToken.useQuery(
    { token },
    { enabled: !!token }
  );

  const { data: event } = trpc.events.getById.useQuery(
    { id: guest?.eventId || 0 },
    { enabled: !!guest }
  );

  const { data: foodOptions = [] } = trpc.foodOptions.list.useQuery(
    { eventId: guest?.eventId || 0 },
    { enabled: !!guest }
  );

  const submitRSVPMutation = trpc.guests.submitRSVP.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("RSVP submitted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit RSVP");
    },
  });

  const starters = foodOptions.filter((f: any) => f.category === "starter");
  const mains = foodOptions.filter((f: any) => f.category === "main");
  const desserts = foodOptions.filter((f: any) => f.category === "dessert");
  
  // Check if food options are fully configured
  const foodOptionsConfigured = starters.length > 0 && mains.length > 0 && desserts.length > 0;

  const handleSubmit = () => {
    if (!rsvpResponse) {
      toast.error("Please confirm your attendance");
      return;
    }

    // If declining, no meal selection needed
    if (rsvpResponse === "declined") {
      submitRSVPMutation.mutate({
        token,
        rsvpStatus: "declined",
      });
      return;
    }

    // If confirming and food options are configured, require meal selections
    if (rsvpResponse === "confirmed" && foodOptionsConfigured) {
      if (!starterSelection || !mainSelection || !dessertSelection) {
        toast.error("Please select all meal options");
        return;
      }

      submitRSVPMutation.mutate({
        token,
        rsvpStatus: "confirmed",
        starterSelection,
        mainSelection,
        dessertSelection,
        dietaryRestrictions: dietaryRestrictions || undefined,
      });
    } else if (rsvpResponse === "confirmed") {
      // Confirming but food options not configured yet
      submitRSVPMutation.mutate({
        token,
        rsvpStatus: "confirmed",
      });
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4] flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Invalid RSVP link. Please check your invitation email.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (guestLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4] flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4] flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Guest not found. Please check your RSVP link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4] flex items-center justify-center p-4">
        <Card className="max-w-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-6">
              {rsvpResponse === "confirmed" ? (
                <CheckCircle2 className="w-20 h-20 text-green-600" />
              ) : (
                <XCircle className="w-20 h-20 text-gray-600" />
              )}
            </div>
            <h2 className="text-3xl font-serif text-[#2C5F5D] mb-4">
              {rsvpResponse === "confirmed" ? "Thank You!" : "We'll Miss You"}
            </h2>
            <p className="text-lg text-gray-700 mb-2">
              {rsvpResponse === "confirmed" 
                ? "Your RSVP has been confirmed."
                : "Thank you for letting us know."}
            </p>
            {event && (
              <div className="mt-6 text-gray-600">
                <p className="font-serif text-xl mb-2">
                  {event.coupleName1} & {event.coupleName2}
                </p>
                <p>{new Date(event.eventDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center border-b bg-[#2C5F5D] text-white">
          <div className="space-y-2">
            <h1 className="text-4xl font-serif">Wedding RSVP</h1>
            {event && (
              <>
                <p className="text-2xl font-serif">
                  {event.coupleName1} & {event.coupleName2}
                </p>
                <p className="text-lg">
                  {new Date(event.eventDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-8 space-y-6">
          <div>
            <p className="text-lg mb-2">
              Dear <span className="font-semibold">{guest.name}</span>,
            </p>
            <p className="text-gray-700">
              We would be delighted to have you celebrate our special day with us.
              Please let us know if you'll be able to attend.
            </p>
          </div>

          {/* RSVP Response */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Will you be attending? *</Label>
            <RadioGroup value={rsvpResponse} onValueChange={(value: any) => setRsvpResponse(value)}>
              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="confirmed" id="confirmed" />
                <Label htmlFor="confirmed" className="flex-1 cursor-pointer">
                  <div className="font-medium">Joyfully Accept</div>
                  <div className="text-sm text-muted-foreground">I will be attending</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="declined" id="declined" />
                <Label htmlFor="declined" className="flex-1 cursor-pointer">
                  <div className="font-medium">Regretfully Decline</div>
                  <div className="text-sm text-muted-foreground">I will not be able to attend</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Meal Selections - Only show if confirming and food options configured */}
          {rsvpResponse === "confirmed" && foodOptionsConfigured && (
            <>
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Meal Preferences</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please select your meal choices for the reception.
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="starter">Starter *</Label>
                    <Select value={starterSelection} onValueChange={setStarterSelection}>
                      <SelectTrigger id="starter">
                        <SelectValue placeholder="Select your starter" />
                      </SelectTrigger>
                      <SelectContent>
                        {starters.map((option: any) => (
                          <SelectItem key={option.id} value={option.name}>
                            {option.name}
                            {option.description && (
                              <span className="text-sm text-muted-foreground ml-2">
                                - {option.description}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="main">Main Course *</Label>
                    <Select value={mainSelection} onValueChange={setMainSelection}>
                      <SelectTrigger id="main">
                        <SelectValue placeholder="Select your main course" />
                      </SelectTrigger>
                      <SelectContent>
                        {mains.map((option: any) => (
                          <SelectItem key={option.id} value={option.name}>
                            {option.name}
                            {option.description && (
                              <span className="text-sm text-muted-foreground ml-2">
                                - {option.description}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dessert">Dessert *</Label>
                    <Select value={dessertSelection} onValueChange={setDessertSelection}>
                      <SelectTrigger id="dessert">
                        <SelectValue placeholder="Select your dessert" />
                      </SelectTrigger>
                      <SelectContent>
                        {desserts.map((option: any) => (
                          <SelectItem key={option.id} value={option.name}>
                            {option.name}
                            {option.description && (
                              <span className="text-sm text-muted-foreground ml-2">
                                - {option.description}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dietary">Dietary Restrictions or Allergies</Label>
                    <Textarea
                      id="dietary"
                      placeholder="Please let us know if you have any dietary restrictions, allergies, or special requirements..."
                      value={dietaryRestrictions}
                      onChange={(e) => setDietaryRestrictions(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Message when confirming but food not configured */}
          {rsvpResponse === "confirmed" && !foodOptionsConfigured && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Thank you for confirming! Meal selection options will be available soon.
                We'll send you another email when you can select your meal preferences.
              </p>
            </div>
          )}

          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!rsvpResponse || submitRSVPMutation.isPending}
              className="w-full bg-[#2C5F5D] hover:bg-[#234a48] text-white py-6 text-lg"
            >
              {submitRSVPMutation.isPending ? "Submitting..." : "Submit RSVP"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
