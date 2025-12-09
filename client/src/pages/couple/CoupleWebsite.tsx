import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Globe } from "lucide-react";

export default function CoupleWebsite() {
  return (
    <CoupleLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Wedding Website</h1>
          <p className="text-gray-600">Your personalized wedding website</p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-2">Website builder coming soon</p>
            <p className="text-sm text-muted-foreground">
              Create a beautiful wedding website to share with your guests
            </p>
          </CardContent>
        </Card>
      </div>
    </CoupleLayout>
  );
}
