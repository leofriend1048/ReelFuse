"use client"

import { useRef, useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function Sethooktimestamp({ paginate, originalFileUrl }: { paginate: () => void; originalFileUrl: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [frameRate, setFrameRate] = useState(24);

    useEffect(() => {
        if (typeof window !== 'undefined') { 
            const handleKeyPress = (event: KeyboardEvent) => {
                if (event.key === 'ArrowRight') {
                    handleFrameChange('forward');
                } else if (event.key === 'ArrowLeft') {
                    handleFrameChange('backward');
                }
            };

            window.addEventListener('keydown', handleKeyPress);
            return () => window.removeEventListener('keydown', handleKeyPress);
        }
    }, [frameRate]);

    const handleFrameChange = (direction: string) => {
        const step = 1 / frameRate;
        if (videoRef.current) {
            if (direction === 'forward') {
                videoRef.current.currentTime += step;
            } else {
                videoRef.current.currentTime -= step;
            }
            setCurrentTime(Math.round(videoRef.current.currentTime * 100) / 100);
        }
    };

    useEffect(() => {
        console.log(`Current Time: ${currentTime.toFixed(2)} seconds`);
    }, [currentTime]);

    useEffect(() => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    }, [videoRef]);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleFrameRateChange = (newFrameRate: string) => {
        const parsedFrameRate = parseInt(newFrameRate);
        setFrameRate(parsedFrameRate);
        console.log(`Frame Rate: ${parsedFrameRate}`);
    };

    const handlePause = () => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
    };

    const handlePlay = () => {
        if (videoRef.current) {
            videoRef.current.play();
        }
    };

    return (
        <div className="flex flex-col justify-center items-center my-10 space-y-8">
            <video
                ref={videoRef}
                controls
                className="w-auto max-h-[450px]"
                poster=""
                preload='auto'
                src={originalFileUrl} 
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onTimeUpdate={handleTimeUpdate}
            >
                Your browser does not support the video tag.
            </video>

            <Select onValueChange={handleFrameRateChange}>
                <SelectTrigger className="w-[180px]">{`${frameRate} fps`}</SelectTrigger>
                <SelectContent>
                    <SelectItem value="24">24 fps</SelectItem>
                    <SelectItem value="30">30 fps</SelectItem>
                    <SelectItem value="60">60 fps</SelectItem>
                </SelectContent>
            </Select>

            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => handleFrameChange('backward')}>
                    <ArrowLeft />
                </Button>
                <div className="text-gray-500 dark:text-gray-400">
                    <span id="current-time">{currentTime.toFixed(2)}s</span> / <span id="duration">{duration.toFixed(2)}s</span>
                </div>
                <Button variant="outline" onClick={() => handleFrameChange('forward')}>
                    <ArrowRight />
                </Button>
                <Button onClick={() => {
                    const hooktimestamp = currentTime.toFixed(2);
                    localStorage.setItem('hooktimestamp', hooktimestamp);
                    console.log(localStorage.getItem('hooktimestamp'));
                    toast(`${hooktimestamp}s Hook Timestamp Selected`);
                    paginate();  
                }}>Set Hook Timestamp</Button>
            </div>
        </div>
    );
};