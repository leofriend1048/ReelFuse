import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCallback, useRef } from 'react';

interface LibraryDropdownProps {
  video_url: string;
  className?: string;
}

const supabase = createClient();

// Move cache outside component to persist between renders
const creatorsCache = new Map<string, string[]>();
const fetchPromises = new Map<string, Promise<string[]>>();

const fetchAllCreators = async (): Promise<string[]> => {
  const cacheKey = 'creators';
  
  if (creatorsCache.has(cacheKey)) {
    return creatorsCache.get(cacheKey)!;
  }

  const existingPromise = fetchPromises.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = (async () => {
    try {
      const { data, error } = await supabase
        .from('modular_clips')
        .select('creator');

      if (error) throw error;
      if (!data) return [];

      const uniqueCreators = Array.from(new Set(
        data
          .map(clip => clip.creator)
          .filter((creator): creator is string => typeof creator === 'string')
      )).sort();

      creatorsCache.set(cacheKey, uniqueCreators);
      return uniqueCreators;
    } catch (error) {
      console.error('Error fetching creators:', error);
      return [];
    } finally {
      fetchPromises.delete(cacheKey);
    }
  })();

  fetchPromises.set(cacheKey, promise);
  return promise;
};

export function LibraryDropdown({ video_url, className }: LibraryDropdownProps) {
  const [creators, setCreators] = React.useState<string[]>([]);
  const [selectedCreator, setSelectedCreator] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialLoadDone = useRef(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const filteredCreators = React.useMemo(() => {
    if (!searchQuery) return creators;
    const query = searchQuery.toLowerCase();
    return creators.filter((creator) => creator.toLowerCase().includes(query));
  }, [creators, searchQuery]);

  const fetchCurrentCreator = useCallback(async () => {
    if (initialLoadDone.current) return;
    
    try {
      const { data, error } = await supabase
        .from('modular_clips')
        .select('creator')
        .eq('video_url', video_url)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedCreator(data.creator);
      }
    } catch (error) {
      console.error('Error fetching current creator:', error);
    } finally {
      initialLoadDone.current = true;
    }
  }, [video_url]);

  const loadCreators = useCallback(async () => {
    try {
      const fetchedCreators = await fetchAllCreators();
      setCreators(fetchedCreators);
    } catch (error) {
      console.error('Error loading creators:', error);
      toast.error('Failed to load creators');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCurrentCreator();
    loadCreators();
  }, [fetchCurrentCreator, loadCreators]);

  React.useEffect(() => {
    if (open && inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setSearchQuery(e.target.value);
  };

  const handleCreatorChange = async (value: string) => {
    if (updating) return;
    setUpdating(true);

    try {
      const newCreator = value === "none" ? null : value;
      
      const { error } = await supabase
        .from('modular_clips')
        .update({ creator: newCreator })
        .eq('video_url', video_url);

      if (error) throw error;

      setSelectedCreator(newCreator);
      setSearchQuery("");
      toast.success(`Creator ${newCreator ? `set to "${newCreator}"` : 'removed'}`);
      setOpen(false);
    } catch (error) {
      console.error('Error updating creator:', error);
      toast.error('Failed to update creator');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNewCreator = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() && !filteredCreators.includes(searchQuery.trim())) {
      e.preventDefault();
      e.stopPropagation();
      
      if (updating) return;
      setUpdating(true);

      try {
        const newCreator = searchQuery.trim();
        const { error } = await supabase
          .from('modular_clips')
          .update({ creator: newCreator })
          .eq('video_url', video_url);

        if (error) throw error;

        setSelectedCreator(newCreator);
        
        // Update cache with new creator
        const currentCreators = creatorsCache.get('creators') || [];
        const updatedCreators = [...currentCreators, newCreator].sort();
        creatorsCache.set('creators', updatedCreators);
        setCreators(updatedCreators);
        
        toast.success(`Added new creator "${newCreator}"`);
        setSearchQuery("");
        setOpen(false);
      } catch (error) {
        console.error('Error adding new creator:', error);
        toast.error('Failed to add new creator');
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value={selectedCreator || "none"}
      onValueChange={handleCreatorChange}
      disabled={updating}
    >
      <SelectTrigger className={cn("w-[220px] relative", className)}>
        <SelectValue placeholder="Select Creator" />
      </SelectTrigger>
      <SelectContent className="w-[220px]">
        <div
          ref={searchContainerRef}
          className="flex items-center px-3 pb-2"
          onClick={handleSearchClick}
        >
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            placeholder="Search or add new..."
            value={searchQuery}
            onChange={handleSearchInput}
            onKeyDown={handleAddNewCreator}
            className="h-8"
            disabled={updating}
          />
        </div>
        <SelectGroup>
          <SelectLabel className="px-3 py-1.5 text-xs font-medium">Creators</SelectLabel>
          <ScrollArea className="h-[200px]">
            <SelectItem value="none" className="cursor-pointer">
              No Creator
            </SelectItem>
            {loading ? (
              <p className="text-sm text-muted-foreground p-2 text-center">
                Loading creators...
              </p>
            ) : (
              filteredCreators.map((creator) => (
                <SelectItem
                  key={creator}
                  value={creator}
                  className="cursor-pointer"
                >
                  {creator}
                </SelectItem>
              ))
            )}
            {!loading && filteredCreators.length === 0 && (
              <p className="text-sm text-muted-foreground p-2 text-center">
                {searchQuery ? 'Press Enter to add new creator' : 'No creators found'}
              </p>
            )}
          </ScrollArea>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}