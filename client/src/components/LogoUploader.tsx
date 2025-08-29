import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Image } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LogoUploaderProps {
  currentLogoUrl?: string;
  onLogoUpdated?: (newLogoUrl: string) => void;
}

export function LogoUploader({ currentLogoUrl, onLogoUpdated }: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { garage } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateGarageLogoMutation = useMutation({
    mutationFn: async (logoUrl: string) => {
      if (!garage?.id) throw new Error("No garage found");
      const response = await apiRequest("PUT", `/api/garages/${garage.id}`, { logo: logoUrl });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Success",
        description: "Logo updated successfully!",
      });
    },
    onError: (error) => {
      console.error("Logo update error:", error);
      toast({
        title: "Error",
        description: "Failed to update logo. Please try again.",
        variant: "destructive",
      });
    }
  });

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration missing');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'garage-logos');
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    const data = await response.json();
    return data.secure_url;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      
      // Upload to Cloudinary
      const logoUrl = await uploadToCloudinary(file);
      
      // Update garage logo
      await updateGarageLogoMutation.mutateAsync(logoUrl);
      
      // Clean up preview URL
      URL.revokeObjectURL(preview);
      setPreviewUrl(null);
      
      // Notify parent component
      onLogoUpdated?.(logoUrl);
      
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!garage?.id) return;
    
    try {
      await updateGarageLogoMutation.mutateAsync("");
      onLogoUpdated?.("");
      toast({
        title: "Success",
        description: "Logo removed successfully!",
      });
    } catch (error) {
      console.error("Remove logo error:", error);
      toast({
        title: "Error",
        description: "Failed to remove logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const displayUrl = previewUrl || currentLogoUrl;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Garage Logo</h3>
            {displayUrl && !isUploading && (
              <Badge variant="secondary" className="success-bg success-text">
                Logo Set
              </Badge>
            )}
          </div>

          {/* Logo Preview */}
          {displayUrl ? (
            <div className="flex items-center justify-center bg-muted rounded-lg p-4 min-h-32">
              <div className="relative">
                <img
                  src={displayUrl}
                  alt="Garage Logo"
                  className="max-h-24 max-w-48 object-contain rounded"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center bg-muted rounded-lg p-8 min-h-32">
              <div className="text-center text-muted-foreground">
                <Image className="mx-auto h-12 w-12 mb-2" />
                <p className="text-sm">No logo uploaded</p>
              </div>
            </div>
          )}

          {/* Upload Controls */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
                id="logo-upload-input"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isUploading}
                onClick={() => {
                  const input = document.getElementById('logo-upload-input') as HTMLInputElement;
                  if (input) {
                    input.click();
                  }
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "Uploading..." : displayUrl ? "Change Logo" : "Upload Logo"}
              </Button>
            </div>

            {displayUrl && !isUploading && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRemoveLogo}
                disabled={updateGarageLogoMutation.isPending}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            <p>• Recommended size: 200x100px or similar ratio</p>
            <p>• Maximum file size: 5MB</p>
            <p>• Supported formats: PNG, JPG, JPEG, GIF</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}