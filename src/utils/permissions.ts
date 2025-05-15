import { PermissionsAndroid, Platform, Alert } from 'react-native';

export async function requestAudioPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      console.log('Requesting audio permission only...');
      
      // Only request microphone permission - we'll use app-specific storage
      const audioPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'StickyNotes needs access to your microphone to record voice notes.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      console.log('Audio permission result:', audioPermission);
      
      if (audioPermission !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('Microphone permission denied');
        Alert.alert(
          'Permission Required',
          'Microphone permission is required for voice recording.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      // We'll use app-specific storage which doesn't require permissions
      console.log('Using app-specific storage for recordings');
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }
  
  // iOS doesn't need explicit permissions for app-specific storage
  return true;
}
