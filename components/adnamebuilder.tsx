'use client'

import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { CopyIcon } from '@radix-ui/react-icons';
import { Label } from '@/components/ui/label';
import { insertAdData } from '@/app/supabaseService';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/app/supabaseService';
import { DatePicker } from './datepicker';
const supabaseUrl = 'https://uwfllbptpdqoovbeizya.supabase.co'; // Replace with your actual Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZmxsYnB0cGRxb292YmVpenlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk3NTA2NzUsImV4cCI6MjAxNTMyNjY3NX0._fCp3gc4vEDj9k5jme3Jo_cSA3tPhzOPcodcH3Gb65w';

const AdNameBuilderComponent = () => {
  const [concept, setConcept] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Adjust the type

  const adnameInputRef = useRef<HTMLInputElement>(null);

  const handleCopyButtonClick = async () => {
    const adnameValue = `${concept}-${selectedDate ? format(selectedDate, 'MMddyyyy') : ''}`;
    
    if (adnameInputRef.current) {
      adnameInputRef.current.value = adnameValue;
      adnameInputRef.current.select();
      document.execCommand('copy');

     // Assuming selectedDate can be null, you need to handle it
const formattedDate = selectedDate ? selectedDate : new Date();

// Insert data into Supabase using the insertAdData function
const { data, error } = await insertAdData(adnameValue, formattedDate, concept);


      // Handle the response as needed
      if (error) {
        console.error('Error inserting data into Supabase:', error);
      } else {
        console.log('Data inserted successfully:', data);
      }
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Ad Name Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="concept"
            placeholder="Concept Name"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
          />
          <DatePicker onSelectDate={(date) => setSelectedDate(date)} />
        </CardContent>
        <CardFooter className="flex w-full max-w-sm items-center space-x-2">

          <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Generate ✨</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copy Ad Name</DialogTitle>
          <DialogDescription>
Copy the ad name to use in ads manager          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
            type="adname"
            placeholder="Ad Name"
            ref={adnameInputRef}
              id="link"
            />
          </div>
          <Button type="button" onClick={handleCopyButtonClick} size="sm" className="px-3">
            <span className="sr-only">Copy</span>
            <CopyIcon className="h-4 w-4" />
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>



        </CardFooter>
      </Card>
    </div>
  );
};

export default AdNameBuilderComponent;
