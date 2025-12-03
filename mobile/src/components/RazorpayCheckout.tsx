import React, { useRef, useState, useEffect } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

interface RazorpayCheckoutProps {
  visible: boolean;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure: (error: any) => void;
  onDismiss: () => void;
}

export const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
  visible,
  orderId,
  amount,
  currency,
  keyId,
  prefill = {},
  onSuccess,
  onFailure,
  onDismiss,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check network connectivity
  const checkNetwork = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const online = networkState.isConnected === true && networkState.isInternetReachable === true;
      setIsOnline(online);
      return online;
    } catch (error) {
      console.error('Network check error:', error);
      setIsOnline(true); // Assume online if check fails
      return true;
    }
  };

  // Clear timeout on successful load or message
  const clearLoadTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (visible) {
      checkNetwork();
      setWebViewLoaded(false);
      setLoadTimeout(false);
      
      // Set 60-second timeout for WebView loading
      timeoutRef.current = setTimeout(() => {
        if (!webViewLoaded) {
          setLoadTimeout(true);
        }
      }, 60000);
    }

    return () => {
      clearLoadTimeout();
    };
  }, [visible]);

  const handleRetry = async () => {
    setLoadTimeout(false);
    setWebViewLoaded(false);
    clearLoadTimeout();
    
    // Re-check network connectivity
    const online = await checkNetwork();
    
    if (online) {
      // Restart timeout
      timeoutRef.current = setTimeout(() => {
        if (!webViewLoaded) {
          setLoadTimeout(true);
        }
      }, 60000);
    }
  };

  // Escape all user-provided data to prevent XSS
  const safeKeyId = escapeHtml(keyId);
  const safeOrderId = escapeHtml(orderId);
  const safeCurrency = escapeHtml(currency);
  const safePrefillName = escapeHtml(prefill.name || '');
  const safePrefillEmail = escapeHtml(prefill.email || '');
  const safePrefillContact = escapeHtml(prefill.contact || '');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f9fafb;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .loader {
          text-align: center;
        }
        .spinner {
          border: 4px solid #f3f4f6;
          border-top: 4px solid #8b5cf6;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .message {
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="loader">
        <div class="spinner"></div>
        <p class="message">Opening Razorpay Checkout...</p>
      </div>
      <script>
        window.onload = function() {
          var options = {
            key: "${safeKeyId}",
            amount: ${amount},
            currency: "${safeCurrency}",
            name: "SalonHub",
            description: "Product Purchase",
            order_id: "${safeOrderId}",
            prefill: {
              name: "${safePrefillName}",
              email: "${safePrefillEmail}",
              contact: "${safePrefillContact}"
            },
            theme: {
              color: "#8b5cf6"
            },
            handler: function(response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'success',
                data: response
              }));
            },
            modal: {
              ondismiss: function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'dismiss'
                }));
              }
            }
          };

          var rzp = new Razorpay(options);
          
          rzp.on('payment.failed', function(response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'failure',
              data: response.error
            }));
          });

          rzp.open();
        };
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    // Clear timeout since WebView is working
    clearLoadTimeout();
    setWebViewLoaded(true);

    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'success':
          onSuccess(message.data);
          break;
        case 'failure':
          onFailure(message.data);
          break;
        case 'dismiss':
          onDismiss();
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handleWebViewLoad = () => {
    // WebView loaded successfully, clear timeout
    clearLoadTimeout();
    setWebViewLoaded(true);
  };

  // Show offline message
  if (!isOnline) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Secure Payment</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline" size={64} color="#9CA3AF" />
            <Text style={styles.errorTitle}>No Internet Connection</Text>
            <Text style={styles.errorMessage}>
              Please check your connection and try again
            </Text>
            <TouchableOpacity
              onPress={handleRetry}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Show timeout message
  if (loadTimeout) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Secure Payment</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="time-outline" size={64} color="#9CA3AF" />
            <Text style={styles.errorTitle}>Request Timed Out</Text>
            <Text style={styles.errorMessage}>
              The payment page took too long to load. Please try again.
            </Text>
            <TouchableOpacity
              onPress={handleRetry}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Secure Payment</Text>
          <View style={{ width: 40 }} />
        </View>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          originWhitelist={['https://*.razorpay.com', 'https://razorpay.com', 'about:blank', 'data:']}
          onShouldStartLoadWithRequest={(request) => {
            const url = request.url.toLowerCase();
            // Allow all Razorpay subdomains, data URLs, and about:blank
            const allowed = 
              url.includes('.razorpay.com') ||
              url.startsWith('https://razorpay.com') ||
              url.startsWith('data:') ||
              url === 'about:blank';
            
            if (!allowed) {
              console.warn('Blocked navigation to unauthorized URL:', request.url);
            }
            return allowed;
          }}
          onLoad={handleWebViewLoad}
          onLoadEnd={handleWebViewLoad}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
          )}
          style={styles.webview}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
