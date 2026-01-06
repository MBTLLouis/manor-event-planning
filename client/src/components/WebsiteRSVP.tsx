import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface WebsiteRSVPProps {
  websiteId: number;
  eventId: number;
  coupleName1?: string;
  coupleName2?: string;
  eventDate?: Date;
}

export default function WebsiteRSVP({
  websiteId,
  eventId,
  coupleName1,
  coupleName2,
  eventDate,
}: WebsiteRSVPProps) {
  const [step, setStep] = useState<"search" | "confirm" | "success">("search");
  const [searchName, setSearchName] = useState("");
  const [foundGuest, setFoundGuest] = useState<any>(null);
  const [attendance, setAttendance] = useState("");
  const [starterSelection, setStarterSelection] = useState("");
  const [mainSelection, setMainSelection] = useState("");
  const [dessertSelection, setDessertSelection] = useState("");
  const [hasDietaryRequirements, setHasDietaryRequirements] = useState(false);
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [allergySeverity, setAllergySeverity] = useState("none");
  const [canOthersConsumeNearby, setCanOthersConsumeNearby] = useState(true);
  const [dietaryDetails, setDietaryDetails] = useState("");

  // Search for guest by name
  const searchGuestQuery = trpc.guests.searchByName.useQuery(
    { eventId, name: searchName },
    { enabled: false }
  );

  const handleSearchClick = async () => {
    if (!searchName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      const result = await searchGuestQuery.refetch();
      if (result.data) {
        setFoundGuest(result.data);
        setAttendance("");
        setStep("confirm");
        toast.success("Guest found!");
      } else {
        toast.error("Guest not found. Please check the spelling and try again.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to search for guest");
    }
  };

  // Get food options for the event
  const { data: foodOptions = [] } = trpc.foodOptions.list.useQuery(
    { eventId },
    { enabled: !!eventId && step === "confirm" }
  );

  // Update guest RSVP
  const updateRSVPMutation = trpc.guests.updateWebsiteRSVP.useMutation({
    onSuccess: () => {
      setStep("success");
      toast.success("RSVP confirmed successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to confirm RSVP");
    },
  });

  const starters = foodOptions.filter((f: any) => f.category === "starter");
  const mains = foodOptions.filter((f: any) => f.category === "main");
  const desserts = foodOptions.filter((f: any) => f.category === "dessert");



  const handleConfirmRSVP = () => {
    if (!attendance) {
      toast.error("Please select your attendance status");
      return;
    }

    if (attendance === "yes") {
      if (!starterSelection || !mainSelection || !dessertSelection) {
        toast.error("Please select all meal options");
        return;
      }
    }

    updateRSVPMutation.mutate({
      guestId: foundGuest.id,
      rsvpStatus: attendance as "yes" | "no" | "maybe",
      starterSelection: attendance === "yes" ? starterSelection : null,
      mainSelection: attendance === "yes" ? mainSelection : null,
      dessertSelection: attendance === "yes" ? dessertSelection : null,
      hasDietaryRequirements,
      dietaryRestrictions: dietaryRestrictions || null,
      allergySeverity: hasDietaryRequirements ? (allergySeverity as "none" | "mild" | "severe") : "none",
      canOthersConsumeNearby,
      dietaryDetails: dietaryDetails || null,
    });
  };

  const handleNewSearch = () => {
    setStep("search");
    setSearchName("");
    setFoundGuest(null);
    setAttendance("" as any);
    setStarterSelection("");
    setMainSelection("");
    setDessertSelection("");
    setHasDietaryRequirements(false);
    setDietaryRestrictions("");
    setAllergySeverity("none");
    setCanOthersConsumeNearby(true);
    setDietaryDetails("");
  };

  // Step 1: Search
  if (step === "search") {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-[#2C5F5D]">
              {coupleName1 && coupleName2 ? `${coupleName1} & ${coupleName2}` : "Wedding"} RSVP
            </CardTitle>
            <CardDescription>
              Find your name to confirm your attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="guestName" className="text-base font-medium">
                Your Name *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="guestName"
                  placeholder="Enter your first and last name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearchClick()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearchClick}
                  disabled={searchGuestQuery.isFetching || !searchName.trim()}
                  className="bg-[#2C5F5D] hover:bg-[#234a48]"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Enter the name as it appears on your invitation
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Confirm RSVP and select meals
  if (step === "confirm" && foundGuest) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-[#2C5F5D]">
              Welcome, {foundGuest.name}!
            </CardTitle>
            <CardDescription>
              Please confirm your attendance and select your meal preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Attendance Status */}
            <div>
              <Label htmlFor="attendance" className="text-base font-medium">
                Will you be attending? *
              </Label>
              <Select value={attendance} onValueChange={(val) => setAttendance(val as "yes" | "no" | "maybe")}>
                <SelectTrigger id="attendance" className="mt-2">
                  <SelectValue placeholder="Select your attendance status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, I will attend</SelectItem>
                  <SelectItem value="no">No, I cannot attend</SelectItem>
                  <SelectItem value="maybe">Maybe, I will let you know</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Meal Selection - Only show if attending */}
            {attendance === "yes" && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-serif text-[#2C5F5D] mb-4">
                    Meal Preferences
                  </h3>

                  {/* Starter Selection */}
                  <div className="mb-4">
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
                  <div className="mb-4">
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
                  <div className="mb-4">
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
                </div>
              </>
            )}

            {/* Dietary Requirements */}
            <div className="border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="hasDietaryRequirements"
                  checked={hasDietaryRequirements}
                  onCheckedChange={(checked) => setHasDietaryRequirements(checked as boolean)}
                />
                <Label htmlFor="hasDietaryRequirements" className="text-base font-medium cursor-pointer">
                  I have dietary requirements or allergies
                </Label>
              </div>

              {hasDietaryRequirements && (
                <div className="ml-6 space-y-4 border-l-2 border-amber-300 pl-4">
                  {/* Dietary Restrictions */}
                  <div className="space-y-2">
                    <Label htmlFor="dietaryRestrictions" className="text-base font-medium">
                      Dietary Restrictions
                    </Label>
                    <Input
                      id="dietaryRestrictions"
                      placeholder="e.g., Vegetarian, Gluten-Free, Nut Allergy"
                      value={dietaryRestrictions}
                      onChange={(e) => setDietaryRestrictions(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate multiple restrictions with commas
                    </p>
                  </div>

                  {/* Allergy Severity */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Allergy Severity</Label>
                    <RadioGroup value={allergySeverity} onValueChange={setAllergySeverity}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="severity-none" />
                        <Label htmlFor="severity-none" className="cursor-pointer">None</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mild" id="severity-mild" />
                        <Label htmlFor="severity-mild" className="cursor-pointer">Mild</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="severe" id="severity-severe" />
                        <Label htmlFor="severity-severe" className="flex items-center gap-2 cursor-pointer">
                          Severe <AlertTriangle className="w-4 h-4 text-red-500" />
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Can Others Consume Nearby */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Can others consume around you?</Label>
                    <RadioGroup value={canOthersConsumeNearby ? "yes" : "no"} onValueChange={(value) => setCanOthersConsumeNearby(value === "yes")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="consume-yes" />
                        <Label htmlFor="consume-yes" className="cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="consume-no" />
                        <Label htmlFor="consume-no" className="cursor-pointer">No (airborne/contact risk)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-2">
                    <Label htmlFor="dietaryDetails" className="text-base font-medium">
                      Additional Details
                    </Label>
                    <Textarea
                      id="dietaryDetails"
                      placeholder="Any additional information about dietary requirements..."
                      value={dietaryDetails}
                      onChange={(e) => setDietaryDetails(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleNewSearch}
                className="flex-1"
              >
                Search Again
              </Button>
              <Button
                onClick={handleConfirmRSVP}
                disabled={updateRSVPMutation.isPending}
                className="flex-1 bg-[#2C5F5D] hover:bg-[#234a48]"
              >
                {updateRSVPMutation.isPending ? "Confirming..." : "Confirm RSVP"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Success
  if (step === "success") {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h1 className="text-3xl font-serif text-[#2C5F5D] mb-4">Thank You!</h1>
            <p className="text-lg text-gray-700 mb-2">
              Your RSVP has been successfully confirmed.
            </p>
            {attendance === "yes" && (
              <p className="text-gray-600 mb-6">
                We look forward to celebrating with you!
              </p>
            )}
            {attendance === "no" && (
              <p className="text-gray-600 mb-6">
                We'll miss you at the celebration. Thank you for letting us know!
              </p>
            )}
            <Button
              onClick={handleNewSearch}
              className="bg-[#2C5F5D] hover:bg-[#234a48]"
            >
              Submit Another RSVP
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
