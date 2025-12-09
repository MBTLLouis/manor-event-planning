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
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function PublicRSVP() {
  const [location] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  
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

  const handleSubmit = () => {
    if (!starterSelection || !mainSelection || !dessertSelection) {
      toast.error("Please select all meal options");
      return;
    }

    submitRSVPMutation.mutate({
      token,
      starterSelection,
      mainSelection,
      dessertSelection,
      dietaryRestrictions: dietaryRestrictions || undefined,
    });
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
            <p className="text-red-600">Guest not found. Please contact the event organizer.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (guest.stage !== 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4] flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              {guest.stage === 3
                ? "You have already submitted your RSVP. Thank you!"
                : "This RSVP link is not yet active. Please wait for your invitation."}
            </p>
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
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h1 className="text-3xl font-serif text-[#2C5F5D] mb-4">Thank You!</h1>
            <p className="text-lg text-gray-700 mb-2">Your RSVP has been successfully submitted.</p>
            <p className="text-gray-600">
              We look forward to celebrating with you at {event?.coupleName1} & {event?.coupleName2}'s wedding!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-[#2C5F5D] mb-2">
            {event?.coupleName1} & {event?.coupleName2}
          </h1>
          <p className="text-xl text-gray-700">Wedding RSVP</p>
          <p className="text-gray-600 mt-2">
            {event?.eventDate && new Date(event.eventDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* RSVP Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-[#2C5F5D]">
              Welcome, {guest.name}!
            </CardTitle>
            <p className="text-muted-foreground">
              Please select your meal preferences for the wedding reception
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Starter Selection */}
            <div>
              <Label htmlFor="starter" className="text-base font-medium">
                Starter *
              </Label>
              <Select value={starterSelection} onValueChange={setStarterSelection}>
                <SelectTrigger id="starter" className="mt-2">
                  <SelectValue placeholder="Select your starter" />
                </SelectTrigger>
                <SelectContent>
                  {starters.length === 0 ? (
                    <SelectItem value="none">No options available</SelectItem>
                  ) : (
                    starters.map((item: any) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                        {item.description && ` - ${item.description}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Main Course Selection */}
            <div>
              <Label htmlFor="main" className="text-base font-medium">
                Main Course *
              </Label>
              <Select value={mainSelection} onValueChange={setMainSelection}>
                <SelectTrigger id="main" className="mt-2">
                  <SelectValue placeholder="Select your main course" />
                </SelectTrigger>
                <SelectContent>
                  {mains.length === 0 ? (
                    <SelectItem value="none">No options available</SelectItem>
                  ) : (
                    mains.map((item: any) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                        {item.description && ` - ${item.description}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Dessert Selection */}
            <div>
              <Label htmlFor="dessert" className="text-base font-medium">
                Dessert *
              </Label>
              <Select value={dessertSelection} onValueChange={setDessertSelection}>
                <SelectTrigger id="dessert" className="mt-2">
                  <SelectValue placeholder="Select your dessert" />
                </SelectTrigger>
                <SelectContent>
                  {desserts.length === 0 ? (
                    <SelectItem value="none">No options available</SelectItem>
                  ) : (
                    desserts.map((item: any) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                        {item.description && ` - ${item.description}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Dietary Restrictions */}
            <div>
              <Label htmlFor="dietary" className="text-base font-medium">
                Dietary Restrictions or Allergies (Optional)
              </Label>
              <Textarea
                id="dietary"
                value={dietaryRestrictions}
                onChange={(e) => setDietaryRestrictions(e.target.value)}
                placeholder="Please let us know about any dietary restrictions or food allergies..."
                className="mt-2"
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitRSVPMutation.isPending}
              className="w-full bg-[#2C5F5D] hover:bg-[#234a48] text-lg py-6"
            >
              {submitRSVPMutation.isPending ? "Submitting..." : "Submit RSVP"}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Questions? Please contact the event organizer.</p>
        </div>
      </div>
    </div>
  );
}
