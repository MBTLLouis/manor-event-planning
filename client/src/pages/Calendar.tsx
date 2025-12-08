import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import EmployeeLayout from "@/components/EmployeeLayout";

export default function Calendar() {
  return (
    <EmployeeLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Calendar</h1>
          <p className="text-muted-foreground">View all events in calendar format</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-24">
            <CalendarIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Calendar View Coming Soon</h3>
            <p className="text-muted-foreground">This feature is currently under development</p>
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  );
}
