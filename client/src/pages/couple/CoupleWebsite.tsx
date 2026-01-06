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
import { Globe, ExternalLink, Save, Upload, Trash2, Plus, Image as ImageIcon, Edit2, Link2, Clock, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface RegistryLink {
  id?: number;
  title: string;
  url: string;
}

interface FaqItem {
  id?: number;
  question: string;
  answer: string;
}

interface TimelineItem {
  id?: number;
  time: string;
  title: string;
  description?: string | null;
}

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

  // Website basic settings
  const [slug, setSlug] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [ourStory, setOurStory] = useState("");
  const [travelInfo, setTravelInfo] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [rsvpEnabled, setRsvpEnabled] = useState(true);

  // Form inputs
  const [newRegistryTitle, setNewRegistryTitle] = useState("");
  const [newRegistryUrl, setNewRegistryUrl] = useState("");
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");
  const [newTimelineTime, setNewTimelineTime] = useState("");
  const [newTimelineTitle, setNewTimelineTitle] = useState("");
  const [newTimelineDescription, setNewTimelineDescription] = useState("");

  // Timeline editing
  const [editingTimelineId, setEditingTimelineId] = useState<number | null>(null);
  const [editTimelineTime, setEditTimelineTime] = useState("");
  const [editTimelineTitle, setEditTimelineTitle] = useState("");
  const [editTimelineDescription, setEditTimelineDescription] = useState("");
  const [isEditingTimeline, setIsEditingTimeline] = useState(false);

  // Gallery
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImageCaption, setNewImageCaption] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // tRPC mutations
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

  const utils = trpc.useUtils();

  const addRegistryLinkMutation = trpc.weddingWebsite.addRegistryLink.useMutation({
    onSuccess: () => {
      toast.success("Registry link added");
      setNewRegistryTitle("");
      setNewRegistryUrl("");
      if (website) {
        utils.weddingWebsite.getRegistryLinks.invalidate({ websiteId: website.id });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add registry link");
    },
  });

  const deleteRegistryLinkMutation = trpc.weddingWebsite.deleteRegistryLink.useMutation({
    onSuccess: () => {
      toast.success("Registry link deleted");
      if (website) {
        utils.weddingWebsite.getRegistryLinks.invalidate({ websiteId: website.id });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete registry link");
    },
  });

  const addFaqItemMutation = trpc.weddingWebsite.addFaqItem.useMutation({
    onSuccess: () => {
      toast.success("FAQ item added");
      setNewFaqQuestion("");
      setNewFaqAnswer("");
      if (website) {
        utils.weddingWebsite.getFaqItems.invalidate({ websiteId: website.id });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add FAQ item");
    },
  });

  const deleteFaqItemMutation = trpc.weddingWebsite.deleteFaqItem.useMutation({
    onSuccess: () => {
      toast.success("FAQ item deleted");
      if (website) {
        utils.weddingWebsite.getFaqItems.invalidate({ websiteId: website.id });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete FAQ item");
    },
  });

  const addTimelineItemMutation = trpc.weddingWebsite.addTimelineItem.useMutation({
    onSuccess: () => {
      toast.success("Timeline item added");
      setNewTimelineTime("");
      setNewTimelineTitle("");
      setNewTimelineDescription("");
      if (website) {
        utils.weddingWebsite.getTimelineItems.invalidate({ websiteId: website.id });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add timeline item");
    },
  });

  const deleteTimelineItemMutation = trpc.weddingWebsite.deleteTimelineItem.useMutation({
    onSuccess: () => {
      toast.success("Timeline item deleted");
      if (website) {
        utils.weddingWebsite.getTimelineItems.invalidate({ websiteId: website.id });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete timeline item");
    },
  });

  const updateTimelineItemMutation = trpc.weddingWebsite.updateTimelineItem.useMutation({
    onSuccess: () => {
      toast.success("Timeline item updated");
      setEditingTimelineId(null);
      setIsEditingTimeline(false);
      if (website) {
        utils.weddingWebsite.getTimelineItems.invalidate({ websiteId: website.id });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update timeline item");
    },
  });

  // Load data using queries
  const { data: registryLinks = [] } = trpc.weddingWebsite.getRegistryLinks.useQuery(
    { websiteId: website?.id || 0 },
    { enabled: !!website }
  );

  const { data: faqItems = [] } = trpc.weddingWebsite.getFaqItems.useQuery(
    { websiteId: website?.id || 0 },
    { enabled: !!website }
  );

  const { data: timelineItems = [] } = trpc.weddingWebsite.getTimelineItems.useQuery(
    { websiteId: website?.id || 0 },
    { enabled: !!website }
  );

  useEffect(() => {
    if (website) {
      setSlug(website.slug || "");
      setIsPublished(website.isPublished);
      setWelcomeMessage(website.welcomeMessage || "");
      setOurStory(website.ourStory || "");
      setTravelInfo(website.travelInfo || "");
      setDressCode(website.dressCode || "");
      setRsvpEnabled(website.rsvpEnabled);
    }
  }, [website]);

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
      travelInfo,
      dressCode,
      rsvpEnabled,
    };

    if (website) {
      updateMutation.mutate({ id: website.id, ...data });
    } else {
      createMutation.mutate({ eventId: coupleEvent.id, ...data });
    }
  };

  const handleAddRegistryLink = () => {
    if (!newRegistryTitle.trim() || !newRegistryUrl.trim()) {
      toast.error("Please enter both title and URL");
      return;
    }

    if (!website) {
      toast.error("Please save the website first");
      return;
    }

    addRegistryLinkMutation.mutate({
      websiteId: website.id,
      title: newRegistryTitle,
      url: newRegistryUrl,
    });
  };

  const handleDeleteRegistryLink = (id: number) => {
    deleteRegistryLinkMutation.mutate({ id });
  };

  const handleAddFaqItem = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
      toast.error("Please enter both question and answer");
      return;
    }

    if (!website) {
      toast.error("Please save the website first");
      return;
    }

    addFaqItemMutation.mutate({
      websiteId: website.id,
      question: newFaqQuestion,
      answer: newFaqAnswer,
    });
  };

  const handleDeleteFaqItem = (id: number) => {
    deleteFaqItemMutation.mutate({ id });
  };

  const handleAddTimelineItem = () => {
    if (!newTimelineTime.trim() || !newTimelineTitle.trim()) {
      toast.error("Please enter both time and title");
      return;
    }

    if (!website) {
      toast.error("Please save the website first");
      return;
    }

    addTimelineItemMutation.mutate({
      websiteId: website.id,
      time: newTimelineTime,
      title: newTimelineTitle,
      description: newTimelineDescription || undefined,
    });
  };

  const handleDeleteTimelineItem = (id: number) => {
    deleteTimelineItemMutation.mutate({ id });
  };

  const handleEditTimelineItem = (item: any) => {
    setEditingTimelineId(item.id);
    setEditTimelineTime(item.time);
    setEditTimelineTitle(item.title);
    setEditTimelineDescription(item.description || "");
    setIsEditingTimeline(true);
  };

  const handleUpdateTimelineItem = () => {
    if (!editTimelineTime.trim() || !editTimelineTitle.trim()) {
      toast.error("Please enter both time and title");
      return;
    }

    if (!editingTimelineId) return;

    updateTimelineItemMutation.mutate({
      id: editingTimelineId,
      time: editTimelineTime,
      title: editTimelineTitle,
      description: editTimelineDescription || undefined,
    });
  };

  const uploadPhotoMutation = trpc.weddingWebsite.uploadPhoto.useMutation({
    onSuccess: (data) => {
      toast.success("Photo uploaded successfully");
      const newImage: GalleryImage = {
        id: data.id.toString(),
        url: data.url,
        caption: newImageCaption,
      };
      setGallery([...gallery, newImage]);
      setNewImageFile(null);
      setNewImageCaption("");
      setIsAddingImage(false);
      setIsUploadingImage(false);
    },
    onError: (error: any) => {
      setIsUploadingImage(false);
      toast.error(error.message || "Failed to upload photo");
    },
  });

  const handleAddImage = async () => {
    if (!newImageFile) {
      toast.error("Please select an image file");
      return;
    }

    if (!website) {
      toast.error("Please save the website first");
      return;
    }

    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = (e.target?.result as string).split(',')[1];
        uploadPhotoMutation.mutate({
          websiteId: website.id,
          fileData: base64Data,
          fileName: newImageFile.name,
          mimeType: newImageFile.type,
          caption: newImageCaption || undefined,
        });
      };
      reader.readAsDataURL(newImageFile);
    } catch (error) {
      setIsUploadingImage(false);
      toast.error("Failed to process image");
    }
  };

  const removePhotoMutation = trpc.weddingWebsite.deletePhoto.useMutation({
    onSuccess: () => {
      toast.success("Photo removed");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove photo");
    },
  });

  const handleRemoveImage = (id: string) => {
    const photoId = parseInt(id, 10);
    if (!isNaN(photoId)) {
      removePhotoMutation.mutate({ id: photoId });
    }
    setGallery(gallery.filter(img => img.id !== id));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }
      setNewImageFile(file);
    }
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

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="dressCode">Dress Code</Label>
              <Textarea
                id="dressCode"
                value={dressCode}
                onChange={(e) => setDressCode(e.target.value)}
                rows={3}
                placeholder="e.g., Black Tie, Cocktail Attire, Garden Party, etc."
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{dressCode.length}/500 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="travelInfo">Travel & Accommodation Info</Label>
              <Textarea
                id="travelInfo"
                value={travelInfo}
                onChange={(e) => setTravelInfo(e.target.value)}
                rows={4}
                placeholder="Provide travel directions, accommodation recommendations, airport information, and local attractions..."
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{travelInfo.length}/2000 characters</p>
            </div>
          </CardContent>
        </Card>

        {/* Registry Links Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#2C5F5D]" />
                <div>
                  <CardTitle>Registry Links</CardTitle>
                  <CardDescription>Add links to your registries and honeymoon fund</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {registryLinks.length > 0 && (
                <div className="space-y-2">
                  {registryLinks.map((link: any) => (
                    <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{link.title}</p>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate">
                          {link.url}
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRegistryLink(link.id!)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="registryTitle">Registry Name *</Label>
                  <Input
                    id="registryTitle"
                    placeholder="e.g., John Lewis, Honeymoon Fund"
                    value={newRegistryTitle}
                    onChange={(e) => setNewRegistryTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registryUrl">Registry URL *</Label>
                  <Input
                    id="registryUrl"
                    placeholder="https://..."
                    value={newRegistryUrl}
                    onChange={(e) => setNewRegistryUrl(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleAddRegistryLink}
                  disabled={addRegistryLinkMutation.isPending}
                  className="w-full bg-[#2C5F5D] hover:bg-[#1e4441]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Registry Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#2C5F5D]" />
                <div>
                  <CardTitle>Event Timeline</CardTitle>
                  <CardDescription>Create a timeline of your wedding day events</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {timelineItems.length > 0 && (
                <div className="space-y-2 border-l-2 border-[#2C5F5D] pl-4">
                  {timelineItems.map((item: any) => (
                    <div key={item.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-[#2C5F5D]">{item.time}</p>
                          <p className="font-medium text-sm">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTimelineItem(item)}
                            className="text-[#2C5F5D] hover:text-[#1e4441]"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTimelineItem(item.id!)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="timelineTime">Time *</Label>
                  <Input
                    id="timelineTime"
                    placeholder="e.g., 14:00, 2:00 PM"
                    value={newTimelineTime}
                    onChange={(e) => setNewTimelineTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timelineTitle">Event Title *</Label>
                  <Input
                    id="timelineTitle"
                    placeholder="e.g., Ceremony, Reception, Dinner"
                    value={newTimelineTitle}
                    onChange={(e) => setNewTimelineTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timelineDescription">Description (optional)</Label>
                  <Textarea
                    id="timelineDescription"
                    placeholder="Add any additional details..."
                    value={newTimelineDescription}
                    onChange={(e) => setNewTimelineDescription(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <Button 
                  onClick={handleAddTimelineItem}
                  disabled={addTimelineItemMutation.isPending}
                  className="w-full bg-[#2C5F5D] hover:bg-[#1e4441]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Timeline Event
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#2C5F5D]" />
                <div>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>Add common questions and answers for your guests</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {faqItems.length > 0 && (
                <div className="space-y-2">
                  {faqItems.map((item: any) => (
                    <div key={item.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.question}</p>
                          <p className="text-sm text-gray-600 mt-1">{item.answer}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFaqItem(item.id!)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="faqQuestion">Question *</Label>
                  <Input
                    id="faqQuestion"
                    placeholder="e.g., What is the dress code?"
                    value={newFaqQuestion}
                    onChange={(e) => setNewFaqQuestion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faqAnswer">Answer *</Label>
                  <Textarea
                    id="faqAnswer"
                    placeholder="Provide the answer to the question..."
                    value={newFaqAnswer}
                    onChange={(e) => setNewFaqAnswer(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <Button 
                  onClick={handleAddFaqItem}
                  disabled={addFaqItemMutation.isPending}
                  className="w-full bg-[#2C5F5D] hover:bg-[#1e4441]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add FAQ Item
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Timeline Item Dialog */}
        <Dialog open={isEditingTimeline} onOpenChange={setIsEditingTimeline}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Timeline Event</DialogTitle>
              <DialogDescription>Modify the event time, title, and description</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editTimelineTime">Time *</Label>
                <Input
                  id="editTimelineTime"
                  placeholder="e.g., 14:00, 2:00 PM"
                  value={editTimelineTime}
                  onChange={(e) => setEditTimelineTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTimelineTitle">Event Title *</Label>
                <Input
                  id="editTimelineTitle"
                  placeholder="e.g., Ceremony, Reception, Dinner"
                  value={editTimelineTitle}
                  onChange={(e) => setEditTimelineTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTimelineDescription">Description (optional)</Label>
                <Textarea
                  id="editTimelineDescription"
                  placeholder="Add any additional details..."
                  value={editTimelineDescription}
                  onChange={(e) => setEditTimelineDescription(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline"
                onClick={() => setIsEditingTimeline(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateTimelineItem}
                disabled={updateTimelineItemMutation.isPending}
                className="bg-[#2C5F5D] hover:bg-[#1e4441]"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Photo Gallery Section */}
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
                    <DialogDescription>Upload a photo from your device</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageFile">Photo File *</Label>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50">
                        <input
                          id="imageFile"
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                        <label htmlFor="imageFile" className="cursor-pointer block">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-700">
                            {newImageFile ? newImageFile.name : "Click to select or drag and drop"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                        </label>
                      </div>
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
                    <Button 
                      onClick={handleAddImage} 
                      disabled={!newImageFile || isUploadingImage}
                      className="bg-[#2C5F5D] hover:bg-[#1e4441]"
                    >
                      {isUploadingImage ? "Uploading..." : "Add Photo"}
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
