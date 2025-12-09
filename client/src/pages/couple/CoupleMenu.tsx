import { trpc } from "@/lib/trpc";
import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils } from "lucide-react";

export default function CoupleMenu() {
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events[0];

  const { data: foodOptions = [] } = trpc.foodOptions.list.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

  const starters = foodOptions.filter((f: any) => f.category === "starter");
  const mains = foodOptions.filter((f: any) => f.category === "main");
  const desserts = foodOptions.filter((f: any) => f.category === "dessert");

  if (!coupleEvent) {
    return (
      <CoupleLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </CoupleLayout>
    );
  }

  return (
    <CoupleLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Menu Selection</h1>
          <p className="text-gray-600">Your wedding menu options</p>
        </div>

        {foodOptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2">No menu options yet</p>
              <p className="text-sm text-muted-foreground">
                Your event planner will add menu options for you to review
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {starters.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-serif text-[#2C5F5D]">Starters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {starters.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <h3 className="font-medium text-lg mb-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {mains.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-serif text-[#2C5F5D]">Main Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mains.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <h3 className="font-medium text-lg mb-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {desserts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-serif text-[#2C5F5D]">Desserts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {desserts.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <h3 className="font-medium text-lg mb-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </CoupleLayout>
  );
}
