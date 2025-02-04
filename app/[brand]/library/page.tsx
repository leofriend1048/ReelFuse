"use client"
import React, { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Navbar from '@/components/navbar';
import { Card, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Trash2, X, Loader2, Search, ChevronLeft, ChevronRight, Check, Link as LinkIcon } from 'lucide-react';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/client';
import LibraryUpload from '@/components/libraryupload';
import DownloadButton from '@/components/downloadbutton';
import { Skeleton } from '@/components/ui/skeleton';
import { LibraryDropdown } from '@/components/LibraryDropDown';
import VideoPlayer from '@/components/video-player';
import { VideoGrid } from '@/components/video-grid';
import { TotalFootage } from '@/components/total-footage';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from 'framer-motion';
import { CreatorSelect } from '@/components/creator-select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TagFilter } from '@/components/tag-filter';
import { TagInput } from '@/components/tag-input';

interface Video {
  video_url: string;
  description: string;
  creator: string | null;
  poster_url: string;
  duration: string;
  mux_playback_id: string;
  blur_data_url: string;
  mux_asset_id: string;
  tags: string[];
}

const FloatingActionBar: React.FC<{
  selectedCount: number;
  onDelete: () => void;
  onUpdateCreator: (creator: string) => void;
  creators: string[];
}> = ({ selectedCount, onDelete, onUpdateCreator, creators }) => (
  <motion.div
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 100, opacity: 0 }}
    className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-primary-foreground rounded-lg shadow-md p-4 flex items-center space-x-4"
  >
    <span className="font-semibold">{selectedCount} videos selected</span>
    <Select onValueChange={onUpdateCreator}>
      <SelectTrigger className="w-[180px] bg-primary-foreground text-primary">
        <SelectValue placeholder="Set Creator" />
      </SelectTrigger>
      <SelectContent>
        {creators.map(creator => (
          <SelectItem key={creator} value={creator}>
            {creator}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="bg-destructive-foreground text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Selected
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action is irreversible. This will permanently delete the selected videos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </motion.div>
);

export default function Chat() {
  const { brand } = useParams();
  const [videoData, setVideoData] = useState<Video[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [creators, setCreators] = useState<string[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const supabase = createClient();
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const totalPages = Math.ceil(totalVideos / itemsPerPage);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const urlVideoUrl = searchParams.get('video');
    if (urlVideoUrl && videoData.length > 0) {
      const videoIndex = videoData.findIndex(v => v.video_url === decodeURIComponent(urlVideoUrl));
      if (videoIndex !== -1) {
        setCurrentVideoIndex(videoIndex);
        setIsDialogOpen(true);
      }
    }
  }, [searchParams, videoData]);

  const handleCopyLink = useCallback((videoUrl: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const baseUrl = window.location.href.split('?')[0];
    const shareUrl = `${baseUrl}?video=${encodeURIComponent(videoUrl)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Link copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  }, []);

  const handleVideoSelect = useCallback((videoUrl: string, index: number, isShiftKey: boolean) => {
    setSelectedVideos(prev => {
      const newSet = new Set(prev);
      if (isShiftKey && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        for (let i = start; i <= end; i++) {
          newSet.add(videoData[i].video_url);
        }
      } else {
        if (newSet.has(videoUrl)) {
          newSet.delete(videoUrl);
        } else {
          newSet.add(videoUrl);
        }
        setLastSelectedIndex(index);
      }
      return newSet;
    });
  }, [lastSelectedIndex, videoData]);

  const handleBatchDelete = async () => {
    if (selectedVideos.size === 0) return;

    try {
      for (const videoUrl of Array.from(selectedVideos)) {
        const filePath = videoUrl.split('/storage/v1/object/public/modular_clips/')[1];
        
        if (filePath) {
          const { error: storageError } = await supabase
            .storage
            .from('modular_clips')
            .remove([filePath]);

          if (storageError) throw storageError;
        }

        const { error: dbError } = await supabase
          .from('modular_clips')
          .delete()
          .eq('video_url', videoUrl);

        if (dbError) throw dbError;
      }

      setVideoData(prev => prev.filter(v => !selectedVideos.has(v.video_url)));
      setTotalVideos(prev => prev - selectedVideos.size);
      setSelectedVideos(new Set());
      setIsSelectionMode(false);
      setLastSelectedIndex(null);
      
      toast.success(`Successfully deleted ${selectedVideos.size} videos`);
    } catch (error) {
      console.error("Error in batch delete:", error);
      toast.error("Failed to delete some videos");
    }
  };

  const handleBatchCreatorUpdate = async (creator: string) => {
    if (selectedVideos.size === 0) return;

    try {
      const { error } = await supabase
        .from('modular_clips')
        .update({ creator })
        .in('video_url', Array.from(selectedVideos));

      if (error) throw error;

      setVideoData(prev => 
        prev.map(v => 
          selectedVideos.has(v.video_url) 
            ? { ...v, creator } 
            : v
        )
      );
      
      setSelectedVideos(new Set());
      setIsSelectionMode(false);
      setLastSelectedIndex(null);
      
      toast.success(`Updated creator for ${selectedVideos.size} videos`);
    } catch (error) {
      console.error("Error in batch creator update:", error);
      toast.error("Failed to update creators");
    }
  };

  const handleVideoClick = (index: number) => {
    if (!isSelectionMode) {
      setCurrentVideoIndex(index);
      setIsDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setCurrentVideoIndex(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('video');
    window.history.replaceState({}, '', url);
  };

  const handlePreviousVideo = () => {
    setCurrentVideoIndex((prevIndex) =>
      prevIndex !== null && prevIndex > 0 ? prevIndex - 1 : prevIndex
    );
  };

  const handleNextVideo = () => {
    setCurrentVideoIndex((prevIndex) =>
      prevIndex !== null && prevIndex < videoData.length - 1 ? prevIndex + 1 : prevIndex
    );
  };

  const handleSearch = async (term: string) => {
    setIsSearching(true);
    try {
      if (term.trim()) {
        const result = await openai.embeddings.create({
          input: term,
          model: "text-embedding-3-small",
        });
        const [{ embedding }] = result.data;

        const { data, error } = await supabase
          .rpc("match_modular_clips2", {
            query_embedding: embedding,
            match_threshold: 0.20,
          })
          .eq('brand', brand)
          .limit(20);

        if (error) throw error;
        setVideoData(data || []);
      } else {
        getVideos();
      }
    } catch (error) {
      console.error("Error searching videos:", error);
      toast.error("Failed to search videos");
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = (term: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => handleSearch(term), 500);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    getVideos();
  };

  const handleUpdate = async (video: Video) => {
    try {
      const { error } = await supabase
        .from('modular_clips')
        .update({ 
          description: video.description,
          tags: video.tags 
        })
        .eq('video_url', video.video_url);

      if (error) throw error;

      toast.success("Video updated successfully");
    } catch (error) {
      console.error("Error updating video:", error);
      toast.error("Failed to update video");
    }
  };

  const handleDelete = async (video: Video) => {
    try {
      const filePath = video.video_url.split('/storage/v1/object/public/modular_clips/')[1];
      
      if (filePath) {
        const { error: storageError } = await supabase
          .storage
          .from('modular_clips')
          .remove([filePath]);

        if (storageError) throw storageError;
      }

      const { error: dbError } = await supabase
        .from('modular_clips')
        .delete()
        .eq('video_url', video.video_url);

      if (dbError) throw dbError;

      const updatedVideoData = videoData.filter((v) => v.video_url !== video.video_url);
      setVideoData(updatedVideoData);
      setTotalVideos((prev) => prev - 1);

      if (currentVideoIndex !== null) {
        if (currentVideoIndex >= updatedVideoData.length) {
          setCurrentVideoIndex(updatedVideoData.length - 1);
        }
      }

      handleDialogClose();
      toast.success("Video deleted successfully");
    } catch (error) {
      console.error("Error in handleDelete function:", error);
      toast.error("Failed to delete video and file");
    }
  };

  const getVideos = async () => {
    setIsLoading(true);
    try {
      // First, fetch only the essential data for the grid view
      const query = supabase
        .from('modular_clips')
        .select('video_url, poster_url, duration, mux_playback_id, blur_data_url', { count: 'exact' })
        .eq('brand', brand);

      if (selectedCreator === "null") {
        query.is('creator', null);
      } else if (selectedCreator) {
        query.eq('creator', selectedCreator);
      }

      if (selectedTag) {
        query.contains('tags', [selectedTag]);
      }

      const { data, count, error } = await query
        .order('created_timestamp', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      
      setVideoData(data as Video[]); 
      if (count !== null) setTotalVideos(count);
      
      // Set loading to false once we have the essential data
      setIsLoading(false);

      // Then fetch the full data in the background
      const fullDataQuery = supabase
        .from('modular_clips')
        .select('*')
        .eq('brand', brand)
        .in('video_url', data.map(v => v.video_url));

      const { data: fullData, error: fullDataError } = await fullDataQuery;

      if (fullDataError) throw fullDataError;

      // Update the video data with the full information
      setVideoData(prevData => 
        prevData.map(video => ({
          ...video,
          ...fullData.find(v => v.video_url === video.video_url)
        }))
      );

    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load videos");
      setIsLoading(false);
    }
  };

  const getUniqueCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('modular_clips')
        .select('creator')
        .eq('brand', brand);
  
      if (error) throw error;
  
      const uniqueCreators: string[] = Array.from(
        new Set(data.map((clip: { creator: string | null }) => clip.creator).filter(Boolean) as string[])
      );
  
      setCreators(uniqueCreators);
    } catch (error) {
      console.error("Error fetching creators:", error);
    }
  };

  useEffect(() => {
    if (brand) {
      getUniqueCreators();
    }
  }, [brand]);

  useEffect(() => {
    if (brand) {
      getVideos();
    }
  }, [brand, currentPage, selectedCreator, selectedTag]);

  return (
    <section className="flex flex-col items-center p-20 space-y-10">
      <Navbar />
      <CardTitle>Modular Video Library</CardTitle>

      <div className="w-full max-w-7xl flex flex-row items-center justify-between">
        <div className="flex flex-row space-x-8">
          <LibraryUpload />
          <div className="relative">
            <Input
              type="text"
              placeholder="What can I find for you today?"
              value={searchTerm}
              className="pr-20 w-80"
              onChange={(e) => {
                setSearchTerm(e.target.value);
                debouncedSearch(e.target.value);
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
              {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
              {searchTerm && !isSearching && (
                <button
                  onClick={handleClearSearch}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <CreatorSelect
            creators={creators}
            selectedCreator={selectedCreator}
            onValueChange={setSelectedCreator}
          />

          

          <Button
            variant={isSelectionMode ? "secondary" : "outline"}
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (!isSelectionMode) {
                setSelectedVideos(new Set());
                setLastSelectedIndex(null);
              }
            }}
          >
            {isSelectionMode ? "Cancel Selection" : "Bulk Select"}
          </Button>
        </div>
        <TotalFootage brand={brand as string} />
      </div>

      <VideoGrid
        videos={videoData}
        onVideoClick={handleVideoClick}
        selectedVideos={selectedVideos}
        onVideoSelect={handleVideoSelect}
        isSelectionMode={isSelectionMode}
        onCopyLink={handleCopyLink}
        isLoading={isLoading}
      />

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) {
                  setCurrentPage((p) => p - 1);
                }
              }}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(i + 1);
                }}
                className={currentPage === i + 1 ? 'bg-primary text-primary-foreground' : ''}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) {
                  setCurrentPage((p) => p + 1);
                }
              }}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
        {currentVideoIndex !== null && (
          <DialogContent className="flex h-[90vh] w-[70vw] max-w-none bg-white p-0">
            <button
              onClick={handlePreviousVideo}
              disabled={currentVideoIndex === 0}
              className="self-center p-4"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentVideoIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{
                  duration: 0.15,
                  ease: "easeInOut"
                }}
                className="flex w-full h-full"
              >
                <div className="flex w-2/3 h-full items-center justify-center bg-white">
                  <div className="flex h-full w-full max-w-96 items-center justify-center">
                    <div className="w-full">
                      <VideoPlayer
                        playbackId={videoData[currentVideoIndex].mux_playback_id}
                        placeholder={videoData[currentVideoIndex].blur_data_url}
                      />
                    </div>
                  </div>
                </div>
                <div className="w-1/3 bg-white p-8 space-y-4 overflow-y-auto border-l">
                  <div className="flex justify-between items-center">
                    <DialogTitle className="text-lg">Edit Details</DialogTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(videoData[currentVideoIndex].video_url)}
                      className="flex items-center gap-2"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Copy Link
                    </Button>
                  </div>
                  <div className="grid w-full gap-1.5">
                    <LibraryDropdown video_url={videoData[currentVideoIndex].video_url} />
                    <Label>Tags</Label>
                    <TagInput
                      selectedTags={videoData[currentVideoIndex].tags || []}
                      onChange={(tags) => {
                        const updatedVideoData = [...videoData];
                        updatedVideoData[currentVideoIndex].tags = tags;
                        setVideoData(updatedVideoData);
                      }}
                      brand={brand as string}
                    />
                    <Label htmlFor={`message-${videoData[currentVideoIndex].video_url}`}>
                      Description of clip
                    </Label>
                    <Textarea
                      placeholder="Enter description here..."
                      id={`message-${videoData[currentVideoIndex].video_url}`}
                      value={videoData[currentVideoIndex].description}
                      onChange={(e) => {
                        const updatedVideoData = [...videoData];
                        updatedVideoData[currentVideoIndex].description = e.target.value;
                        setVideoData(updatedVideoData);
                      }}
                      className="h-96"
                    />
                  </div>
                  <div className="w-full mb-2">
                    <Button
                      className="w-full"
                      onClick={() => handleUpdate(videoData[currentVideoIndex])}
                    >
                      Save Changes
                    </Button>
                  </div>
                  <div className="w-full">
                    <DownloadButton file={videoData[currentVideoIndex].video_url} />
                  </div>
                  <div className="w-full">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action is irreversible. Deleting this video will remove it permanently.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(videoData[currentVideoIndex])}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <button
              onClick={handleNextVideo}
              disabled={currentVideoIndex === videoData.length - 1}
              className="self-center p-4"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </DialogContent>
        )}
      </Dialog>

      <AnimatePresence>
        {isSelectionMode && selectedVideos.size > 0 && (
          <FloatingActionBar
            selectedCount={selectedVideos.size}
            onDelete={handleBatchDelete}
            onUpdateCreator={handleBatchCreatorUpdate}
            creators={creators}
          />
        )}
      </AnimatePresence>
    </section>
  );
}