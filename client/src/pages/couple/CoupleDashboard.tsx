import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import CoupleLayout from "@/components/CoupleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Calendar, Utensils, CheckCircle2, Clock, Home, ListTodo } from "lucide-react";
import { useLocation } from "wouter";
import { format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";

export default function CoupleDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [permissions, setPermissions] = useState<any>(null);

  // Get couple's event
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events[0]; // Assuming couple has one event

  // Get permissions for the event
  const { data: eventPermissions } = trpc.events.getPermissions.useQuery(
    { id: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

  useEffect(() => {
    if (eventPermissions) {
      setPermissions(eventPermissions);
    }
  }, [eventPermissions]);

  const { data: stats } = trpc.events.stats.useQuery(
    { id: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

  // Update countdown timer
  useEffect(() => {
    if (!coupleEvent) return;

    const updateCountdown = () => {
      const now = new Date();
      const eventDate = new Date(coupleEvent.eventDate);
      
      const days = differenceInDays(eventDate, now);
      const hours = differenceInHours(eventDate, now) % 24;
      const minutes = differenceInMinutes(eventDate, now) % 60;

      setCountdown({ days, hours, minutes });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [coupleEvent]);

  if (!coupleEvent) {
    return (
      <CoupleLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your wedding details...</p>
        </div>
      </CoupleLayout>
    );
  }

  const quickLinks = [
    {
      title: "Guest List",
      description: "Manage RSVPs and guest details",
      icon: Users,
      href: "/couple/guests",
      stat: `${stats?.confirmed || 0} confirmed`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Table Planning",
      description: "Organize guests by assigning them to tables",
      icon: MapPin,
      href: "/couple/table-planning",
      stat: "Manage seating",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Timeline",
      description: "Your day-of schedule",
      icon: Calendar,
      href: "/couple/timeline",
      stat: "View schedule",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Menu Selection",
      description: "Review meal options",
      icon: Utensils,
      href: "/couple/menu",
      stat: "View menu",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Accommodations",
      description: "View room assignments",
      icon: Home,
      href: "/couple/hotels",
      stat: "View rooms",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Planning Checklist",
      description: "Track your wedding tasks",
      icon: ListTodo,
      href: "/couple/checklist",
      stat: "View tasks",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  return (
    <CoupleLayout>
      {/* Hero Section with Manor Image */}
      <div className="relative -mx-6 -mt-8 mb-12">
        <div
          className="h-96 bg-cover bg-center relative"
          style={{ backgroundImage: "url(/manor-hero.jpg)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
          <div className="relative h-full flex flex-col items-center justify-center text-white px-6">
            <div className="text-center max-w-3xl">
              <h1 className="text-5xl font-serif mb-3">
                Welcome, {coupleEvent.coupleName1} & {coupleEvent.coupleName2}
              </h1>
              <p className="text-xl mb-8 text-white/90">Your journey begins here.</p>
              
              {/* Countdown Timer */}
              <div className="inline-block bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg px-8 py-6">
                <p className="text-sm uppercase tracking-wider mb-2 text-white/90">
                  Until The Big Day at Manor By The Lake
                </p>
                <div className="flex items-center gap-6 justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold">{countdown.days}</div>
                    <div className="text-xs uppercase tracking-wide text-white/80">Days</div>
                  </div>
                  <div className="text-3xl font-light">:</div>
                  <div className="text-center">
                    <div className="text-4xl font-bold">{countdown.hours}</div>
                    <div className="text-xs uppercase tracking-wide text-white/80">Hours</div>
                  </div>
                  <div className="text-3xl font-light">:</div>
                  <div className="text-center">
                    <div className="text-4xl font-bold">{countdown.minutes}</div>
                    <div className="text-xs uppercase tracking-wide text-white/80">Minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="mb-8">
        <Card className="border-[#6B8E23]/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif text-[#2C5F5D] mb-1">{coupleEvent.title}</h2>
                <p className="text-lg text-gray-600">
                  {format(new Date(coupleEvent.eventDate), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 bg-[#6B8E23]/10 text-[#6B8E23] px-4 py-2 rounded-full">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Planning in Progress</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planning Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Guests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#2C5F5D]">{stats?.guests || 0}</div>
            <p className="text-sm text-gray-600 mt-1">
              {stats?.confirmed || 0} confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Days Until Wedding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#2C5F5D]">{countdown.days}</div>
            <p className="text-sm text-gray-600 mt-1">
              {format(new Date(coupleEvent.eventDate), "MMM d, yyyy")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Planning Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6B8E23]">On Track</div>
            <p className="text-sm text-gray-600 mt-1">Everything is progressing well</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-2xl font-serif text-[#2C5F5D] mb-6">Your Wedding Planning</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks.filter((link) => {
            // Check permissions for each section
            if (link.title === "Guest List" && !permissions?.guestListEnabled) return false;
            if (link.title === "Seating Chart" && !permissions?.seatingEnabled) return false;
            if (link.title === "Timeline" && !permissions?.timelineEnabled) return false;
            if (link.title === "Menu Selection" && !permissions?.menuEnabled) return false;
            if (link.title === "Accommodations" && !permissions?.accommodationsEnabled) return false;
            return true;
          }).map((link) => {
            const Icon = link.icon;
            return (
              <Card
                key={link.title}
                className="hover:shadow-lg transition-shadow cursor-pointer border-[#6B8E23]/20"
                onClick={() => setLocation(link.href)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${link.bgColor} flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 ${link.color}`} />
                  </div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{link.description}</p>
                  <p className="text-sm font-medium text-[#6B8E23]">{link.stat}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </CoupleLayout>
  );
}
