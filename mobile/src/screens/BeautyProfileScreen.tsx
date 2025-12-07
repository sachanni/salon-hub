import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { beautyProfileAPI, BeautyProfile, BeautyProfileSummary } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HAIR_TYPES = ['Straight', 'Wavy', 'Curly', 'Coily'];
const HAIR_TEXTURES = ['Fine', 'Medium', 'Coarse'];
const SKIN_TYPES = ['Normal', 'Oily', 'Dry', 'Combination', 'Sensitive'];
const SKIN_TONES = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Deep'];
const BEVERAGES = ['Coffee', 'Tea', 'Water', 'Juice', 'None'];
const MUSIC_PREFS = ['Pop', 'Classical', 'Jazz', 'R&B', 'Rock', 'No Preference'];
const COMMUNICATION = ['Chatty', 'Minimal', 'No Preference'];

export default function BeautyProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profiles, setProfiles] = useState<BeautyProfile[]>([]);
  const [summary, setSummary] = useState<BeautyProfileSummary | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<BeautyProfile | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'photos' | 'notes' | 'preferences'>('overview');
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [editedProfile, setEditedProfile] = useState<Partial<BeautyProfile>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setError(null);
      } else {
        setRefreshError(null);
      }
      const response = await beautyProfileAPI.getMyBeautyProfile();
      if (response.success) {
        setProfiles(response.profiles || []);
        setSummary(response.summary || null);
        setError(null);
        setRefreshError(null);
      } else {
        const errorMsg = 'Failed to load your beauty profiles';
        if (isInitialLoad) {
          setError(errorMsg);
        } else {
          setRefreshError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Error fetching beauty profiles:', err);
      const errorMsg = 'Unable to connect. Please check your internet connection.';
      if (isInitialLoad) {
        setError(errorMsg);
      } else {
        setRefreshError(errorMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfiles(true);
    }, [fetchProfiles])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfiles(false);
  }, [fetchProfiles]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    fetchProfiles(true);
  }, [fetchProfiles]);

  const openProfileDetail = (profile: BeautyProfile) => {
    setSelectedProfile(profile);
    setEditedProfile(profile);
    setActiveDetailTab('overview');
    setDetailModalVisible(true);
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedProfile(null);
    setEditMode(false);
    setEditedProfile({});
  };

  const handleSave = async () => {
    if (!selectedProfile) return;
    
    setSaving(true);
    try {
      const response = await beautyProfileAPI.updateBeautyProfile(selectedProfile.id, editedProfile);
      if (response.success && response.profile) {
        setProfiles(prev => prev.map(p => 
          p.id === selectedProfile.id ? { ...p, ...response.profile } : p
        ));
        setSelectedProfile({ ...selectedProfile, ...response.profile });
        setEditMode(false);
        Alert.alert('Success', 'Your beauty profile has been updated.');
      } else {
        Alert.alert('Update Failed', 'Unable to save your changes. Please try again.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert(
        'Connection Error',
        'Unable to save your changes. Please check your internet connection and try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const openPhotoViewer = (index: number) => {
    setSelectedPhotoIndex(index);
    setPhotoViewerVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const renderSummaryStats = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryIconContainer}>
          <Ionicons name="sparkles" size={24} color="#8B5CF6" />
        </View>
        <View>
          <Text style={styles.summaryTitle}>Your Beauty Journey</Text>
          <Text style={styles.summarySubtitle}>
            Personalized profiles across {summary?.totalProfiles || 0} salons
          </Text>
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{summary?.totalProfiles || 0}</Text>
          <Text style={styles.statLabel}>Salons</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{summary?.totalPhotos || 0}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{summary?.totalNotes || 0}</Text>
          <Text style={styles.statLabel}>Notes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{summary?.totalVisits || 0}</Text>
          <Text style={styles.statLabel}>Visits</Text>
        </View>
      </View>
    </View>
  );

  const renderProfileCard = (profile: BeautyProfile) => (
    <TouchableOpacity 
      key={profile.id} 
      style={styles.profileCard}
      onPress={() => openProfileDetail(profile)}
    >
      <View style={styles.profileCardHeader}>
        {profile.salonImageUrl ? (
          <Image source={{ uri: profile.salonImageUrl }} style={styles.salonImage} />
        ) : (
          <View style={[styles.salonImage, styles.salonImagePlaceholder]}>
            <Ionicons name="storefront-outline" size={24} color="#9CA3AF" />
          </View>
        )}
        <View style={styles.salonInfo}>
          <Text style={styles.salonName}>{profile.salonName}</Text>
          <View style={styles.salonMeta}>
            <Ionicons name="calendar-outline" size={12} color="#6B7280" />
            <Text style={styles.visitCount}>{profile.visitCount} visits</Text>
            {profile.lastVisit && (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.lastVisit}>Last: {formatTimeAgo(profile.lastVisit)}</Text>
              </>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>

      <View style={styles.profileQuickInfo}>
        {profile.hairType && (
          <View style={styles.quickInfoBadge}>
            <Ionicons name="brush-outline" size={12} color="#8B5CF6" />
            <Text style={styles.quickInfoText}>{profile.hairType}</Text>
          </View>
        )}
        {profile.skinType && (
          <View style={styles.quickInfoBadge}>
            <Ionicons name="happy-outline" size={12} color="#EC4899" />
            <Text style={styles.quickInfoText}>{profile.skinType}</Text>
          </View>
        )}
        {(profile.photos?.length || 0) > 0 && (
          <View style={styles.quickInfoBadge}>
            <Ionicons name="images-outline" size={12} color="#10B981" />
            <Text style={styles.quickInfoText}>{profile.photos?.length} photos</Text>
          </View>
        )}
        {(profile.notes?.length || 0) > 0 && (
          <View style={styles.quickInfoBadge}>
            <Ionicons name="document-text-outline" size={12} color="#F59E0B" />
            <Text style={styles.quickInfoText}>{profile.notes?.length} notes</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderDetailOverview = () => {
    if (!selectedProfile) return null;

    return (
      <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
        <View style={styles.detailSection}>
          <View style={styles.detailSectionHeader}>
            <Ionicons name="brush" size={18} color="#8B5CF6" />
            <Text style={styles.detailSectionTitle}>Hair Profile</Text>
          </View>
          <View style={styles.detailGrid}>
            <View style={styles.detailGridItem}>
              <Text style={styles.detailLabel}>Type</Text>
              {editMode ? (
                <View style={styles.optionRow}>
                  {HAIR_TYPES.map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.optionChip,
                        editedProfile.hairType === type && styles.optionChipSelected
                      ]}
                      onPress={() => setEditedProfile({ ...editedProfile, hairType: type })}
                    >
                      <Text style={[
                        styles.optionChipText,
                        editedProfile.hairType === type && styles.optionChipTextSelected
                      ]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.detailValue}>{selectedProfile.hairType || 'Not set'}</Text>
              )}
            </View>
            <View style={styles.detailGridItem}>
              <Text style={styles.detailLabel}>Texture</Text>
              {editMode ? (
                <View style={styles.optionRow}>
                  {HAIR_TEXTURES.map(texture => (
                    <TouchableOpacity
                      key={texture}
                      style={[
                        styles.optionChip,
                        editedProfile.hairTexture === texture && styles.optionChipSelected
                      ]}
                      onPress={() => setEditedProfile({ ...editedProfile, hairTexture: texture })}
                    >
                      <Text style={[
                        styles.optionChipText,
                        editedProfile.hairTexture === texture && styles.optionChipTextSelected
                      ]}>{texture}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.detailValue}>{selectedProfile.hairTexture || 'Not set'}</Text>
              )}
            </View>
            <View style={styles.detailGridItem}>
              <Text style={styles.detailLabel}>Color</Text>
              {editMode ? (
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.hairColor || ''}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, hairColor: text })}
                  placeholder="e.g., Natural Black, Highlighted"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <Text style={styles.detailValue}>{selectedProfile.hairColor || 'Not set'}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.detailSection}>
          <View style={styles.detailSectionHeader}>
            <Ionicons name="happy" size={18} color="#EC4899" />
            <Text style={styles.detailSectionTitle}>Skin Profile</Text>
          </View>
          <View style={styles.detailGrid}>
            <View style={styles.detailGridItem}>
              <Text style={styles.detailLabel}>Type</Text>
              {editMode ? (
                <View style={styles.optionRow}>
                  {SKIN_TYPES.map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.optionChip,
                        editedProfile.skinType === type && styles.optionChipSelected
                      ]}
                      onPress={() => setEditedProfile({ ...editedProfile, skinType: type })}
                    >
                      <Text style={[
                        styles.optionChipText,
                        editedProfile.skinType === type && styles.optionChipTextSelected
                      ]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.detailValue}>{selectedProfile.skinType || 'Not set'}</Text>
              )}
            </View>
            <View style={styles.detailGridItem}>
              <Text style={styles.detailLabel}>Tone</Text>
              {editMode ? (
                <View style={styles.optionRow}>
                  {SKIN_TONES.map(tone => (
                    <TouchableOpacity
                      key={tone}
                      style={[
                        styles.optionChip,
                        editedProfile.skinTone === tone && styles.optionChipSelected
                      ]}
                      onPress={() => setEditedProfile({ ...editedProfile, skinTone: tone })}
                    >
                      <Text style={[
                        styles.optionChipText,
                        editedProfile.skinTone === tone && styles.optionChipTextSelected
                      ]}>{tone}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.detailValue}>{selectedProfile.skinTone || 'Not set'}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.detailSection}>
          <View style={styles.detailSectionHeader}>
            <Ionicons name="warning" size={18} color="#EF4444" />
            <Text style={styles.detailSectionTitle}>Allergies & Sensitivities</Text>
          </View>
          {editMode ? (
            <TextInput
              style={[styles.textInput, styles.textInputMultiline]}
              value={(editedProfile.allergies || []).join(', ')}
              onChangeText={(text) => setEditedProfile({ 
                ...editedProfile, 
                allergies: text.split(',').map(s => s.trim()).filter(Boolean)
              })}
              placeholder="e.g., Latex, Fragrance, Parabens"
              placeholderTextColor="#9CA3AF"
              multiline
            />
          ) : selectedProfile.allergies && selectedProfile.allergies.length > 0 ? (
            <View style={styles.allergiesContainer}>
              {selectedProfile.allergies.map((allergy, index) => (
                <View key={index} style={styles.allergyBadge}>
                  <Text style={styles.allergyText}>{allergy}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No allergies recorded</Text>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderDetailPhotos = () => {
    if (!selectedProfile) return null;
    const photos = selectedProfile.photos || [];

    return (
      <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
        {photos.length === 0 ? (
          <View style={styles.emptyStateSmall}>
            <Ionicons name="images-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No photos yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Your stylist can add photos from your appointments
            </Text>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.photoGridItem}
                onPress={() => openPhotoViewer(index)}
              >
                <Image source={{ uri: photo.url }} style={styles.photoThumbnail} />
                {photo.caption && (
                  <View style={styles.photoCaptionOverlay}>
                    <Text style={styles.photoCaptionText} numberOfLines={1}>
                      {photo.caption}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderDetailNotes = () => {
    if (!selectedProfile) return null;
    const notes = (selectedProfile.notes || []).filter(n => !n.isPrivate);

    return (
      <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
        {notes.length === 0 ? (
          <View style={styles.emptyStateSmall}>
            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No notes yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Your stylist can add notes from your appointments
            </Text>
          </View>
        ) : (
          <View style={styles.notesTimeline}>
            {notes.map((note, index) => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteTimelineMarker}>
                  <View style={styles.noteTimelineDot} />
                  {index < notes.length - 1 && <View style={styles.noteTimelineLine} />}
                </View>
                <View style={styles.noteContent}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteAuthor}>{note.createdBy}</Text>
                    <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
                  </View>
                  <Text style={styles.noteText}>{note.content}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderDetailPreferences = () => {
    if (!selectedProfile) return null;

    return (
      <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
        <View style={styles.detailSection}>
          <View style={styles.detailSectionHeader}>
            <Ionicons name="chatbubbles" size={18} color="#3B82F6" />
            <Text style={styles.detailSectionTitle}>Communication</Text>
          </View>
          {editMode ? (
            <View style={styles.optionRow}>
              {COMMUNICATION.map(pref => (
                <TouchableOpacity
                  key={pref}
                  style={[
                    styles.optionChip,
                    editedProfile.preferredCommunication === pref && styles.optionChipSelected
                  ]}
                  onPress={() => setEditedProfile({ ...editedProfile, preferredCommunication: pref })}
                >
                  <Text style={[
                    styles.optionChipText,
                    editedProfile.preferredCommunication === pref && styles.optionChipTextSelected
                  ]}>{pref}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.detailValue}>
              {selectedProfile.preferredCommunication || 'No preference set'}
            </Text>
          )}
        </View>

        <View style={styles.detailSection}>
          <View style={styles.detailSectionHeader}>
            <Ionicons name="cafe" size={18} color="#F59E0B" />
            <Text style={styles.detailSectionTitle}>Beverage Preference</Text>
          </View>
          {editMode ? (
            <View style={styles.optionRow}>
              {BEVERAGES.map(bev => (
                <TouchableOpacity
                  key={bev}
                  style={[
                    styles.optionChip,
                    editedProfile.preferredBeverage === bev && styles.optionChipSelected
                  ]}
                  onPress={() => setEditedProfile({ ...editedProfile, preferredBeverage: bev })}
                >
                  <Text style={[
                    styles.optionChipText,
                    editedProfile.preferredBeverage === bev && styles.optionChipTextSelected
                  ]}>{bev}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.detailValue}>
              {selectedProfile.preferredBeverage || 'No preference set'}
            </Text>
          )}
        </View>

        <View style={styles.detailSection}>
          <View style={styles.detailSectionHeader}>
            <Ionicons name="musical-notes" size={18} color="#10B981" />
            <Text style={styles.detailSectionTitle}>Music Preference</Text>
          </View>
          {editMode ? (
            <View style={styles.optionRow}>
              {MUSIC_PREFS.map(music => (
                <TouchableOpacity
                  key={music}
                  style={[
                    styles.optionChip,
                    editedProfile.musicPreference === music && styles.optionChipSelected
                  ]}
                  onPress={() => setEditedProfile({ ...editedProfile, musicPreference: music })}
                >
                  <Text style={[
                    styles.optionChipText,
                    editedProfile.musicPreference === music && styles.optionChipTextSelected
                  ]}>{music}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.detailValue}>
              {selectedProfile.musicPreference || 'No preference set'}
            </Text>
          )}
        </View>

        <View style={styles.detailSection}>
          <View style={styles.detailSectionHeader}>
            <Ionicons name="create" size={18} color="#6366F1" />
            <Text style={styles.detailSectionTitle}>Additional Notes</Text>
          </View>
          {editMode ? (
            <TextInput
              style={[styles.textInput, styles.textInputMultiline]}
              value={editedProfile.additionalNotes || ''}
              onChangeText={(text) => setEditedProfile({ ...editedProfile, additionalNotes: text })}
              placeholder="Any other preferences or notes..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          ) : (
            <Text style={styles.detailValue}>
              {selectedProfile.additionalNotes || 'No additional notes'}
            </Text>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderDetailModal = () => {
    if (!selectedProfile) return null;

    return (
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeDetailModal} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle} numberOfLines={1}>{selectedProfile.salonName}</Text>
              <Text style={styles.modalSubtitle}>{selectedProfile.visitCount} visits</Text>
            </View>
            {editMode ? (
              <TouchableOpacity 
                onPress={handleSave} 
                style={styles.modalSaveButton}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#8B5CF6" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={() => setEditMode(true)} 
                style={styles.modalEditButton}
              >
                <Ionicons name="create-outline" size={20} color="#8B5CF6" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.detailTabs}>
            <TouchableOpacity
              style={[styles.detailTab, activeDetailTab === 'overview' && styles.detailTabActive]}
              onPress={() => setActiveDetailTab('overview')}
            >
              <Ionicons 
                name="person-outline" 
                size={16} 
                color={activeDetailTab === 'overview' ? '#8B5CF6' : '#6B7280'} 
              />
              <Text style={[
                styles.detailTabText,
                activeDetailTab === 'overview' && styles.detailTabTextActive
              ]}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.detailTab, activeDetailTab === 'photos' && styles.detailTabActive]}
              onPress={() => setActiveDetailTab('photos')}
            >
              <Ionicons 
                name="images-outline" 
                size={16} 
                color={activeDetailTab === 'photos' ? '#8B5CF6' : '#6B7280'} 
              />
              <Text style={[
                styles.detailTabText,
                activeDetailTab === 'photos' && styles.detailTabTextActive
              ]}>Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.detailTab, activeDetailTab === 'notes' && styles.detailTabActive]}
              onPress={() => setActiveDetailTab('notes')}
            >
              <Ionicons 
                name="document-text-outline" 
                size={16} 
                color={activeDetailTab === 'notes' ? '#8B5CF6' : '#6B7280'} 
              />
              <Text style={[
                styles.detailTabText,
                activeDetailTab === 'notes' && styles.detailTabTextActive
              ]}>Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.detailTab, activeDetailTab === 'preferences' && styles.detailTabActive]}
              onPress={() => setActiveDetailTab('preferences')}
            >
              <Ionicons 
                name="settings-outline" 
                size={16} 
                color={activeDetailTab === 'preferences' ? '#8B5CF6' : '#6B7280'} 
              />
              <Text style={[
                styles.detailTabText,
                activeDetailTab === 'preferences' && styles.detailTabTextActive
              ]}>Prefs</Text>
            </TouchableOpacity>
          </View>

          {activeDetailTab === 'overview' && renderDetailOverview()}
          {activeDetailTab === 'photos' && renderDetailPhotos()}
          {activeDetailTab === 'notes' && renderDetailNotes()}
          {activeDetailTab === 'preferences' && renderDetailPreferences()}
        </View>
      </Modal>
    );
  };

  const renderPhotoViewerModal = () => {
    if (!selectedProfile || !selectedProfile.photos) return null;
    const photos = selectedProfile.photos;

    return (
      <Modal
        visible={photoViewerVisible}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setPhotoViewerVisible(false)}
      >
        <View style={styles.photoViewerContainer}>
          <TouchableOpacity 
            style={styles.photoViewerClose}
            onPress={() => setPhotoViewerVisible(false)}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: selectedPhotoIndex * SCREEN_WIDTH, y: 0 }}
          >
            {photos.map((photo) => (
              <View key={photo.id} style={styles.photoViewerSlide}>
                <Image 
                  source={{ uri: photo.url }} 
                  style={styles.photoViewerImage}
                  resizeMode="contain"
                />
                {photo.caption && (
                  <View style={styles.photoViewerCaption}>
                    <Text style={styles.photoViewerCaptionText}>{photo.caption}</Text>
                    <Text style={styles.photoViewerDate}>{formatDate(photo.createdAt)}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.photoViewerIndicator}>
            <Text style={styles.photoViewerIndicatorText}>
              {selectedPhotoIndex + 1} / {photos.length}
            </Text>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading your beauty profile...</Text>
      </View>
    );
  }

  if (error && profiles.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Beauty Profile</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Beauty Profile</Text>
        <View style={styles.headerRight} />
      </View>

      {refreshError && (
        <View style={styles.refreshErrorBanner}>
          <Ionicons name="warning-outline" size={16} color="#92400E" />
          <Text style={styles.refreshErrorText}>{refreshError}</Text>
          <TouchableOpacity onPress={() => setRefreshError(null)}>
            <Ionicons name="close" size={16} color="#92400E" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
      >
        {summary && renderSummaryStats()}

        {profiles.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="sparkles-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyStateTitle}>No Beauty Profiles Yet</Text>
            <Text style={styles.emptyStateDescription}>
              Book an appointment at a salon to start building your personalized beauty profile.
              Your stylist will record your preferences and service history.
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => router.push('/home' as any)}
            >
              <Text style={styles.emptyStateButtonText}>Explore Salons</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profilesList}>
            <Text style={styles.sectionTitle}>Your Profiles</Text>
            {profiles.map(renderProfileCard)}
          </View>
        )}
      </ScrollView>

      {renderDetailModal()}
      {renderPhotoViewerModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
  },
  refreshErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  summaryContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  summarySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  profilesList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salonImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  salonImagePlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  salonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  salonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  visitCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  dotSeparator: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  lastVisit: {
    fontSize: 12,
    color: '#6B7280',
  },
  profileQuickInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  quickInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  quickInfoText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalEditButton: {
    padding: 8,
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  detailTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  detailTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  detailTabActive: {
    backgroundColor: '#F5F3FF',
  },
  detailTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  detailTabTextActive: {
    color: '#8B5CF6',
  },
  detailContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  detailGrid: {
    gap: 16,
  },
  detailGridItem: {
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: '#111827',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionChipSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#8B5CF6',
  },
  optionChipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  optionChipTextSelected: {
    color: '#8B5CF6',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  allergiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  allergyText: {
    fontSize: 13,
    color: '#DC2626',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyStateSmall: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoGridItem: {
    width: (SCREEN_WIDTH - 48) / 3,
    height: (SCREEN_WIDTH - 48) / 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoCaptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  photoCaptionText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  notesTimeline: {
    paddingLeft: 8,
  },
  noteCard: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  noteTimelineMarker: {
    width: 20,
    alignItems: 'center',
  },
  noteTimelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B5CF6',
    marginTop: 4,
  },
  noteTimelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  noteContent: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  noteDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  noteText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  photoViewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  photoViewerClose: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  photoViewerSlide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  photoViewerCaption: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 12,
  },
  photoViewerCaptionText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  photoViewerDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  photoViewerIndicator: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  photoViewerIndicatorText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
