import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BookingNotesInputProps {
  value: string;
  onChangeText: (text: string) => void;
  maxLength?: number;
  placeholder?: string;
}

export const BookingNotesInput: React.FC<BookingNotesInputProps> = ({
  value,
  onChangeText,
  maxLength = 500,
  placeholder = 'Add any special requests or notes for your stylist...',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.header, isExpanded && styles.headerExpanded]}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#8B5CF6" />
          </View>
          <View>
            <Text style={styles.title}>Special Notes</Text>
            <Text style={styles.subtitle}>
              {value ? 'Notes added' : 'Add requests for your stylist'}
            </Text>
          </View>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#9CA3AF"
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, isFocused && styles.inputFocused]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            maxLength={maxLength}
            textAlignVertical="top"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <View style={styles.footer}>
            <View style={styles.suggestions}>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => onChangeText(value ? `${value}\nSensitive scalp` : 'Sensitive scalp')}
              >
                <Text style={styles.suggestionText}>Sensitive scalp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => onChangeText(value ? `${value}\nAllergic to certain products` : 'Allergic to certain products')}
              >
                <Text style={styles.suggestionText}>Allergies</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => onChangeText(value ? `${value}\nRunning late` : 'Running late')}
              >
                <Text style={styles.suggestionText}>Running late</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.charCount}>
              {value.length}/{maxLength}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  inputContainer: {
    padding: 16,
    paddingTop: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputFocused: {
    borderColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  suggestionChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  suggestionText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  charCount: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 8,
  },
});

export default BookingNotesInput;
