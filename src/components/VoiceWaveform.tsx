import { motion } from 'framer-motion';

interface VoiceWaveformProps {
  isActive: boolean;
  barCount?: number;
}

/**
 * Animated voice waveform visualizer with pulsing bars.
 * Shows when voice input is active — demo-friendly visual feedback.
 */
const VoiceWaveform = ({ isActive, barCount = 5 }: VoiceWaveformProps) => {
  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center gap-1 h-6">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-white rounded-full"
          initial={{ height: 8 }}
          animate={{
            height: [8, 20, 12, 24, 8],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default VoiceWaveform;
