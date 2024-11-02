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
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CreatorSelectProps {
  creators: string[];
  selectedCreator: string | null;
  onValueChange: (value: string) => void;
  className?: string;
}

export function CreatorSelect({ creators, selectedCreator, onValueChange, className }: CreatorSelectProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredCreators = React.useMemo(() => {
    return creators.filter((creator) =>
      creator.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [creators, searchQuery]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchQuery(e.target.value);
  };

  React.useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  const handleSelect = (value: string) => {
    if (value === "all") {
      setSearchQuery("");
      onValueChange("");
    } else {
      onValueChange(value);
    }
  };

  return (
    <Select 
      open={open} 
      onOpenChange={setOpen}
      value={selectedCreator || "all"}
      onValueChange={handleSelect}
    >
      <SelectTrigger className={cn("w-[220px] relative", className)}>
        <SelectValue placeholder="Filter by creator" />
      </SelectTrigger>
      <SelectContent 
        className="w-[220px]"
        onPointerDownOutside={(e) => {
          if ((e.target as HTMLElement).closest('input')) {
            e.preventDefault();
          }
        }}
        // Removed onInteractOutside prop
      >
        <div 
          className="flex items-center px-3 pb-2" 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            placeholder="Search creators..."
            value={searchQuery}
            onChange={handleSearchInput}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            className="h-8"
          />
        </div>
        <SelectGroup>
          <SelectLabel className="px-3 py-1.5 text-xs font-medium">Creators</SelectLabel>
          <ScrollArea className="h-[200px]">
            <SelectItem value="all" className="cursor-pointer">
              All Creators
            </SelectItem>
            {filteredCreators.map((creator) => (
              <SelectItem 
                key={creator} 
                value={creator}
                className="cursor-pointer"
              >
                {creator}
              </SelectItem>
            ))}
            {filteredCreators.length === 0 && searchQuery && (
              <p className="text-sm text-muted-foreground p-2 text-center">
                No creators found
              </p>
            )}
          </ScrollArea>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}