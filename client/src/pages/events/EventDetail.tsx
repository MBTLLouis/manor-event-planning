import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, DollarSign, Package, Calendar, CheckSquare, MapPin, Utensils, Globe, FileText, MessageSquare, Home, Armchair } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import EmployeeLayout from "@/components/EmployeeLayout";
import { format } from "date-fns";

export default function EventDetail() {
  const [, params] = useRoute("/events/:id");
  const [, setLocation] = useLocation();
  const eventId = params?.id ? parseInt(params.id) : 0;

  // Redirect if eventId is invalid
  if (!eventId || isNaN(eventId)) {
    return (
      <EmployeeLayout>
        <div className="p-8 text-center">
          <p className="text-red-600 mb-4">Invalid event ID</p>
          <Button onClick={() => setLocation("/events")}>Back to Events</Button>
        </div>
      </EmployeeLayout>
    );
  }

  const { data: event } = trpc.events.getById.useQuery({ id: eventId });
  const { data: stats } = trpc.events.stats.useQuery({ id: eventId });

  const planningModules = [
    {
      icon: Users,
      title: "Guest List",
      description: "Manage guests, RSVPs, and seating arrangements",
      path: `/events/${eventId}/guests`,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: DollarSign,
      title: "Budget",
      description: "Track expenses, payments, and budget categories",
      path: `/events/${eventId}/budget`,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: Package,
      title: "Vendors",
      description: "Manage vendor contacts, contracts, and payments",
      path: `/events/${eventId}/vendors`,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: Calendar,
      title: "Timeline",
      description: "Create day-of timelines and schedules",
      path: `/events/${eventId}/timeline`,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      icon: CheckSquare,
      title: "Checklist",
      description: "Track tasks and assignments with checklists",
      path: `/events/${eventId}/checklist`,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },

    {
      icon: Utensils,
      title: "Food Choices",
      description: "Configure menu options and view meal statistics",
      path: `/events/${eventId}/food-choices`,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      icon: Armchair,
      title: "Seating Plan",
      description: "Easily assign guests to tables with drag-and-drop",
      path: `/events/${eventId}/seating-plan`,
      color: "text-rose-600",
      bgColor: "bg-rose-100",
    },
    {
      icon: Globe,
      title: "Wedding Website",
      description: "Create a beautiful website for your guests",
      path: `/events/${eventId}/wedding-website`,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      icon: FileText,
      title: "Notes",
      description: "Keep all your planning notes organized",
      path: `/events/${eventId}/notes`,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      icon: MessageSquare,
      title: "Messages",
      description: "Communicate with the couple about event details",
      path: `/events/${eventId}/messages`,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
      comingSoon: true,
    },
    {
      icon: Home,
      title: "Accommodations",
      description: "Manage guest room assignments and lodging",
      path: `/events/${eventId}/accommodations`,
      color: "text-rose-600",
      bgColor: "bg-rose-100",
    },
  ];

  if (!event) {
    return (
      <EmployeeLayout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="p-8">
        <Button variant="ghost" className="mb-6" onClick={() => setLocation("/events")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
          <p className="text-lg text-muted-foreground">
            {format(new Date(event.eventDate), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Guests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.guests || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.confirmed || 0} confirmed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats?.budget || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ${stats?.spent || 0} spent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.vendors || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.booked || 0} booked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.completed || 0}/{stats?.tasks || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.tasks ? Math.round(((stats.completed || 0) / stats.tasks) * 100) : 0}% complete
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Planning Modules */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Planning Modules</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planningModules.map((module) => {
              const Icon = module.icon;
              return (
                <Card
                  key={module.title}
                  className={`hover:shadow-lg transition-shadow ${
                    module.comingSoon ? "opacity-75" : "cursor-pointer"
                  }`}
                  onClick={() => !module.comingSoon && setLocation(module.path)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${module.bgColor}`}>
                        <Icon className={`w-6 h-6 ${module.color}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{module.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {module.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {module.comingSoon && (
                    <CardContent>
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                        Coming Soon
                      </span>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
