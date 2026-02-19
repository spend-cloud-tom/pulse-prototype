import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, X } from 'lucide-react';

interface ImageThumbnailProps {
  src: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const heightClasses = {
  xs: 'h-12 w-12',
  sm: 'h-16 w-16',
  md: 'h-32',
  lg: 'h-48',
};

const widthClasses = {
  xs: 'w-12',
  sm: 'w-16',
  md: 'w-full',
  lg: 'w-full',
};

const ImageThumbnail = ({ src, alt = 'Attachment', size = 'md', className = '' }: ImageThumbnailProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Constrained thumbnail container */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative ${heightClasses[size]} ${widthClasses[size]}
          rounded-lg overflow-hidden 
          cursor-pointer
          transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-hero-teal/50
          shrink-0
          ${className}
        `}
        aria-label={`View full image: ${alt}`}
      >
        {/* The image with object-fit: cover */}
        <img
          src={src}
          alt={alt}
          className={`
            w-full h-full object-cover
            transition-opacity duration-150
            ${isHovered ? 'opacity-90' : 'opacity-100'}
          `}
        />

        {/* Inner shadow ring to prevent background bleed on white images */}
        <div 
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}
        />

        {/* Hover overlay with zoom icon (pliancy indicator) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/10 flex items-center justify-center"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-sm">
                <ZoomIn className="h-4 w-4 text-slate-700" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Full-screen lightbox overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Full image - uncropped, natural aspect ratio */}
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={src}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageThumbnail;
