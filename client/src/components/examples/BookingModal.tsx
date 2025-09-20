import BookingModal from '../BookingModal';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function BookingModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4">
      <Button onClick={() => setIsOpen(true)}>
        Open Booking Modal
      </Button>
      <BookingModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        salonName="Artisan Theory Salon" 
      />
    </div>
  );
}