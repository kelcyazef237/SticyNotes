import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AudioRecorderPlayerComponent from '../components/AudioRecorderPlayer';
import { requestAudioPermissions } from '../utils/permissions';
import RNFS from 'react-native-fs';
import SignatureCanvas from 'react-native-signature-canvas';
import { theme } from '../utils/theme';
import { Note, saveNote, getNote, deleteNote } from '../utils/noteUtils';

type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  NoteDetail: { noteId?: string };
};

type NoteDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NoteDetail'>;
  route: RouteProp<RootStackParamList, 'NoteDetail'>;
};

type InputMode = 'text' | 'drawing' | 'voice';

const NoteDetailScreen: React.FC<NoteDetailScreenProps> = ({ navigation, route }) => {
  const pendingConvertToText = useRef(false);
  // Handles sending the base64 drawing to OCR.Space and updating note content
  const handleConvertToText = async (drawingData: string) => {
    try {
      // Prepare base64 without prefix
      let base64 = drawingData;
      if (base64.startsWith('data:image')) {
        base64 = base64.split(',')[1];
      }
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': 'K84989546688957',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `base64Image=data:image/png;base64,${encodeURIComponent(base64)}&OCREngine=2&isTable=false&scale=true&detectOrientation=true&language=eng`,
      });
      const result = await response.json();
      const parsed = result?.ParsedResults?.[0]?.ParsedText || '';
      if (parsed.trim()) {
        setNote(prev => ({ ...prev, content: parsed }));
        Alert.alert('Success', 'Handwriting converted to text!');
      } else {
        Alert.alert('No text found', 'Could not recognize any text from your handwriting.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to convert handwriting to text.');
    }
  };

  const [note, setNote] = useState<Partial<Note>>({
    title: '',
    content: '',
    drawingPaths: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [audioPath, setAudioPath] = useState<string | undefined>(note.audioPath);

  // Utility to get a safe audio file path
  const getAudioFilePath = () => {
    return `${RNFS.DocumentDirectoryPath}/sticky_note_${Date.now()}.m4a`;
  }
  const sketchRef = useRef<any>(null);
  const contentInputRef = useRef<TextInput>(null);
  const { noteId } = route.params || {};
  const isNewNote = !noteId;

  // Handle audio recording permissions and path

  // Load note data
  useEffect(() => {
    const loadNoteData = async () => {
      if (noteId) {
        try {
          const fetchedNote = await getNote(noteId);
          if (fetchedNote) {
            setNote(fetchedNote);
          } else {
            Alert.alert('Error', 'Note not found');
            navigation.goBack();
          }
        } catch (error) {
          console.error('Error loading note:', error);
          Alert.alert('Error', 'Failed to load note');
          navigation.goBack();
        }
      }
      setIsLoading(false);
    };
    loadNoteData();
  }, [noteId, navigation]);



  const handleSave = async () => {
    // Validate note has at least a title, content, drawing, or audio
    if ((!note.title || note.title.trim() === '') && 
        (!note.content || note.content.trim() === '') && 
        (!note.drawingPaths || note.drawingPaths === '') &&
        (!audioPath)) {
      Alert.alert('Error', 'Note must have a title, content, drawing, or voice note');
      return;
    }
    
    setIsSaving(true);
    try {
      // No need to get drawing paths; drawingPaths is already set by SignatureCanvas onOK
      // Save the note, including audioPath
      await saveNote({ ...note, audioPath } as Note);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (isNewNote) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (noteId) {
                await deleteNote(noteId);
              }
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };



  const renderInputMode = () => {
    switch (inputMode) {
      case 'text':
        return (
          <TextInput
            ref={contentInputRef}
            style={styles.contentInput}
            placeholder="Note content..."
            value={note.content}
            onChangeText={(text) => setNote({ ...note, content: text })}
            multiline
            autoFocus={isNewNote}
          />
        );
      case 'drawing':
        return (
          <View style={styles.canvasContainer}>
            {/* Recognized text at the top */}
            {note.content ? (
              <View style={{ marginBottom: 10, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 }}>
                <Text style={{ color: theme.colors.brown }}>Recognized Text:</Text>
                <Text style={{ color: theme.colors.darkGray, marginTop: 4 }}>{note.content}</Text>
              </View>
            ) : null}
            {/* Drawing panel in the middle */}
            <SignatureCanvas
              ref={sketchRef}
              onOK={data => {
                setNote(prev => ({ ...prev, drawingPaths: data }));
                if (pendingConvertToText.current) {
                  handleConvertToText(data);
                  pendingConvertToText.current = false;
                }
              }}
              webStyle={`.m-signature-pad--footer {display: none;}`}
              backgroundColor={theme.colors.white}
              penColor={theme.colors.brown}
              descriptionText="Write by hand, then tap Convert to Text"
              clearText="Clear"
              confirmText="Done"
              autoClear={false}
              style={styles.canvas}
            />
            {/* Convert to Text button below the drawing panel */}
            <TouchableOpacity
              style={{ backgroundColor: theme.colors.primary, padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 }}
              onPress={async () => {
                if (!note.drawingPaths) {
                  // If no drawingPaths, trigger signature read and process in onOK
                  pendingConvertToText.current = true;
                  if (sketchRef.current && sketchRef.current.readSignature) {
                    sketchRef.current.readSignature();
                  } else {
                    Alert.alert('No handwriting', 'Please write something before converting.');
                  }
                  return;
                }
                // If drawingPaths exists, proceed
                handleConvertToText(note.drawingPaths);
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Convert to Text</Text>
            </TouchableOpacity>
          </View>
        );
      case 'voice':
        return (
          <View style={styles.voiceContainer}>
            {/* Text input at the top */}
            <TextInput
              style={styles.voiceInput}
              placeholder="Add a description or text for your voice note..."
              value={note.content}
              onChangeText={(text) => setNote({ ...note, content: text })}
              multiline
            />
            {/* Audio playback/recording UI (with mic button) below text input */}
            <AudioRecorderPlayerComponent
              audioPath={audioPath}
              onRecorded={path => {
                setAudioPath(path);
                setNote(prev => ({ ...prev, audioPath: path }));
              }}
            />
          </View>
        );
      default:
        return null;
    }
  };



  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={navigation.goBack}>
          <Icon name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <TextInput
          style={styles.titleInput}
          placeholder="Note title..."
          value={note.title}
          onChangeText={(text) => setNote({ ...note, title: text })}
          maxLength={100}
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Icon name="save" size={24} color={theme.colors.white} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'text' && styles.activeModeButton]}
          onPress={() => setInputMode('text')}
        >
          <Icon name="edit" size={24} color={inputMode === 'text' ? theme.colors.primary : theme.colors.gray} />
          <Text style={[styles.modeButtonText, inputMode === 'text' && styles.activeModeButtonText]}>Type</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'drawing' && styles.activeModeButton]}
          onPress={() => setInputMode('drawing')}
        >
          <Icon name="brush" size={24} color={inputMode === 'drawing' ? theme.colors.primary : theme.colors.gray} />
          <Text style={[styles.modeButtonText, inputMode === 'drawing' && styles.activeModeButtonText]}>Draw</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'voice' && styles.activeModeButton]}
          onPress={() => setInputMode('voice')}
        >
          <Icon name="mic" size={24} color={inputMode === 'voice' ? theme.colors.primary : theme.colors.gray} />
          <Text style={[styles.modeButtonText, inputMode === 'voice' && styles.activeModeButtonText]}>Voice</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {renderInputMode()}
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Icon name="delete" size={24} color={theme.colors.white} />
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create<any>({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    elevation: 4,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  titleInput: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
    marginHorizontal: theme.spacing.md,
  },
  saveButton: {
    padding: theme.spacing.xs,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeModeButton: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  modeButtonText: {
    fontSize: theme.fontSize.md,
    marginLeft: theme.spacing.xs,
    color: theme.colors.gray,
  },
  activeModeButtonText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  contentInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    textAlignVertical: 'top',
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
  },
  canvas: {
    flex: 1,
    backgroundColor: theme.colors.tertiary,
  },
  canvasToolbar: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    elevation: 2,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  canvasButton: {
    padding: theme.spacing.xs,
  },
  voiceContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.secondary,
  },
  voiceScroll: {
    width: '100%',
    flexGrow: 1,
    marginBottom: theme.spacing.md,
  },
  voiceInput: {
    width: '100%',
    minHeight: 100,
    fontSize: theme.fontSize.md,
    color: theme.colors.black,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.sm,
  },
  partialResultsContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  partialResultsTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xs,
  },
  partialResultsText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.darkGray,
    fontStyle: 'italic',
  },
  voiceActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: theme.spacing.sm,
  },
  voiceButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 50, // Make it circular
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
  },
  voiceRecordingButton: {
    backgroundColor: theme.colors.error, // Use error color when recording
    transform: [{ scale: 1.1 }], // Make it slightly bigger when recording
  },
  voiceHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  deleteButton: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    backgroundColor: theme.colors.error,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default NoteDetailScreen;