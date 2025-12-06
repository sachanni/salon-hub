import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const router = useRouter();
  const { isLoading, isAuthenticated, hasCompletedOnboarding } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && hasCompletedOnboarding) {
        router.replace('/(tabs)/at-salon');
      } else {
        router.replace('/onboarding/splash');
      }
    }
  }, [isLoading, isAuthenticated, hasCompletedOnboarding]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8B5CF6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
