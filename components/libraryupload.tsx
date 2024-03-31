'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Input } from './ui/input';
import { Button } from "@/components/ui/button"
import { Textarea } from './ui/textarea';
import { toast } from "sonner"
import { createClient } from '@/utils/supabase/client';
import { useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
  import { Upload } from "lucide-react"

  

const supabase = createClient();

const LibraryUpload = () => {
  
    const formSchema = z.object({
      clipdescription: z.string().min(1, 'Description of clip is required').trim(),
      file: z.any().refine((file) => file?.length === 1, 'File is required.')
                .refine((file) => file[0]?.size <= 6000000, 'Max file size is 6MB.'),
    });
  
    const form = useForm<z.infer<typeof formSchema>>({
      defaultValues: {
        clipdescription: '',
        file: undefined,
      },
      mode: 'onChange',
      resolver: zodResolver(formSchema),
    });

    const fileRef = form.register('file', { required: true });

    const uploadFile = async (file, clipDescription) => {
        const fileExtension = file.name.split('.').pop();
        const filePath = `${Date.now()}.${fileExtension}`;
        console.log('File path:', filePath);
        const { error: uploadError } = await supabase.storage.from('modular_clips').upload(filePath, file);
        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const publicURL = `https://uwfllbptpdqoovbeizya.supabase.co/storage/v1/object/public/modular_clips/${filePath}`;
        console.log('Public URL:', publicURL);

        const { error } = await supabase.from('modular_clips').insert([
          { video_url: publicURL, description: clipDescription },
        ]);

        if (error) {
            console.error('Error inserting data:', error.message);
            throw new Error(error.message);
          } else {
            window.location.reload(); 
            toast("New Video Uploaded");
          }
      };

    const onSubmit = async (values) => {
        try {
            const files = values.file;
            if (files && files.length > 0) {
                const file = files[0];
                await uploadFile(file, values.clipdescription);
            } else {
            }
        } catch (error) {
            console.error('Error during form submission:', error);
        }
    };

    return (
        <Dialog>
  <DialogTrigger>
  <Button variant="outline">
        <Upload className="mr-2 h-4 w-4"/>Upload New Video
      </Button>
  </DialogTrigger>
  <DialogContent>
    <h3 className="text-3xl font-medium leading-none tracking-tight text-center pb-6">Upload New Video</h3>
  <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="pt-4 space-y-2">
            <label className="text-sm font-medium">Description of clip</label>
                <Textarea {...form.register('clipdescription')} className="ring-offset-white  focus-visible:ring-0 focus-visible:ring-slate-950 focus-visible:ring-offset-0" placeholder="Your detailed description goes here ..." /> 
            </div>
            <div className="pt-4 space-y-2">
                <label className="text-sm font-medium">Video</label>
                <Input type="file" {...fileRef} name="file" />
            </div>
            <div className="pt-4">
            <Button className="w-full" type="submit">
                Submit
            </Button>
            </div>
        </form>
  </DialogContent>
</Dialog>
    );
};
  
export default LibraryUpload;
