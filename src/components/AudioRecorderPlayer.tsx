import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
} from 'react-native-audio-recorder-player';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../utils/theme';

interface Props {
  audioPath?: string;
  onRecorded: (path: string) => void;
}

const audioRecorderPlayer = new AudioRecorderPlayer();

import Slider from '@react-native-community/slider';

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const AudioRecorderPlayerComponent: React.FC<Props> = ({ audioPath, onRecorded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedPath, setRecordedPath] = useState(audioPath || '');
  const [loading, setLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const startRecording = async () => {
    setLoading(true);
    try {
      // Use app-specific cache directory for Android
      const RNFS = require('react-native-fs');
      const path = Platform.OS === 'android'
        ? `${RNFS.CachesDirectoryPath}/sticky_note_${Date.now()}.m4a`
        : `sticky_note_${Date.now()}.m4a`;
      const audioSet: AudioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
      };
      await audioRecorderPlayer.startRecorder(path, audioSet);
      setIsRecording(true);
      setRecordedPath(path);
    } catch (e) {
      Alert.alert('Error', 'Failed to start recording: ' + e);
    }
    setLoading(false);
  };

  const stopRecording = async () => {
    setLoading(true);
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      setIsRecording(false);
      setRecordedPath(result);
      onRecorded(result);
    } catch (e) {
      Alert.alert('Error', 'Failed to stop recording: ' + e);
    }
    setLoading(false);
  };

  const playAudio = async () => {
    if (!recordedPath) return;
    setLoading(true);
    try {
      await audioRecorderPlayer.startPlayer(recordedPath);
      setIsPlaying(true);
      audioRecorderPlayer.addPlayBackListener((e) => {
        setCurrentPosition(e.currentPosition);
        setDuration(e.duration);
        if (e.currentPosition >= e.duration) {
          audioRecorderPlayer.stopPlayer();
          setIsPlaying(false);
        }
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to play audio: ' + e);
    }
    setLoading(false);
  };

  const seekAudio = async (value: number) => {
    await audioRecorderPlayer.seekToPlayer(value);
    setCurrentPosition(value);
  };


  const stopAudio = async () => {
    setLoading(true);
    try {
      await audioRecorderPlayer.stopPlayer();
      setIsPlaying(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to stop audio: ' + e);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator color={theme.colors.primary} />}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.recordingButton]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
          disabled={loading}
        >
          <Icon name="mic" size={40} color={theme.colors.white} />
        </TouchableOpacity>
      </View>
      {isRecording && <Text style={styles.recordingText}>Recording...</Text>}
      {!isRecording && recordedPath ? (
        <>
          <TouchableOpacity style={styles.playButton} onPress={isPlaying ? stopAudio : playAudio}>
            <Icon name={isPlaying ? 'stop' : 'play-arrow'} size={32} color={theme.colors.white} />
          </TouchableOpacity>
          <Slider
            style={{ width: 180, height: 40, marginTop: 8 }}
            minimumValue={0}
            maximumValue={duration}
            value={currentPosition}
            onValueChange={seekAudio}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.gray}
            thumbTintColor={theme.colors.primary}
            disabled={!duration}
          />
          <Text style={styles.timeText}>{formatTime(currentPosition)} / {formatTime(duration)}</Text>
        </>
      ) : null}
      {recordedPath ? <Text style={styles.audioPathText}>Audio saved</Text> : null}
      {recordedPath ? <Text style={styles.audioPathText}>Audio saved</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  micButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.md,
    elevation: 2,
  },
  recordingButton: {
    backgroundColor: theme.colors.error,
  },
  recordingText: {
    color: theme.colors.error,
    fontWeight: 'bold',
    marginTop: theme.spacing.sm,
    fontSize: 16,
  },
  playButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 40,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  recordingButton: {
    backgroundColor: theme.colors.error,
    transform: [{ scale: 1.1 }],
  },
  playingButton: {
    backgroundColor: theme.colors.brown,
    transform: [{ scale: 1.1 }],
  },
  audioPathText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.gray,
    fontSize: 14,
  },
  timeText: {
    color: theme.colors.gray,
    fontSize: 13,
    marginTop: 2,
    alignSelf: 'center',
  },
});

export default AudioRecorderPlayerComponent;
