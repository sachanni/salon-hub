import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DepositBadgeProps {
  size?: 'small' | 'medium';
  showText?: boolean;
}

export const DepositBadge: React.FC<DepositBadgeProps> = ({ 
  size = 'small',
  showText = true 
}) => {
  const isSmall = size === 'small';

  return (
    <View style={[styles.container, isSmall ? styles.containerSmall : styles.containerMedium]}>
      <Ionicons 
        name="shield-checkmark" 
        size={isSmall ? 10 : 14} 
        color="#D97706" 
      />
      {showText && (
        <Text style={[styles.text, isSmall ? styles.textSmall : styles.textMedium]}>
          Deposit
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    gap: 3,
  },
  containerSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  containerMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
    color: '#D97706',
  },
  textSmall: {
    fontSize: 9,
  },
  textMedium: {
    fontSize: 11,
  },
});

export default DepositBadge;
