import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import EmployeeLayout from "@/components/EmployeeLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Globe, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

export default function WeddingWebsite() {
  const params = useParams();
  const eventId = Number(params.id);
  const [, setLocation] = useLocation();

  const { data: website, refetch } = trpc.weddingWebsite.get.useQuery({ eventId });
  const { data: event } = trpc.events.getById.useQuery({ id: eventId });

  const [slug, setSlug] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [ourStory, setOurStory] = useState("");
  const [registryLinks, setRegistryLinks] = useState("");
  const [rsvpEnabled, setRsvpEnabled] = useState(true);

  useEffect(() => {
    if (website) {
      setSlug(website.slug || "");
      setIsPublished(website.isPublished);
      setWelcomeMessage(website.welcomeMessage || "");
      setOurStory(website.ourStory || "");
      setRegistryLinks(website.registryLinks || "");
      setRsvpEnabled(website.rsvpEnabled);
    }
  }, [website]);

  const createMutation = trpc.weddingWebsite.create.useMutation({
    onSuccess: () => {
      toast.success("Wedding website created");
      refetch();
    },
  });

  const updateMutation = trpc.weddingWebsite.update.useMutation({
    onSuccess: () => {
      toast.success("Changes saved");
      refetch();
    },
  });

  const handleSave = () => {
    const data = {
      slug,
      isPublished,
      welcomeMessage,
      ourStory,
      registryLinks,
      rsvpEnabled,
    };

    if (website) {
      updateMutation.mutate({ id: website.id, ...data });
    } else {
      createMutation.mutate({ eventId, ...data });
    }
  };

  const websiteUrl = slug ? `${window.location.origin}/wedding/${slug}` : "";

  return (
    <EmployeeLayout>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" onClick={() => setLocation(`/events/${eventId}`)}>
              ← Back to Event
            </Button>
            <h1 className="text-3xl font-serif font-bold mt-2">Wedding Website</h1>
            <p className="text-muted-foreground">{event?.title}</p>
          </div>
          <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Website Settings</CardTitle>
              <CardDescription>Configure your couple's public wedding website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Website URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="couple-names-2024"
                  />
                  {websiteUrl && (
                    <Button variant="outline" asChild>
                      <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
                {websiteUrl && (
                  <p className="text-xs text-muted-foreground">{websiteUrl}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Publish Website</Label>
                  <p className="text-sm text-muted-foreground">Make the website publicly accessible</p>
                </div>
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable RSVP</Label>
                  <p className="text-sm text-muted-foreground">Allow guests to RSVP through the website</p>
                </div>
                <Switch checked={rsvpEnabled} onCheckedChange={setRsvpEnabled} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>Customize the content displayed on the website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Textarea
                  id="welcomeMessage"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                  placeholder="Welcome to our wedding website! We're so excited to celebrate with you..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ourStory">Our Story</Label>
                <Textarea
                  id="ourStory"
                  value={ourStory}
                  onChange={(e) => setOurStory(e.target.value)}
                  rows={6}
                  placeholder="Tell your love story..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registryLinks">Registry Links</Label>
                <Textarea
                  id="registryLinks"
                  value={registryLinks}
                  onChange={(e) => setRegistryLinks(e.target.value)}
                  rows={3}
                  placeholder="Add registry links (one per line)&#10;https://registry1.com&#10;https://registry2.com"
                />
                <p className="text-xs text-muted-foreground">Enter one URL per line</p>
              </div>
            </CardContent>
          </Card>

          {website && isPublished && (
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <CardTitle>Website is Live!</CardTitle>
                </div>
                <CardDescription>Your wedding website is now publicly accessible</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input value={websiteUrl} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(websiteUrl);
                      toast.success("URL copied to clipboard");
                    }}
                  >
                    Copy
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!website && (
            <Card className="bg-muted">
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground text-center">
                  No wedding website has been created yet. Fill in the details above and click "Save Changes" to create one.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}
