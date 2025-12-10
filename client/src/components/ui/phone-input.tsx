import { useState, useEffect, forwardRef } from 'react';
import { parsePhoneNumber, isValidPhoneNumber, CountryCode, getCountryCallingCode } from 'libphonenumber-js';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Country {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
  maxLength: number;
}

const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', maxLength: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', maxLength: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', maxLength: 11 },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', maxLength: 9 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', maxLength: 8 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', maxLength: 9 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', maxLength: 10 },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', maxLength: 10 },
];

export interface PhoneInputProps {
  value?: string;
  onChange?: (value: string, isValid: boolean, e164: string) => void;
  defaultCountry?: CountryCode;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  required?: boolean;
  id?: string;
}

export interface PhoneInputRef {
  getE164: () => string;
  isValid: () => boolean;
  getCountry: () => CountryCode;
  getNationalNumber: () => string;
}

export const PhoneInput = forwardRef<PhoneInputRef, PhoneInputProps>(({
  value: externalValue,
  onChange,
  defaultCountry = 'IN',
  disabled = false,
  placeholder,
  className,
  required = false,
  id,
}, ref) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find(c => c.code === defaultCountry) || COUNTRIES[0]
  );
  const [nationalNumber, setNationalNumber] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (externalValue && externalValue.length > 0) {
      try {
        const parsed = parsePhoneNumber(externalValue);
        if (parsed) {
          const country = COUNTRIES.find(c => c.code === parsed.country);
          if (country) {
            setSelectedCountry(country);
            setNationalNumber(parsed.nationalNumber);
            const e164 = `${country.dialCode}${parsed.nationalNumber}`;
            let valid = false;
            try {
              valid = parsed.nationalNumber.length === country.maxLength && isValidPhoneNumber(e164, country.code);
            } catch {
              valid = parsed.nationalNumber.length === country.maxLength;
            }
            setIsValid(valid);
            onChange?.(parsed.nationalNumber, valid, e164);
          }
        }
      } catch {
        const cleaned = externalValue.replace(/\D/g, '');
        const number = cleaned.slice(-10);
        if (number.length > 0) {
          setNationalNumber(number);
          const currentCountry = selectedCountry;
          const e164 = `${currentCountry.dialCode}${number}`;
          const valid = number.length === currentCountry.maxLength;
          setIsValid(valid);
          onChange?.(number, valid, e164);
        }
      }
    }
  }, [externalValue]);

  useEffect(() => {
    if (typeof ref === 'function') {
      return;
    }
    if (ref) {
      ref.current = {
        getE164: () => `${selectedCountry.dialCode}${nationalNumber}`,
        isValid: () => isValid,
        getCountry: () => selectedCountry.code,
        getNationalNumber: () => nationalNumber,
      };
    }
  }, [ref, selectedCountry, nationalNumber, isValid]);

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      validateAndNotify(nationalNumber, country);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    const truncated = input.slice(0, selectedCountry.maxLength);
    setNationalNumber(truncated);
    validateAndNotify(truncated, selectedCountry);
  };

  const validateAndNotify = (number: string, country: Country) => {
    const e164 = `${country.dialCode}${number}`;
    let valid = false;
    
    try {
      valid = number.length === country.maxLength && isValidPhoneNumber(e164, country.code);
    } catch {
      valid = number.length === country.maxLength;
    }
    
    setIsValid(valid);
    onChange?.(number, valid, e164);
  };

  const dynamicPlaceholder = placeholder || `${selectedCountry.maxLength} digit number`;

  return (
    <div className={cn("flex gap-2", className)}>
      <Select
        value={selectedCountry.code}
        onValueChange={handleCountryChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[90px] shrink-0">
          <SelectValue>
            <span className="flex items-center gap-1">
              <span className="text-base">{selectedCountry.flag}</span>
              <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-gray-500">{country.dialCode}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Input
        id={id}
        type="tel"
        value={nationalNumber}
        onChange={handleNumberChange}
        disabled={disabled}
        placeholder={dynamicPlaceholder}
        maxLength={selectedCountry.maxLength}
        className={cn(
          "flex-1",
          nationalNumber.length === selectedCountry.maxLength && !isValid && "border-red-500"
        )}
        required={required}
      />
    </div>
  );
});

PhoneInput.displayName = 'PhoneInput';

export { COUNTRIES };
export type { Country };
