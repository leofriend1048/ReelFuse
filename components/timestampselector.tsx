import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sethooktimestamp } from '@/components/sethooktimestamp';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from './ui/button';

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -1000 : 1000,
        opacity: 0,
    }),
};

const Timestampselector = ({ originalFileUrl, isOpen, onClose }: { originalFileUrl: string, isOpen: boolean, onClose: () => void }) => {
    const [page, setPage] = useState(0);
    const [prevPage, setPrevPage] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const paginate = () => {
        const newPage = page === 0 ? 1 : 0;
        setPrevPage(page);
        setPage(newPage);
    };

    const direction = page > prevPage ? 1 : -1;

    return (
        <div>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTrigger asChild>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select Timestamps</DialogTitle>
                    </DialogHeader>
                    {isMounted && (
                        <AnimatePresence initial={false} custom={direction} mode="wait">
                            <motion.div
                                key={page}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: 'spring', stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                            >
                                <Sethooktimestamp paginate={paginate} originalFileUrl={originalFileUrl} />
                            </motion.div>
                        </AnimatePresence>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Timestampselector;