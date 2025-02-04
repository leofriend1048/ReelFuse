import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { createClient } from '@/utils/supabase/client';

interface TagFilterProps {
  brand: string;
  onTagSelect: (tag: string | null) => void;
  selectedTag: string | null;
}
const supabase = createClient();

export function TagFilter({ brand, onTagSelect, selectedTag }: TagFilterProps) {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('name')
        .eq('brand', brand)
        .order('name');
      
      if (!error && data) {
        setTags(data.map(tag => tag.name));
      }
    };

    fetchTags();
  }, [brand]);

  return (
    <Select
      value={selectedTag || 'all'}
      onValueChange={(value) => onTagSelect(value === 'all' ? null : value)}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Filter by tag" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Tags</SelectItem>
        {tags.map(tag => (
          <SelectItem key={tag} value={tag}>
            {tag}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}