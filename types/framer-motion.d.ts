// framer-motion.d.ts
import { AnimationPlaybackControls as OriginalAnimationPlaybackControls } from 'framer-motion';

// Assuming ProgressTimeline is a type from 'framer-motion', if it's not exported by the library,
// you might need to define it yourself or use any if the type is not known.
// If ProgressTimeline is known and exported, import it from 'framer-motion'
// import { ProgressTimeline } from 'framer-motion';

// If ProgressTimeline is not exported, you might need to define it yourself.
// This is a placeholder and should be replaced with the actual type details if available.
type ProgressTimeline = any; // Replace 'any' with the actual type structure

export interface AnimationPlaybackControls extends OriginalAnimationPlaybackControls {
  attachTimeline?: (
    timeline: ProgressTimeline,
    fallback?: (animation: AnimationPlaybackControls) => VoidFunction
  ) => VoidFunction;
}