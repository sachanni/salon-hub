import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  photoUrl?: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    photoUrl: '',
  });
  const [originalProfile, setOriginalProfile] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    photoUrl: '',
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    requestMediaPermissions();
  }, []);

  const requestMediaPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need camera roll permissions to update your profile photo.'
        );
      }
    }
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const authData = await AsyncStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData);
        const profileData = {
          firstName: parsed.user?.firstName || '',
          lastName: parsed.user?.lastName || '',
          email: parsed.user?.email || '',
          phoneNumber: parsed.user?.phoneNumber || '',
          photoUrl: parsed.user?.photoUrl || '',
        };
        setProfile(profileData);
        setOriginalProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = () => {
    return (
      profile.firstName !== originalProfile.firstName ||
      profile.lastName !== originalProfile.lastName ||
      profile.phoneNumber !== originalProfile.phoneNumber ||
      profile.photoUrl !== originalProfile.photoUrl
    );
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const selectedImage = result.assets[0];
      setProfile({ ...profile, photoUrl: selectedImage.uri });
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera permissions to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const selectedImage = result.assets[0];
      setProfile({ ...profile, photoUrl: selectedImage.uri });
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handlePickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateProfile = () => {
    if (!profile.firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return false;
    }
    if (!profile.lastName.trim()) {
      Alert.alert('Error', 'Last name is required');
      return false;
    }
    if (profile.phoneNumber && !/^[6-9]\d{9}$/.test(profile.phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateProfile()) return;
    if (!hasChanges()) {
      router.back();
      return;
    }

    setIsSaving(true);
    try {
      const response = await userAPI.updateProfile({
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        phoneNumber: profile.phoneNumber.trim() || undefined,
      });

      if (response.success) {
        const authData = await AsyncStorage.getItem('authData');
        if (authData) {
          const parsed = JSON.parse(authData);
          parsed.user = {
            ...parsed.user,
            firstName: profile.firstName.trim(),
            lastName: profile.lastName.trim(),
            phoneNumber: profile.phoneNumber.trim(),
          };
          await AsyncStorage.setItem('authData', JSON.stringify(parsed));
        }
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (hasChanges()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const getInitials = () => {
    return `${profile.firstName.charAt(0) || 'U'}${profile.lastName.charAt(0) || ''}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving || !hasChanges()}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.saveButtonText, !hasChanges() && styles.saveButtonTextDisabled]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.photoSection} onPress={showPhotoOptions}>
          <View style={styles.photoContainer}>
            {profile.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoInitials}>{getInitials()}</Text>
              </View>
            )}
            <View style={styles.photoEditButton}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.photoHint}>Tap to change photo</Text>
        </TouchableOpacity>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={profile.firstName}
                onChangeText={(text) => setProfile({ ...profile, firstName: text })}
                placeholder="Enter first name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={profile.lastName}
                onChangeText={(text) => setProfile({ ...profile, lastName: text })}
                placeholder="Enter last name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.phonePrefix}>+91</Text>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                value={profile.phoneNumber}
                onChangeText={(text) => setProfile({ ...profile, phoneNumber: text.replace(/[^0-9]/g, '').slice(0, 10) })}
                placeholder="Enter phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.disabledInputContainer}>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={profile.email}
                editable={false}
              />
              <Ionicons name="lock-closed" size={16} color="#9CA3AF" style={styles.lockIcon} />
            </View>
            <Text style={styles.inputHint}>Email cannot be changed</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  photoEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  photoHint: {
    fontSize: 13,
    color: '#6B7280',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  phonePrefix: {
    paddingLeft: 14,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  disabledInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabledInput: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#9CA3AF',
  },
  lockIcon: {
    marginRight: 14,
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
});
