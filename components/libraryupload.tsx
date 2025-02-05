import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDropzone } from 'react-dropzone';
import { motion } from "framer-motion";
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
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
const BATCH_SIZE = 5;

const formSchema = z.object({
  files: z.array(z.union([
    z.instanceof(File),
    z.object({
      name: z.string(),
      link: z.string().url(),
      isDropbox: z.literal(true),
    })
  ]))
    .refine((files) => files.length > 0, 'At least one file is required')
    .refine((files) => files.every((file) => 
      file instanceof File ? file.size <= 5000000000 : true
    ), 'Max file size is 5GB for each file'),
});

type DropboxFile = {
  name: string;
  link: string;
  isDropbox: true;
};

declare global {
  interface Window {
    Dropbox: any;
  }
}

async function getVideoDuration(url: string): Promise<string> {
  try {
    const response = await fetch('https://us-central1-reel-fuse.cloudfunctions.net/getVideoDuration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoUrl: url }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch video duration');
    }

    const { duration } = await response.json();
    return duration.split(':').length === 2 ? `00:${duration}` : duration;
  } catch (error) {
    console.error('Error getting video duration:', error);
    throw error;
  }
}

const generateThumbnailFromUrl = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.crossOrigin = 'anonymous';
    video.autoplay = false;
    video.muted = true;
    video.src = url;

    const cleanup = () => {
      video.remove();
      canvas.remove();
    };

    video.onloadeddata = () => {
      const aspectRatio = video.videoWidth / video.videoHeight;
      const height = 80;
      const width = height * aspectRatio;

      canvas.width = width;
      canvas.height = height;

      const seekTime = Math.min(1, video.duration * 0.25);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      if (ctx) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          cleanup();
          resolve(thumbnail);
        } catch (error) {
          cleanup();
          reject(new Error('Failed to generate thumbnail'));
        }
      } else {
        cleanup();
        reject(new Error('Failed to get canvas context'));
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video'));
    };

    setTimeout(() => {
      cleanup();
      reject(new Error('Thumbnail generation timed out'));
    }, 10000);
  });
};

const processThumbnailBatch = async (
  files: (File | DropboxFile)[],
  startIndex: number,
  setThumbnails: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>,
  thumbnailCache: React.MutableRefObject<{ [key: string]: string }>
) => {
  const batch = files.slice(startIndex, startIndex + BATCH_SIZE);
  const promises = batch.map(async (file) => {
    try {
      let thumbnail: string;
      if ('isDropbox' in file) {
        thumbnail = await generateThumbnailFromUrl(file.link);
      } else {
        const cacheKey = `${file.name}-${file.lastModified}`;
        if (thumbnailCache.current[cacheKey]) {
          thumbnail = thumbnailCache.current[cacheKey];
        } else {
          thumbnail = await new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.autoplay = false;
            video.muted = true;
            video.src = URL.createObjectURL(file);

            video.onloadeddata = () => {
              const aspectRatio = video.videoWidth / video.videoHeight;
              const height = 80;
              const width = height * aspectRatio;

              canvas.width = width;
              canvas.height = height;

              const seekTime = Math.min(1, video.duration * 0.25);
              video.currentTime = seekTime;
            };

            video.onseeked = () => {
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                thumbnailCache.current[cacheKey] = thumbnail;
                URL.revokeObjectURL(video.src);
                resolve(thumbnail);
              } else {
                URL.revokeObjectURL(video.src);
                reject(new Error('Failed to get canvas context'));
              }
            };

            video.onerror = () => {
              URL.revokeObjectURL(video.src);
              reject(new Error('Failed to load video'));
            };
          });
        }
      }
      return { name: file.name, thumbnail };
    } catch (error) {
      console.error(`Error generating thumbnail for ${file.name}:`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  results.forEach(result => {
    if (result) {
      setThumbnails(prev => ({
        ...prev,
        [result.name]: result.thumbnail
      }));
    }
  });
};

export default function LibraryUpload() {
  const { brand } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isDropboxScriptLoaded, setIsDropboxScriptLoaded] = useState(false);
  const [thumbnails, setThumbnails] = useState<{ [key: string]: string }>({});
  const thumbnailCache = useRef<{ [key: string]: string }>({});
  const [isSelectingDropboxFiles, setIsSelectingDropboxFiles] = useState(false);
  const [dropboxLoadingText, setDropboxLoadingText] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      files: [],
    },
    mode: 'onChange',
    resolver: zodResolver(formSchema),
  });

  const { setValue, handleSubmit, formState: { errors } } = form;

  const processAllThumbnails = async (files: (File | DropboxFile)[]) => {
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      await processThumbnailBatch(files, i, setThumbnails, thumbnailCache);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setValue('files', acceptedFiles, { shouldValidate: true });
    processAllThumbnails(acceptedFiles);
    toast.success(`${acceptedFiles.length} file(s) added`);
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.wmv']
    },
    maxSize: 5000000000
  });

  const getLocalVideoDuration = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.src = URL.createObjectURL(file);
      videoElement.onloadedmetadata = () => {
        const duration = videoElement.duration;
        const hours = Math.floor(duration / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((duration % 3600) / 60).toString().padStart(2, '0');
        const seconds = Math.floor(duration % 60).toString().padStart(2, '0');
        URL.revokeObjectURL(videoElement.src);
        resolve(`${hours}:${minutes}:${seconds}`);
      };
      videoElement.onerror = () => {
        URL.revokeObjectURL(videoElement.src);
        reject(new Error('Failed to load video metadata'));
      };
    });
  };

  const uploadFile = async (file: File | DropboxFile) => {
    try {
      let publicURL: string;
      let duration: string;
  
      if ("isDropbox" in file) {
        publicURL = file.link;
        duration = await getVideoDuration(file.link);
      } else {
        const fileExtension = file.name.split(".").pop();
        const uniqueFilename = `${uuidv4()}.${fileExtension}`;
  
        const { error: uploadError } = await supabase.storage
          .from("modular_clips")
          .upload(uniqueFilename, file, {
            cacheControl: "604800", // 7-day caching
          });
  
        if (uploadError) throw new Error(uploadError.message);
  
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: 100,
        }));
  
        publicURL = `https://uwfllbptpdqoovbeizya.supabase.co/storage/v1/object/public/modular_clips/${uniqueFilename}`;
        duration = await getLocalVideoDuration(file);
      }
  
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${API_BASE_URL}/api/inngest-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicURL,
          duration,
          brand,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to trigger Inngest event");
      }
  
      toast.success(`Uploaded: ${file.name} (${duration})`);
    } catch (error: any) {
      console.error("Error processing file:", error);
      throw new Error(`Failed to process ${file.name}: ${error.message}`);
    }
  };
  
  

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isUploading) return;
    
    setIsUploading(true);
    const errors: string[] = [];

    try {
      await Promise.all(values.files.map(async (file) => {
        try {
          await uploadFile(file);
        } catch (error: any) {
          errors.push(`${file.name}: ${error.message}`);
        }
      }));

      if (errors.length === 0) {
        toast.success("All files have been processed successfully");
        setIsOpen(false);
      } else {
        toast.error(`Some files failed to process: ${errors.join(', ')}`);
      }
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

  const removeFile = (fileToRemove: File | DropboxFile) => {
    if (!isUploading) {
      const currentFiles = form.getValues('files');
      const updatedFiles = currentFiles.filter(file => {
        if ('isDropbox' in file && 'isDropbox' in fileToRemove) {
          return file.link !== fileToRemove.link;
        }
        return file !== fileToRemove;
      });
      setValue('files', updatedFiles, { shouldValidate: true });
      
      setThumbnails(prev => {
        const updated = { ...prev };
        delete updated[fileToRemove.name];
        return updated;
      });
      
      toast.info('File removed');
    }
  };

  const handleDropboxChooser = () => {
    if (!window.Dropbox || !isDropboxScriptLoaded) {
      toast.error('Dropbox Chooser is not available');
      return;
    }

    setIsSelectingDropboxFiles(true);
    setDropboxLoadingText('Opening Dropbox...');

    window.Dropbox.choose({
      success: async (files: any[]) => {
        setDropboxLoadingText('Processing selected files...');
        const videoFiles = files.filter(file => 
          file.name.match(/\.(mp4|mov|avi|wmv)$/i)
        );

        if (videoFiles.length === 0) {
          setIsSelectingDropboxFiles(false);
          setDropboxLoadingText('');
          toast.error('No valid video files selected from Dropbox');
          return;
        }

        const dropboxFiles: DropboxFile[] = videoFiles.map(file => ({
          name: file.name,
          link: file.link,
          isDropbox: true,
        }));

        const currentFiles = form.getValues('files') || [];
        setValue('files', [...currentFiles, ...dropboxFiles], { shouldValidate: true });
        setIsSelectingDropboxFiles(false);
        setDropboxLoadingText('');
        toast.success(`${dropboxFiles.length} video file(s) added from Dropbox`);
        
        // Start processing thumbnails after setting files
        processAllThumbnails(dropboxFiles);
      },
      cancel: () => {
        setIsSelectingDropboxFiles(false);
        setDropboxLoadingText('');
        toast.info('Dropbox file selection cancelled');
      },
      linkType: "direct",
      multiselect: true,
      extensions: ['.mp4', '.mov', '.avi', '.wmv'],
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

  const files = form.watch('files');

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
          {!isUploading && !isSelectingDropboxFiles && (
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
                    <Upload className="h-6 w-6" />
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
                disabled={!isDropboxScriptLoaded || isUploading || isSelectingDropboxFiles}
              >
                {isSelectingDropboxFiles ? (
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
                {isSelectingDropboxFiles ? dropboxLoadingText : 'Choose from Dropbox'}
              </Button>
            </div>
          )}

          {isSelectingDropboxFiles && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-semibold">{dropboxLoadingText}</p>
                <p className="text-sm text-muted-foreground mt-1">Please don&apos;t close this window</p>
              </div>
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
                  {!isUploading && !isSelectingDropboxFiles && (
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
                    {files.map((file: File | DropboxFile, index) => (
                      <motion.div
                        key={'isDropbox' in file ? file.link : file.name}
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
                                width={40}
                                height={40}
                                className="w-auto h-10 object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="h-[22.5px] w-[22.5px] flex items-center justify-center">
                                <Loader2 className="h-[22.5px] w-[22.5px] animate-spin" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {file.name.length > 50 ? file.name.substring(0, 47) + '...' : file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {'isDropbox' in file ? 'Dropbox File' : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                            </p>
                            {uploadProgress[file.name] !== undefined && (
                              <div className="mt-2 w-full">
                                <Progress value={uploadProgress[file.name]} className="h-1" />
                              </div>
                            )}
                          </div>
                        </div>
                        {!isUploading && !isSelectingDropboxFiles && (
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

          {(isUploading) && (
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}