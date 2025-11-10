import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductOverlayProps {
  icon: React.ReactNode;
  label: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  isBestMatch?: boolean;
  productImage?: string;
  delay?: number;
}

export default function ProductOverlay({
  icon,
  label,
  position,
  isBestMatch = false,
  productImage,
  delay = 0,
}: ProductOverlayProps) {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <motion.div
      className={cn(
        'absolute z-10',
        positionClasses[position]
      )}
      initial={{ opacity: 0, scale: 0.5, y: position.includes('top') ? -20 : 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: delay / 1000,
        type: 'spring',
        stiffness: 200,
        damping: 15
      }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="relative">
        {productImage ? (
          <div className="w-20 h-20 rounded-2xl bg-white shadow-lg overflow-hidden border-2 border-white">
            <img 
              src={productImage} 
              alt={label}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-2 border-white">
            <div className="text-gray-700">
              {icon}
            </div>
          </div>
        )}
        
        {isBestMatch && (
          <motion.div
            className="absolute -top-2 -right-2 bg-green-500 text-white px-2 py-1 rounded-full flex items-center gap-1 shadow-lg text-xs font-medium"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: (delay + 300) / 1000, type: 'spring' }}
          >
            <Check className="h-3 w-3" />
            Best match
          </motion.div>
        )}
        
        <div className="mt-2 text-center">
          <span className="text-xs font-medium text-gray-900 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
            {label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
