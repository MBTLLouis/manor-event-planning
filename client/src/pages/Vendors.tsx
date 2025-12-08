import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import EmployeeLayout from "@/components/EmployeeLayout";

export default function Vendors() {
  return (
    <EmployeeLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Vendors</h1>
          <p className="text-muted-foreground">Manage vendor contacts and contracts</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-24">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Vendor Management Coming Soon</h3>
            <p className="text-muted-foreground">This feature is currently under development</p>
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  );
}
