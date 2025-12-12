import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LateArrivalModal from './LateArrivalModal';

interface LateArrivalButtonProps {
  bookingId: string;
  bookingTime: string;
  bookingDate: string;
  salonName: string;
  bookingStatus: string;
  variant?: 'default' | 'outline' | 'compact';
  onSuccess?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
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

function normalizeToISTDate(dateInput: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return dateInput;
  }
  return formatter.format(date);
}

function hasBookingTimePassed(bookingTime: string): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const currentTime = formatter.format(now);
  return currentTime > bookingTime;
}

export default function LateArrivalButton({
  bookingId,
  bookingTime,
  bookingDate,
  salonName,
  bookingStatus,
  variant = 'default',
  onSuccess,
  style,
  textStyle,
}: LateArrivalButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const today = getISTDate();
  const normalizedBookingDate = normalizeToISTDate(bookingDate);
  const isToday = normalizedBookingDate === today;
  const isActiveBooking = bookingStatus === 'confirmed' || bookingStatus === 'pending';
  const hasTimePassed = hasBookingTimePassed(bookingTime);

  if (!isToday || !isActiveBooking || hasTimePassed) {
    return null;
  }

  const getButtonStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.buttonOutline;
      case 'compact':
        return styles.buttonCompact;
      default:
        return styles.button;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'compact':
        return styles.textCompact;
      default:
        return styles.text;
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPress={() => setIsModalOpen(true)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="time-outline" 
          size={variant === 'compact' ? 16 : 18} 
          color="#D97706" 
        />
        <Text style={[getTextStyle(), textStyle]}>
          {variant === 'compact' ? 'Running Late?' : 'Running Late? Let them know'}
        </Text>
      </TouchableOpacity>

      <LateArrivalModal
        bookingId={bookingId}
        bookingTime={bookingTime}
        salonName={salonName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          onSuccess?.();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  buttonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  buttonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D97706',
  },
  textCompact: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
  },
});
