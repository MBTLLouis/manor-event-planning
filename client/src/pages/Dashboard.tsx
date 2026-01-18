import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, CheckSquare, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import EmployeeLayout from "@/components/EmployeeLayout";
import { EmployeeManagement } from "@/components/EmployeeManagement";
import { format } from "date-fns";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: upcomingEvents } = trpc.events.upcoming.useQuery();

  const summaryCards = [
    {
      title: "Total Events",
      value: stats?.totalEvents || 0,
      subtitle: "All time",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Upcoming Events",
      value: stats?.upcomingEvents || 0,
      subtitle: "This month",
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Unread Messages",
      value: stats?.unreadMessages || 0,
      subtitle: "Requires attention",
      icon: MessageSquare,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Pending Tasks",
      value: stats?.pendingTasks || 0,
      subtitle: "To complete",
      icon: CheckSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <EmployeeLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New event created</p>
                    <p className="text-xs text-muted-foreground">Wedding planning started for Sarah & John</p>
                    <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pb-4 border-b">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Guest list updated</p>
                    <p className="text-xs text-muted-foreground">15 new guests added to Thompson Wedding</p>
                    <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Message received</p>
                    <p className="text-xs text-muted-foreground">New inquiry from potential client</p>
                    <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Events</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/events")}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents && upcomingEvents.length > 0 ? (
                  upcomingEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/events/${event.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.eventDate), "EEEE, MMMM d, yyyy")}
                        </p>
                      </div>
                      <span className="status-planning px-3 py-1 rounded-full text-xs font-medium">
                        {event.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No upcoming events
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Management Section - Admin Only */}
        {user?.role === "admin" && (
          <div className="mt-8">
            <EmployeeManagement />
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}
