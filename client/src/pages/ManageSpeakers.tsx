import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Speaker {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  photoUrl: string | null;
  orderIndex: number;
}

export default function ManageSpeakers() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    photoUrl: '',
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('draft');
    if (!id) {
      toast({
        title: "Error",
        description: "No event ID provided",
        variant: "destructive",
      });
      setLocation('/business/events/drafts');
      return;
    }
    setDraftId(id);
  }, []);

  const { data: speakers, isLoading } = useQuery<Speaker[]>({
    queryKey: [`/api/events/business/${draftId}/speakers`],
    queryFn: async () => {
      if (!draftId) return [];
      const res = await fetch(`/api/events/business/${draftId}/speakers`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load speakers');
      return res.json();
    },
    enabled: !!draftId,
  });

  const addSpeakerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!draftId) {
        console.error('❌ No draftId available');
        throw new Error('No event ID available');
      }
      
      console.log('🚀 Adding speaker with data:', data, 'to event:', draftId);
      const res = await fetch(`/api/events/business/${draftId}/speakers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          bio: data.bio || null,
          photoUrl: data.photoUrl || null,
          orderIndex: (speakers?.length || 0) + 1,
        }),
      });
      console.log('📡 Response status:', res.status, 'OK:', res.ok);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Response error:', errorText);
        throw new Error('Failed to add speaker');
      }
      
      try {
        const jsonData = await res.json();
        console.log('✅ Speaker added successfully:', jsonData);
        return jsonData;
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('Raw response text:', await res.text());
        throw new Error('Invalid response format');
      }
    },
    onSuccess: (data) => {
      console.log('✨ onSuccess called with data:', data);
      try {
        queryClient.invalidateQueries({ queryKey: [`/api/events/business/${draftId}/speakers`] });
        console.log('✅ Query invalidated successfully');
        toast({ title: "Speaker Added", description: "Speaker added successfully." });
        setDialogOpen(false);
        resetForm();
      } catch (successError) {
        console.error('❌ Error in onSuccess handler:', successError);
      }
    },
    onError: (error: Error) => {
      console.error('❌ onError called with:', error.message, error);
      toast({ title: "Error", description: "Failed to add speaker.", variant: "destructive" });
    },
  });

  const updateSpeakerMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const res = await fetch(`/api/events/business/${draftId}/speakers/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name,
          title: data.title,
          bio: data.bio || null,
          photoUrl: data.photoUrl || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to update speaker');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/business/${draftId}/speakers`] });
      toast({ title: "Speaker Updated", description: "Speaker updated successfully." });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update speaker.", variant: "destructive" });
    },
  });

  const deleteSpeakerMutation = useMutation({
    mutationFn: async (speakerId: string) => {
      const res = await fetch(`/api/events/business/${draftId}/speakers/${speakerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete speaker');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/business/${draftId}/speakers`] });
      toast({ title: "Speaker Deleted", description: "Speaker removed successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete speaker.", variant: "destructive" });
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, photoUrl: base64String });
        toast({
          title: "Photo Uploaded",
          description: "Speaker photo uploaded successfully",
        });
        setUploadingPhoto(false);
      };
      reader.onerror = () => {
        toast({
          title: "Upload Failed",
          description: "Failed to read image file",
          variant: "destructive",
        });
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo",
        variant: "destructive",
      });
      setUploadingPhoto(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', title: '', bio: '', photoUrl: '' });
    setEditingSpeaker(null);
  };

  const handleOpenDialog = (speaker?: Speaker) => {
    if (speaker) {
      setEditingSpeaker(speaker);
      setFormData({
        name: speaker.name,
        title: speaker.title,
        bio: speaker.bio || '',
        photoUrl: speaker.photoUrl || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSpeaker) {
      updateSpeakerMutation.mutate({ ...formData, id: editingSpeaker.id });
    } else {
      addSpeakerMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button
        variant="ghost"
        onClick={() => setLocation(`/business/events/builder?draft=${draftId}`)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Event Builder
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Speakers</h1>
          <p className="text-muted-foreground mt-2">Add instructors and presenters for your event</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Speaker
        </Button>
      </div>

      {!speakers || speakers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No speakers added yet</h3>
            <p className="text-muted-foreground mb-4">
              Add speakers, instructors, or presenters for your event
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Speaker
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {speakers.map((speaker) => (
            <Card key={speaker.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {speaker.photoUrl ? (
                    <img
                      src={speaker.photoUrl}
                      alt={speaker.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                      {speaker.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{speaker.name}</h3>
                    <p className="text-muted-foreground">{speaker.title}</p>
                    {speaker.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {speaker.bio}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenDialog(speaker)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteSpeakerMutation.mutate(speaker.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSpeaker ? 'Edit Speaker' : 'Add Speaker'}</DialogTitle>
            <DialogDescription>
              {editingSpeaker ? 'Update speaker information' : 'Add a new speaker to your event'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="title">Title/Role *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Lead Instructor, Guest Speaker"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Brief biography or credentials"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="photoUrl">Speaker Photo</Label>
                <div className="space-y-3">
                  {formData.photoUrl && (
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.photoUrl}
                        alt="Preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-muted"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, photoUrl: '' })}
                      >
                        Remove Photo
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadingPhoto ? 'Uploading...' : 'Upload image (max 2MB)'}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or enter URL</span>
                    </div>
                  </div>
                  <Input
                    id="photoUrl"
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={formData.photoUrl.startsWith('data:') ? '' : formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    disabled={uploadingPhoto}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingSpeaker ? 'Update' : 'Add'} Speaker
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
