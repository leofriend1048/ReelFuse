import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from "framer-motion";
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { inngest } from '@/src/inngest/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import dropboxIcon from '/public/dropbox.svg';

const supabase = createClient();

const formSchema = z.object({
  files: z.array(z.any())
    .refine((files) => files.length > 0, 'At least one file is required')
    .refine((files) => files.every((file) => file.size <= 5000000000), 'Max file size is 5GB for each file'),
});

declare global {
  interface Window {
    Dropbox: any;
  }
}

export default function LibraryUpload() {
  const { brand } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isDropboxScriptLoaded, setIsDropboxScriptLoaded] = useState(false);
  const [thumbnails, setThumbnails] = useState<{ [key: string]: string }>({});
  const thumbnailCache = useRef<{ [key: string]: string }>({});

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      files: [],
    },
    mode: 'onChange',
    resolver: zodResolver(formSchema),
  });

  const { setValue, handleSubmit, formState: { errors } } = form;

  const generateThumbnail = async (file: File): Promise<string> => {
    // Check cache first
    const cacheKey = `${file.name}-${file.lastModified}`;
    if (thumbnailCache.current[cacheKey]) {
      return thumbnailCache.current[cacheKey];
    }

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.autoplay = false;
      video.muted = true;
      video.src = URL.createObjectURL(file);

      video.onloadeddata = () => {
        // Set canvas dimensions to maintain aspect ratio
        const aspectRatio = video.videoWidth / video.videoHeight;
        const height = 80; // Thumbnail height
        const width = height * aspectRatio;

        canvas.width = width;
        canvas.height = height;

        // Seek to 1 second or 25% of the video, whichever is less
        const seekTime = Math.min(1, video.duration * 0.25);
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          
          // Cache the thumbnail
          thumbnailCache.current[cacheKey] = thumbnail;
          
          URL.revokeObjectURL(video.src);
          resolve(thumbnail);
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };
    });
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.dropbox.com/static/api/2/dropins.js';
    script.id = 'dropboxjs';
    script.setAttribute('data-app-key', 'q69wtq2ihwqzm4j');
    script.onload = () => setIsDropboxScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById('dropboxjs');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setValue('files', acceptedFiles, { shouldValidate: true });
    
    // Generate thumbnails for new files
    for (const file of acceptedFiles) {
      try {
        const thumbnail = await generateThumbnail(file);
        setThumbnails(prev => ({
          ...prev,
          [file.name]: thumbnail
        }));
      } catch (error) {
        console.error('Error generating thumbnail:', error);
      }
    }
    
    toast.success(`${acceptedFiles.length} file(s) added`);
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.wmv']
    },
    maxSize: 5000000000
  });

  const getVideoDuration = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.src = URL.createObjectURL(file);
      videoElement.onloadedmetadata = () => {
        URL.revokeObjectURL(videoElement.src);
        const duration = videoElement.duration;
        const hours = Math.floor(duration / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((duration % 3600) / 60).toString().padStart(2, '0');
        const seconds = Math.floor(duration % 60).toString().padStart(2, '0');
        resolve(`${hours}:${minutes}:${seconds}`);
      };
      videoElement.onerror = () => {
        reject(new Error('Failed to load video metadata'));
      };
    });
  };

  const uploadFile = async (file: File) => {
    const fileExtension = file.name.split('.').pop();
    const filePath = `${Date.now()}.${fileExtension}`;
    const { error: uploadError } = await supabase.storage
      .from('modular_clips')
      .upload(filePath, file, {
        cacheControl: '604800', // Cache for 7 days
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    setUploadProgress(prev => ({
      ...prev,
      [file.name]: 100
    }));

    const publicURL = `https://uwfllbptpdqoovbeizya.supabase.co/storage/v1/object/public/modular_clips/${filePath}`;
    const duration = await getVideoDuration(file);

    try {
      await inngest.send({
        name: "upload/video.received",
        data: {
          publicURL,
          duration,
          brand,
        },
      });
      toast(`New Video Uploaded: ${file.name.length > 100 ? file.name.substring(0, 97) + '...' : file.name} (${duration})`);
    } catch (error: any) {
      console.error('Error sending event to Inngest:', error);
      throw new Error(error.message);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsUploading(true);
    try {
      for (const file of values.files) {
        await uploadFile(file);
      }
      toast.success("All videos have been uploaded successfully and are now processing");
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error during form submission:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setValue('files', []);
      setUploadProgress({});
      setThumbnails({});
    }
  };

  const removeFile = (fileToRemove: File) => {
    if (!isUploading) {
      const currentFiles = form.getValues('files');
      const updatedFiles = currentFiles.filter(file => file !== fileToRemove);
      setValue('files', updatedFiles, { shouldValidate: true });
      
      // Remove thumbnail
      setThumbnails(prev => {
        const updated = { ...prev };
        delete updated[fileToRemove.name];
        return updated;
      });
      
      toast.info('File removed');
    }
  };

  const handleDropboxChooser = () => {
    if (window.Dropbox && isDropboxScriptLoaded) {
      window.Dropbox.choose({
        success: async (files: any[]) => {
          const videoFiles = files.filter(file => 
            file.name.match(/\.(mp4|mov|avi|wmv)$/i)
          );
          if (videoFiles.length > 0) {
            setIsUploading(true);
            try {
              const downloadedFiles = await Promise.all(videoFiles.map(async file => {
                const response = await fetch(file.link);
                const blob = await response.blob();
                return new File([blob], file.name, { type: blob.type });
              }));
              
              // Generate thumbnails for Dropbox files
              for (const file of downloadedFiles) {
                try {
                  const thumbnail = await generateThumbnail(file);
                  setThumbnails(prev => ({
                    ...prev,
                    [file.name]: thumbnail
                  }));
                } catch (error) {
                  console.error('Error generating thumbnail:', error);
                }
              }
              
              const currentFiles = form.getValues('files') || [];
              setValue('files', [...currentFiles, ...downloadedFiles], { shouldValidate: true });
              toast.success(`${downloadedFiles.length} video file(s) added from Dropbox`);
            } catch (error) {
              toast.error('Failed to download files from Dropbox');
              console.error('Dropbox download error:', error);
            } finally {
              setIsUploading(false);
            }
          } else {
            toast.error('No valid video files selected from Dropbox');
          }
        },
        cancel: () => {
          toast.info('Dropbox file selection cancelled');
        },
        linkType: "direct",
        multiselect: true,
        extensions: ['.mp4', '.mov', '.avi', '.wmv'],
      });
    } else {
      toast.error('Dropbox Chooser is not available');
    }
  };

  const files = form.watch('files') as File[];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload New Video
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Upload Videos</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Choose videos from your computer or import directly from Dropbox
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {!isUploading && (
            <div className="grid gap-6">
              <div
                {...getRootProps()}
                className={`relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed p-8 transition-all ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    {isDragActive ? 'Drop your files here' : 'Drag & drop your videos'}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    or click to browse your files
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    MP4, MOV, AVI, WMV up to 5GB each
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center text-xs uppercase">
                <span className="flex-grow border-t" />
                <span className="bg-background px-2 text-muted-foreground">Or</span>
                <span className="flex-grow border-t" />
              </div>

              <Button
                type="button"
                onClick={handleDropboxChooser}
                variant="outline"
                className="w-full h-14"
                disabled={!isDropboxScriptLoaded || isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Image
                    src={dropboxIcon}
                    alt="Dropbox logo"
                    width={24}
                    height={24}
                    className="mr-2"
                  />
                )}
                {isUploading ? 'Downloading...' : 'Choose from Dropbox'}
              </Button>
            </div>
          )}

          {errors.files && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.files.message}</span>
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="rounded-lg border bg-card">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Selected Files</h3>
                    <p className="text-sm text-muted-foreground">
                      {files.length} file{files.length !== 1 ? 's' : ''} ready
                    </p>
                  </div>
                  {!isUploading && (
                    <Button type="submit">
                      <Upload className="mr-2 h-4 w-4" />
                      Start Upload
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-4">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <motion.div
                        key={file.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between rounded-lg border bg-card p-3"
                      >
                        <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-auto items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
  {thumbnails[file.name] ? (
    <Image
      src={thumbnails[file.name]}
      alt={`Thumbnail for ${file.name}`}
      width={40} // Required by Next.js, but we’ll override with CSS
      height={40} // Sets fixed height
      className="w-auto h-10 object-cover"
      unoptimized // Optional
    />
  ) : (
    <div className="h-10 w-16 flex items-center justify-center">
      <Loader2 className="h-4 w-4 animate-spin" />
    </div>
  )}
</div>

                          <div>
                            <p className="text-sm font-medium leading-none">
                              {file.name.length > 50 ? file.name.substring(0, 47) + '...' : file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            {uploadProgress[file.name] !== undefined && (
                              <div className="mt-2 w-full">
                                <Progress value={uploadProgress[file.name]} className="h-1" />
                              </div>
                            )}
                          </div>
                        </div>
                        {!isUploading && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}