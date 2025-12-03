import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    image: require('../assets/splash1.png'),
    title: 'Premium Beauty\nServices for Women',
    description: 'Discover top-rated salons, spas, and beauty professionals near you',
  },
  {
    id: 2,
    image: require('../assets/splash2.png'),
    title: 'Expert Grooming\nServices for Men',
    description: 'Professional barbers and stylists ready to serve you',
  },
  {
    id: 3,
    image: require('../assets/splash3.png'),
    title: 'Book Anytime,\nAnywhere',
    description: 'Easy booking, exclusive offers, and trusted professionals all in one app',
  },
];

export default function SplashCarouselScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnims = useRef(slides.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Fade in first slide
    Animated.timing(fadeAnims[0], {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    // Auto-advance slides every 4 seconds
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % slides.length;
        
        // Fade out current slide
        Animated.timing(fadeAnims[prev], {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }).start();

        // Fade in next slide
        Animated.timing(fadeAnims[next], {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }).start();

        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    router.push('/onboarding/location');
  };

  const handleDotPress = (index: number) => {
    // Fade out current slide
    Animated.timing(fadeAnims[currentSlide], {
      toValue: 0,
      duration: 700,
      useNativeDriver: true,
    }).start();

    // Fade in selected slide
    Animated.timing(fadeAnims[index], {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    setCurrentSlide(index);
  };

  return (
    <View style={styles.container}>
      {/* Carousel Slides */}
      {slides.map((slide, index) => (
        <Animated.View
          key={slide.id}
          style={[
            styles.slide,
            {
              opacity: fadeAnims[index],
              zIndex: index === currentSlide ? 15 : 10,
            },
          ]}
        >
          <Image source={slide.image} style={styles.backgroundImage} />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
            style={styles.gradient}
          />
          <View style={styles.contentContainer}>
            <View style={styles.textContainer}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.logoGradient}
                >
                  <Text style={styles.logoText}>SalonHub</Text>
                </LinearGradient>
              </View>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        </Animated.View>
      ))}

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              style={[
                styles.dot,
                index === currentSlide && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {/* Get Started Button */}
        <TouchableOpacity onPress={handleGetStarted} style={styles.buttonContainer}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Terms Text */}
        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    position: 'absolute',
    width,
    height,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  textContainer: {
    marginBottom: 'auto',
    marginTop: 128,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    zIndex: 30,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    transition: 'all 0.3s',
  },
  activeDot: {
    width: 32,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginBottom: 16,
    borderRadius: 9999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  termsLink: {
    color: '#fff',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});
