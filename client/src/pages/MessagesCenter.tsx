import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Mail, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import EmployeeLayout from "@/components/EmployeeLayout";
import { format } from "date-fns";

export default function MessagesCenter() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: messages } = trpc.messages.list.useQuery();

  const filteredMessages = messages?.filter((msg) =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadMessages = filteredMessages?.filter((msg) => !msg.isRead);
  const urgentMessages = filteredMessages?.filter((msg) => msg.isUrgent);

  const MessageCard = ({ message }: { message: any }) => (
    <Card
      className={`hover:shadow-lg transition-shadow cursor-pointer ${
        !message.isRead ? "border-l-4 border-l-primary" : ""
      }`}
      onClick={() => setLocation(`/events/${message.eventId}`)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mail className={`w-5 h-5 ${!message.isRead ? "text-primary" : "text-muted-foreground"}`} />
            <h3 className="font-semibold">Event #{message.eventId}</h3>
          </div>
          <div className="flex items-center gap-2">
            {message.isUrgent && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                <AlertCircle className="w-3 h-3" />
                Urgent
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.createdAt), "MMM d, h:mm a")}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-2">From: Sender #{message.senderId}</p>
        <p className="text-sm line-clamp-2">{message.content}</p>
      </CardContent>
    </Card>
  );

  return (
    <EmployeeLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Messages Center</h1>
          <p className="text-muted-foreground">View and manage all event-related messages</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All Messages ({filteredMessages?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({unreadMessages?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="urgent">
              Urgent ({urgentMessages?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredMessages && filteredMessages.length > 0 ? (
              filteredMessages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground">No messages found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            {unreadMessages && unreadMessages.length > 0 ? (
              unreadMessages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground">No unread messages</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="urgent" className="space-y-4">
            {urgentMessages && urgentMessages.length > 0 ? (
              urgentMessages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground">No urgent messages</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </EmployeeLayout>
  );
}
