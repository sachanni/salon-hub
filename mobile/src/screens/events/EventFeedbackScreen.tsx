import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsAPI } from '../../services/api';

const RATING_ASPECTS = [
  { id: 'overall', label: 'Overall Experience', icon: 'star-outline' },
  { id: 'content', label: 'Content Quality', icon: 'book-outline' },
  { id: 'venue', label: 'Venue & Facilities', icon: 'location-outline' },
  { id: 'organization', label: 'Organization', icon: 'calendar-outline' },
  { id: 'value', label: 'Value for Money', icon: 'cash-outline' },
];

export const EventFeedbackScreen = () => {
  const router = useRouter();
  const { id, eventId } = useLocalSearchParams();
  const registrationId = typeof id === 'string' ? id : id?.[0];
  const evtId = typeof eventId === 'string' ? eventId : eventId?.[0];
  
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fetchingEvent, setFetchingEvent] = useState(true);

  const [eventDetails, setEventDetails] = useState({
    title: 'Bridal Makeup Masterclass',
    date: 'December 15, 2024',
    salonName: 'Glow Studio',
    salonImage: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/35c073455d-437ad899247819ca011a.png',
  });

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (evtId) {
        try {
          const response = await eventsAPI.getEventById(evtId);
          if (response && response.event) {
            setEventDetails({
              title: response.event.title || eventDetails.title,
              date: response.event.date || eventDetails.date,
              salonName: response.event.salonName || eventDetails.salonName,
              salonImage: response.event.salonImage || eventDetails.salonImage,
            });
          }
        } catch (err) {
          console.error('Error fetching event for feedback:', err);
        }
      }
      setFetchingEvent(false);
    };

    fetchEventDetails();
  }, [evtId]);

  const handleBack = () => {
    router.back();
  };

  const handleRating = (aspectId: string, rating: number) => {
    setRatings({ ...ratings, [aspectId]: rating });
  };

  const handleAddPhoto = () => {
    console.log('Add photo');
  };

  const handleSubmit = async () => {
    if (!ratings.overall) {
      Alert.alert('Rating Required', 'Please provide at least an overall rating');
      return;
    }

    if (!registrationId) {
      Alert.alert('Error', 'Registration not found');
      return;
    }

    setLoading(true);
    
    try {
      const response = await eventsAPI.submitEventFeedback(registrationId, {
        ratings: {
          overall: ratings.overall || 0,
          content: ratings.content || 0,
          venue: ratings.venue || 0,
          organization: ratings.organization || 0,
          value: ratings.value || 0,
        },
        comment: comment.trim() || undefined,
        photoUrls: photos.length > 0 ? photos : undefined,
      });

      if (response.success) {
        setSubmitted(true);
      } else {
        Alert.alert('Submission Failed', response.error || 'Unable to submit feedback');
      }
    } catch (err: any) {
      console.error('Feedback submission error:', err);
      Alert.alert('Error', 'Unable to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    router.replace('/(tabs)/events');
  };

  const renderStars = (aspectId: string) => {
    const rating = ratings[aspectId] || 0;
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRating(aspectId, star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? '#F59E0B' : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successSubtitle}>
            Your feedback helps us improve our events and services.
          </Text>

          <View style={styles.feedbackSummary}>
            <Text style={styles.summaryTitle}>Your Rating</Text>
            <View style={styles.summaryRating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= (ratings.overall || 0) ? 'star' : 'star-outline'}
                  size={28}
                  color={star <= (ratings.overall || 0) ? '#F59E0B' : '#D1D5DB'}
                />
              ))}
            </View>
            {comment && (
              <Text style={styles.summaryComment}>"{comment}"</Text>
            )}
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Event Card */}
        <View style={styles.eventCard}>
          <Image source={{ uri: eventDetails.salonImage }} style={styles.eventImage} />
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{eventDetails.title}</Text>
            <Text style={styles.eventMeta}>{eventDetails.salonName}</Text>
            <Text style={styles.eventDate}>{eventDetails.date}</Text>
          </View>
        </View>

        {/* Overall Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingTitle}>How was your overall experience?</Text>
          {renderStars('overall')}
          <Text style={styles.ratingHint}>
            {ratings.overall === 5 ? 'Excellent!' :
             ratings.overall === 4 ? 'Very Good!' :
             ratings.overall === 3 ? 'Good' :
             ratings.overall === 2 ? 'Fair' :
             ratings.overall === 1 ? 'Poor' :
             'Tap to rate'}
          </Text>
        </View>

        {/* Detailed Ratings */}
        <View style={styles.detailedSection}>
          <Text style={styles.sectionTitle}>Rate Specific Aspects</Text>
          <Text style={styles.sectionSubtitle}>Optional but helps us improve</Text>
          
          {RATING_ASPECTS.filter(a => a.id !== 'overall').map((aspect) => (
            <View key={aspect.id} style={styles.aspectCard}>
              <View style={styles.aspectHeader}>
                <Ionicons name={aspect.icon as any} size={20} color="#6B7280" />
                <Text style={styles.aspectLabel}>{aspect.label}</Text>
              </View>
              <View style={styles.aspectStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRating(aspect.id, star)}
                    style={styles.smallStarButton}
                  >
                    <Ionicons
                      name={star <= (ratings[aspect.id] || 0) ? 'star' : 'star-outline'}
                      size={24}
                      color={star <= (ratings[aspect.id] || 0) ? '#F59E0B' : '#D1D5DB'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Comment */}
        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Share Your Thoughts</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="What did you like or dislike about the event? Any suggestions for improvement?"
            placeholderTextColor="#9CA3AF"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {/* Photos */}
        <View style={styles.photosSection}>
          <Text style={styles.sectionTitle}>Add Photos (Optional)</Text>
          <Text style={styles.sectionSubtitle}>Share moments from the event</Text>
          
          <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: photo }} style={styles.photoImage} />
                <TouchableOpacity 
                  style={styles.removePhotoButton}
                  onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
                >
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 4 && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                <Ionicons name="camera-outline" size={32} color="#8B5CF6" />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.skipButton} onPress={handleBack}>
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit Review</Text>
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  eventDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  ratingSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingHint: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  detailedSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  aspectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  aspectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  aspectLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  aspectStars: {
    flexDirection: 'row',
    gap: 4,
  },
  smallStarButton: {
    padding: 2,
  },
  commentSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  commentInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    fontSize: 15,
    color: '#111827',
    height: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  photosSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  photoItem: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 10,
    color: '#8B5CF6',
    fontWeight: '600',
    marginTop: 4,
  },
  bottomPadding: {
    height: 120,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  feedbackSummary: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  summaryRating: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  summaryComment: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
