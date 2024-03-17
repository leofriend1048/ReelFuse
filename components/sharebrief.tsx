"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


export function ShareBrief() {
  // Function to copy the current URL to the clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.toString())
      .then(() => {
        // Success feedback, consider showing a message to the user
        console.log('Link copied to clipboard!');
      })
      .catch(err => {
        // Error handling, consider showing an error message to the user
        console.error('Failed to copy the link: ', err);
      });
  };

  return (
      <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full hover:bg-gray-700 hover:text-white transition-all duration-200">Share</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share brief</DialogTitle>
          <DialogDescription>
          Anyone with the link can view this brief.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              value={window.location.toString()}
              readOnly
            />
          </div>
          <Button onClick={copyToClipboard} type="submit" size="sm" className="px-3">
            <span className="sr-only">Copy</span>
            <Copy className="h-4 w-4" />
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
  );
}