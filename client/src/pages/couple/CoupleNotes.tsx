import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function CoupleNotes() {
  return (
    <CoupleLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Notes</h1>
          <p className="text-gray-600">Your personal wedding notes</p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-2">Notes feature coming soon</p>
            <p className="text-sm text-muted-foreground">
              You'll be able to add and view personal notes here
            </p>
          </CardContent>
        </Card>
      </div>
    </CoupleLayout>
  );
}
