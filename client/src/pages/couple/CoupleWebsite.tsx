import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import CoupleLayout from "@/components/CoupleLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Globe, ExternalLink, Save, Upload, Trash2, Plus, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface GalleryImage {
  id: string;
  url: string;
  caption: string;
}

export default function CoupleWebsite() {
  const { data: events = [] } = trpc.events.list.useQuery();
  const coupleEvent = events[0];

  const { data: website, refetch } = trpc.weddingWebsite.get.useQuery(
    { eventId: coupleEvent?.id || 0 },
    { enabled: !!coupleEvent }
  );

  const [slug, setSlug] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [ourStory, setOurStory] = useState("");
  const [registryLinks, setRegistryLinks] = useState("");
  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");

  useEffect(() => {
    if (website) {
      setSlug(website.slug || "");
      setIsPublished(website.isPublished);
      setWelcomeMessage(website.welcomeMessage || "");
      setOurStory(website.ourStory || "");
      setRegistryLinks(website.registryLinks || "");
      setRsvpEnabled(website.rsvpEnabled);
      
      // Gallery data will be stored in registryLinks field for now
      // This can be migrated to a separate field later
    }
  }, [website]);

  const createMutation = trpc.weddingWebsite.create.useMutation({
    onSuccess: () => {
      toast.success("Wedding website created");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create website");
    },
  });

  const updateMutation = trpc.weddingWebsite.update.useMutation({
    onSuccess: () => {
      toast.success("Changes saved");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save changes");
    },
  });

  const handleSave = () => {
    if (!coupleEvent) {
      toast.error("Event not found");
      return;
    }

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
      createMutation.mutate({ eventId: coupleEvent.id, ...data });
    }
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }

    const newImage: GalleryImage = {
      id: Date.now().toString(),
      url: newImageUrl,
      caption: newImageCaption,
    };

    setGallery([...gallery, newImage]);
    setNewImageUrl("");
    setNewImageCaption("");
    setIsAddingImage(false);
    toast.success("Image added to gallery");
  };

  const handleRemoveImage = (id: string) => {
    setGallery(gallery.filter(img => img.id !== id));
    toast.success("Image removed from gallery");
  };

  const handleUpdateCaption = (id: string, caption: string) => {
    setGallery(gallery.map(img => 
      img.id === id ? { ...img, caption } : img
    ));
  };

  const websiteUrl = slug && coupleEvent ? `${window.location.origin}/wedding/${slug}` : "";

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-[#2C5F5D] mb-2">Wedding Website</h1>
            <p className="text-gray-600">Create and customize your personalized wedding website</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-[#2C5F5D] hover:bg-[#1e4441]"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Website Settings</CardTitle>
            <CardDescription>Configure your wedding website</CardDescription>
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
                  className="flex-1"
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

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label>Publish Website</Label>
                <p className="text-sm text-muted-foreground">Make your website publicly accessible to guests</p>
              </div>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label>Enable RSVP</Label>
                <p className="text-sm text-muted-foreground">Allow guests to RSVP through your website</p>
              </div>
              <Switch checked={rsvpEnabled} onCheckedChange={setRsvpEnabled} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>Customize the content displayed on your website</CardDescription>
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
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{welcomeMessage.length}/500 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ourStory">Our Story</Label>
              <Textarea
                id="ourStory"
                value={ourStory}
                onChange={(e) => setOurStory(e.target.value)}
                rows={6}
                placeholder="Tell your love story... How did you meet? What's your journey together?"
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{ourStory.length}/2000 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registryLinks">Registry Links</Label>
              <Textarea
                id="registryLinks"
                value={registryLinks}
                onChange={(e) => setRegistryLinks(e.target.value)}
                rows={4}
                placeholder="Add registry links (one per line)&#10;https://registry1.com&#10;https://registry2.com"
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Enter one URL per line. You can also add links to your honeymoon fund, charity donations, or other registries.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Photo Gallery</CardTitle>
                <CardDescription>Add photos to your wedding website gallery</CardDescription>
              </div>
              <Dialog open={isAddingImage} onOpenChange={setIsAddingImage}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Photo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Photo to Gallery</DialogTitle>
                    <DialogDescription>Add a photo URL and optional caption</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Photo URL *</Label>
                      <Input
                        id="imageUrl"
                        placeholder="https://example.com/photo.jpg"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Paste the URL of your photo. You can upload photos to cloud storage services like Google Drive, Dropbox, or Imgur.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageCaption">Caption (optional)</Label>
                      <Input
                        id="imageCaption"
                        placeholder="e.g., Engagement photo, Reception moment..."
                        value={newImageCaption}
                        onChange={(e) => setNewImageCaption(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddImage} className="bg-[#2C5F5D] hover:bg-[#1e4441]">
                      Add Photo
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {gallery.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No photos yet</p>
                <p className="text-sm text-muted-foreground">Add photos to create a beautiful gallery for your guests</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gallery.map((image) => (
                  <div key={image.id} className="border rounded-lg overflow-hidden">
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <img 
                        src={image.url} 
                        alt={image.caption} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f0f0f0' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='16' fill='%23999'%3EImage not found%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    <div className="p-3 space-y-2">
                      <Input
                        value={image.caption}
                        onChange={(e) => handleUpdateCaption(image.id, e.target.value)}
                        placeholder="Add a caption..."
                        className="text-sm"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveImage(image.id)}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {website && isPublished && (
          <Card className="border-[#2C5F5D] bg-teal-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#2C5F5D]" />
                <CardTitle>Website is Live!</CardTitle>
              </div>
              <CardDescription>Your wedding website is now publicly accessible to your guests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input value={websiteUrl} readOnly className="font-mono text-sm flex-1" />
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
    </CoupleLayout>
  );
}
