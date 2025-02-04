import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface TagInputProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  brand: string;
}
const supabase = createClient();

export function TagInput({ selectedTags, onChange, brand }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('name')
        .eq('brand', brand)
        .order('name');
      
      if (!error && data) {
        setSuggestions(data.map(tag => tag.name));
      }
    };

    fetchTags();
  }, [brand]);

  const handleTagAdd = async (tagName: string) => {
    const normalizedTag = tagName.trim().toLowerCase();
    if (!normalizedTag || selectedTags.includes(normalizedTag)) return;

    // Add to database if it doesn't exist
    await supabase
      .from('tags')
      .upsert({ name: normalizedTag, brand }, { onConflict: 'name,brand' });

    onChange([...selectedTags, normalizedTag]);
    setInputValue('');
    setIsOpen(false);
  };

  const handleTagRemove = (tagToRemove: string) => {
    onChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const filteredSuggestions = suggestions.filter(
    tag => tag.toLowerCase().includes(inputValue.toLowerCase()) && !selectedTags.includes(tag)
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map(tag => (
          <Badge key={tag} variant="secondary" className="px-2 py-1">
            {tag}
            <button
              onClick={() => handleTagRemove(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Command className="border rounded-md">
        <Command.Input
          value={inputValue}
          onValueChange={setInputValue}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue) {
              e.preventDefault();
              handleTagAdd(inputValue);
            }
          }}
          placeholder="Add tags..."
          className="w-full px-3 py-2"
        />
        {isOpen && inputValue && (
          <Command.List className="border-t max-h-40 overflow-y-auto">
            {filteredSuggestions.map(tag => (
              <Command.Item
                key={tag}
                onSelect={() => handleTagAdd(tag)}
                className="px-3 py-2 hover:bg-accent cursor-pointer"
              >
                {tag}
              </Command.Item>
            ))}
            {inputValue && !filteredSuggestions.includes(inputValue) && (
              <Command.Item
                onSelect={() => handleTagAdd(inputValue)}
                className="px-3 py-2 hover:bg-accent cursor-pointer"
              >
                Create &ldquo;{inputValue}&rdquo;
              </Command.Item>
            )}
          </Command.List>
        )}
      </Command>
    </div>
  );
}