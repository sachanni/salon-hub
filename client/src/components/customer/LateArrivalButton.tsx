import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { LateArrivalModal } from "./LateArrivalModal";

interface LateArrivalButtonProps {
  bookingId: string;
  bookingTime: string;
  bookingDate: string;
  salonName: string;
  bookingStatus: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onSuccess?: () => void;
}

function getISTDate(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

export function LateArrivalButton({
  bookingId,
  bookingTime,
  bookingDate,
  salonName,
  bookingStatus,
  variant = "outline",
  size = "sm",
  className = "",
  onSuccess,
}: LateArrivalButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const today = getISTDate();
  const isToday = bookingDate === today;
  const isActiveBooking = bookingStatus === "confirmed" || bookingStatus === "pending";

  if (!isToday || !isActiveBooking) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={`gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 ${className}`}
      >
        <Clock className="h-4 w-4" />
        Running Late?
      </Button>

      <LateArrivalModal
        bookingId={bookingId}
        bookingTime={bookingTime}
        salonName={salonName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onSuccess}
      />
    </>
  );
}
