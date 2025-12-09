import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Hotel } from "lucide-react";

export default function CoupleHotels() {
  return (
    <CoupleLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Accommodations</h1>
          <p className="text-gray-600">Hotel information for your guests</p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Hotel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-2">Accommodation details coming soon</p>
            <p className="text-sm text-muted-foreground">
              Your event planner will add recommended hotels and lodging options
            </p>
          </CardContent>
        </Card>
      </div>
    </CoupleLayout>
  );
}
