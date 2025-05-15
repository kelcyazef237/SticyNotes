import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Platform, 
  Alert, 
  ScrollView, 
  SafeAreaView 
} from 'react-native';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
} from 'react-native-audio-recorder-player';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../utils/theme';
import { requestAudioPermissions } from '../utils/permissions';
import Slider from '@react-native-community/slider';
import RNFS from 'react-native-fs';

interface Props {
  audioPath?: string;
  onRecorded: (path: string) => void;
}

interface Recording {
  id: string;
  path: string;
  timestamp: number;
}

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const AudioRecorderPlayerComponent: React.FC<Props> = ({ audioPath, onRecorded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [currentPositionSec, setCurrentPositionSec] = useState(0);
  const [currentDurationSec, setCurrentDurationSec] = useState(0);
  const [playTime, setPlayTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [currentRecordingPath, setCurrentRecordingPath] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const audioRecorderPlayerRef = useRef(new AudioRecorderPlayer());
  
  useEffect(() => {
    // Initialize and load saved recordings
    loadRecordings();
    
    // Clean up on unmount
    return () => {
      if (isRecording) {
        stopRecording();
      }
      if (isPlaying) {
        stopPlaying();
      }
    };
  }, []);
  
  useEffect(() => {
    if (audioPath) {
      // If audioPath is provided as a prop, add it to recordings if not already there
      const recording = {
        id: `imported-${Date.now()}`,
        path: audioPath,
        timestamp: Date.now(),
      };
      
      // Check if this recording already exists
      const exists = recordings.some(r => r.path === audioPath);
      if (!exists) {
        setRecordings(prev => [...prev, recording]);
      }
    }
  }, [audioPath]);

  const checkPermission = async () => {
    setIsCheckingPermission(true);
    try {
      const hasPermission = await requestAudioPermissions();
      setHasPermission(hasPermission);
      setIsCheckingPermission(false);
      return hasPermission;
    } catch (error) {
      console.error('Error checking permissions:', error);
      setIsCheckingPermission(false);
      setHasPermission(false);
      return false;
    }
  };

  const loadRecordings = async () => {
    try {
      // Get all files in the app's document directory
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      
      // Filter for audio files (m4a)
      const audioFiles = files.filter(file => 
        file.name.endsWith('.m4a') && file.name.startsWith('sticky_note_')
      );
      
      // Create Recording objects
      const loadedRecordings = audioFiles.map(file => {
        // Extract timestamp from filename (sticky_note_TIMESTAMP.m4a)
        const timestamp = parseInt(file.name.replace('sticky_note_', '').replace('.m4a', ''), 10);
        
        return {
          id: file.name,
          path: file.path,
          timestamp: isNaN(timestamp) ? Date.now() : timestamp,
        };
      });
      
      // Sort by timestamp (newest first)
      loadedRecordings.sort((a, b) => b.timestamp - a.timestamp);
      
      setRecordings(loadedRecordings);
    } catch (error) {
      console.error('Error loading recordings:', error);
      Alert.alert('Error', 'Failed to load recordings');
    }
  };

  const startRecording = async () => {
    const hasPermission = await checkPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is required to record audio.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Set up recording path
      const path = Platform.OS === 'android' || Platform.OS === 'ios'
        ? `${RNFS.DocumentDirectoryPath}/sticky_note_${Date.now()}.m4a`
        : `sticky_note_${Date.now()}.m4a`;
      
      setCurrentRecordingPath(path);
      
      // Configure audio settings
      const audioSet: AudioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.medium,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
      };
      
      // Start recording
      await audioRecorderPlayerRef.current.startRecorder(path, audioSet);
      
      // Set up recording subscription
      audioRecorderPlayerRef.current.addRecordBackListener((e) => {
        setRecordingTime(formatTime(e.currentPosition));
        return;
      });
      
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    
    try {
      const result = await audioRecorderPlayerRef.current.stopRecorder();
      audioRecorderPlayerRef.current.removeRecordBackListener();
      
      setIsRecording(false);
      setRecordingTime('00:00');
      
      if (currentRecordingPath) {
        const newRecording = {
          id: `recording-${Date.now()}`,
          path: currentRecordingPath,
          timestamp: Date.now(),
        };
        
        setRecordings(prev => [newRecording, ...prev]);
        
        // Call the callback with the recording path
        onRecorded(currentRecordingPath);
      }
      
      setCurrentRecordingPath(null);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const startPlaying = async (recording: Recording) => {
    try {
      // Stop any current playback
      if (isPlaying) {
        await stopPlaying();
      }
      
      // Start playing the selected recording
      await audioRecorderPlayerRef.current.startPlayer(recording.path);
      
      // Set up playback subscription
      audioRecorderPlayerRef.current.addPlayBackListener((e) => {
        if (e.currentPosition >= e.duration) {
          // Playback completed
          stopPlaying();
          return;
        }
        
        setCurrentPositionSec(e.currentPosition);
        setCurrentDurationSec(e.duration);
        setPlayTime(formatTime(e.currentPosition));
        setDuration(formatTime(e.duration));
      });
      
      setPlayingId(recording.id);
      setIsPlaying(true);
      setIsPaused(false);
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const pausePlaying = async () => {
    try {
      await audioRecorderPlayerRef.current.pausePlayer();
      setIsPaused(true);
    } catch (error) {
      console.error('Error pausing playback:', error);
    }
  };

  const resumePlaying = async () => {
    try {
      await audioRecorderPlayerRef.current.resumePlayer();
      setIsPaused(false);
    } catch (error) {
      console.error('Error resuming playback:', error);
    }
  };

  const stopPlaying = async () => {
    try {
      await audioRecorderPlayerRef.current.stopPlayer();
      audioRecorderPlayerRef.current.removePlayBackListener();
      
      setPlayingId(null);
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentPositionSec(0);
      setCurrentDurationSec(0);
      setPlayTime('00:00');
      setDuration('00:00');
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  const seekTo = async (seconds: number) => {
    try {
      await audioRecorderPlayerRef.current.seekToPlayer(seconds);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const deleteRecording = async (recording: Recording) => {
    try {
      // Stop playback if this recording is playing
      if (playingId === recording.id) {
        await stopPlaying();
      }
      
      // Delete the file
      await RNFS.unlink(recording.path);
      
      // Remove from state
      setRecordings(prev => prev.filter(r => r.id !== recording.id));
    } catch (error) {
      console.error('Error deleting recording:', error);
      Alert.alert('Error', 'Failed to delete recording');
    }
  };

  const renderRecordingItem = (recording: Recording) => {
    const isCurrentlyPlaying = playingId === recording.id;
    
    return (
      <View style={styles.recordingItem} key={recording.id}>
        <View style={styles.recordingMain}>
          <View style={styles.recordingIconContainer}>
            <Icon 
              name="mic" 
              size={24} 
              color={theme.colors.primary} 
            />
          </View>
          
          <View style={styles.recordingDetails}>
            <Text style={styles.recordingDate}>
              {formatDate(recording.timestamp)}
            </Text>
            {isCurrentlyPlaying && (
              <Text style={styles.playingLabel}>
                {isPaused ? 'Paused' : 'Playing'} {playTime} / {duration}
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Delete Recording',
                'Are you sure you want to delete this recording?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => deleteRecording(recording)
                  }
                ]
              );
            }}
          >
            <Icon name="delete" size={24} color={theme.colors.error} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => {
              if (isCurrentlyPlaying) {
                if (isPaused) {
                  resumePlaying();
                } else {
                  pausePlaying();
                }
              } else {
                startPlaying(recording);
              }
            }}
          >
            <Icon 
              name={isCurrentlyPlaying ? (isPaused ? 'play-arrow' : 'pause') : 'play-arrow'} 
              size={24} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>
        
        {isCurrentlyPlaying && (
          <View style={styles.playbackControls}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={currentDurationSec > 0 ? currentDurationSec : 1}
              value={currentPositionSec}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor="#ddd"
              thumbTintColor={theme.colors.primary}
              onSlidingComplete={seekTo}
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{playTime}</Text>
              <Text style={styles.timeText}>{duration}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voice Recorder</Text>
      </View>
      
      {isRecording && (
        <View style={styles.recordingStatus}>
          <View style={styles.recordingIndicator}>
            <View style={[styles.recordingDot, styles.pulsating]} />
            <Text style={styles.recordingLabel}>Recording</Text>
          </View>
          <Text style={styles.recordingTimer}>{recordingTime}</Text>
        </View>
      )}
      
      <ScrollView style={styles.recordingsContainer}>
        {recordings.length > 0 ? (
          <View style={styles.recordingsList}>
            {recordings.map(recording => renderRecordingItem(recording))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="mic-none" size={64} color={theme.colors.gray} />
            <Text style={styles.emptyMessage}>No Recordings Yet</Text>
            <Text style={styles.emptySubMessage}>
              Tap the microphone button below to start recording
            </Text>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.controlsContainer}>
        {!hasPermission && !isCheckingPermission ? (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={checkPermission}
          >
            <Icon name="mic-off" size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.permissionText}>Grant Microphone Permission</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordingButton
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isCheckingPermission}
          >
            {isCheckingPermission ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Icon
                name={isRecording ? 'stop' : 'mic'}
                size={32}
                color="#fff"
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    padding: 0,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
  },
  recordingStatus: {
    backgroundColor: theme.colors.error,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  pulsating: {
    opacity: 0.8,
  },
  recordingLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
  recordingTimer: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recordingsContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.darkGray,
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.colors.gray,
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubMessage: {
    textAlign: 'center',
    color: theme.colors.gray,
    marginTop: 8,
    fontSize: 14,
  },
  recordingsList: {
    flex: 1,
    width: '100%',
  },
  recordingItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  recordingMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  recordingIconContainer: {
    marginRight: 12,
  },
  recordingDetails: {
    flex: 1,
  },
  recordingDate: {
    fontSize: 16,
    color: theme.colors.darkGray,
    fontWeight: '500',
  },
  playingLabel: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
  playButton: {
    padding: 8,
  },
  playbackControls: {
    padding: 12,
    paddingTop: 0,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  controlsContainer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
  },
  recordButton: {
    backgroundColor: theme.colors.primary,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  recordingButton: {
    backgroundColor: theme.colors.error,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AudioRecorderPlayerComponent;
