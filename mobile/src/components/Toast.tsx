import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  show: (config: ToastConfig) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastItem extends ToastConfig {
  id: string;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [fadeAnims] = useState<{ [key: string]: Animated.Value }>({});

  const show = useCallback((config: ToastConfig) => {
    const id = Date.now().toString();
    const toast: ToastItem = { ...config, id };
    
    fadeAnims[id] = new Animated.Value(0);
    
    setToasts((prev) => [...prev, toast]);

    Animated.sequence([
      Animated.timing(fadeAnims[id], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(config.duration || 3000),
      Animated.timing(fadeAnims[id], {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete fadeAnims[id];
    });
  }, [fadeAnims]);

  const success = useCallback((title: string, message?: string) => {
    show({ type: 'success', title, message });
  }, [show]);

  const error = useCallback((title: string, message?: string) => {
    show({ type: 'error', title, message });
  }, [show]);

  const warning = useCallback((title: string, message?: string) => {
    show({ type: 'warning', title, message });
  }, [show]);

  const info = useCallback((title: string, message?: string) => {
    show({ type: 'info', title, message });
  }, [show]);

  const dismiss = useCallback((id: string) => {
    if (fadeAnims[id]) {
      Animated.timing(fadeAnims[id], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete fadeAnims[id];
      });
    }
  }, [fadeAnims]);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          icon: 'checkmark-circle' as const,
          iconColor: '#FFFFFF',
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          icon: 'close-circle' as const,
          iconColor: '#FFFFFF',
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          icon: 'warning' as const,
          iconColor: '#FFFFFF',
        };
      case 'info':
        return {
          backgroundColor: '#3B82F6',
          icon: 'information-circle' as const,
          iconColor: '#FFFFFF',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast) => {
          const styles_config = getToastStyles(toast.type);
          const opacity = fadeAnims[toast.id] || new Animated.Value(0);

          return (
            <Animated.View
              key={toast.id}
              style={[
                styles.toast,
                { backgroundColor: styles_config.backgroundColor },
                {
                  opacity,
                  transform: [
                    {
                      translateY: opacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.toastContent}>
                <Ionicons
                  name={styles_config.icon}
                  size={24}
                  color={styles_config.iconColor}
                  style={styles.icon}
                />
                <View style={styles.textContainer}>
                  <Text style={styles.title}>{toast.title}</Text>
                  {toast.message && (
                    <Text style={styles.message}>{toast.message}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => dismiss(toast.id)}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {toast.action && (
                <TouchableOpacity
                  onPress={() => {
                    toast.action!.onPress();
                    dismiss(toast.id);
                  }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionText}>{toast.action.label}</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
