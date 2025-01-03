import { useState } from 'react';
import { Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DownloadButton({ file }: { file: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const getFileName = (url: string) => { 
    // Extract the file name from the URL
    return url.substring(url.lastIndexOf('/') + 1);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="w-full"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        try {
          const response = await fetch(file);
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          // Use the getFileName function to set the download attribute to the original file name
          link.setAttribute('download', getFileName(file)); 
          document.body.appendChild(link);
          link.click();
          link.remove();
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setIsLoading(false);
        }
      }}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Downloading
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2 inline-block" />Download
        </>
      )}
    </Button>
  );
}