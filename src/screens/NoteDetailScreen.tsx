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
  ScrollView,
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
          'apikey': 'K84933468188957',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'base64Image': `data:image/png;base64,${base64}`,
          'language': 'eng',
          'scale': 'true',
          'OCREngine': '2',
        }).toString(),
      });

      const data = await response.json();
      if (data.IsErroredOnProcessing) {
        throw new Error(data.ErrorMessage[0]);
      }

      const parsedText = data.ParsedResults[0]?.ParsedText || '';
      setNote(prev => ({ ...prev, content: parsedText }));
      
      // Save the note with the OCR text
      handleSave();
      
      Alert.alert('Text Converted', 'Your handwriting has been converted to text.');
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('Conversion Failed', 'Could not convert your handwriting to text. Please try again.');
    }
  };

  const [note, setNote] = useState<Note>({
    id: '',
    title: '',
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [audioPath, setAudioPath] = useState<string | undefined>(undefined);
  const sketchRef = useRef<any>(null);

  useEffect(() => {
    const loadNote = async () => {
      const { noteId } = route.params || {};
      
      if (noteId) {
        try {
          const loadedNote = await getNote(noteId);
          if (loadedNote) {
            setNote(loadedNote);
            if (loadedNote.audioPath) {
              setAudioPath(loadedNote.audioPath);
            }
          }
        } catch (error) {
          console.error('Failed to load note:', error);
          Alert.alert('Error', 'Failed to load note');
        }
      }
      
      setIsLoading(false);
    };
    
    loadNote();
  }, [route.params]);

  const handleSave = async () => {
    if (!note.title.trim()) {
      Alert.alert('Error', 'Please enter a title for your note');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const updatedNote = {
        ...note,
        updatedAt: new Date().toISOString(),
      };
      
      await saveNote(updatedNote);
      setIsSaving(false);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save note:', error);
      Alert.alert('Error', 'Failed to save note');
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            if (note.id) {
              try {
                await deleteNote(note.id);
                navigation.goBack();
              } catch (error) {
                console.error('Failed to delete note:', error);
                Alert.alert('Error', 'Failed to delete note');
              }
            } else {
              navigation.goBack();
            }
          }
        }
      ]
    );
  };

  const renderInputMode = () => {
    switch (inputMode) {
      case 'text':
        return (
          <TextInput
            style={styles.contentInput}
            placeholder="Start typing your note here..."
            value={note.content}
            onChangeText={(text) => setNote({ ...note, content: text })}
            multiline
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect
          />
        );
      case 'drawing':
        return (
          <ScrollView style={styles.drawingScrollContainer} contentContainerStyle={styles.drawingContentContainer}>
            {/* Converted text display */}
            {note.content ? (
              <View style={{
                padding: 12,
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: 8,
                marginBottom: 12,
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.primary,
              }}>
                <Text style={{ fontSize: 14, color: theme.colors.gray, marginBottom: 4 }}>Converted Text:</Text>
                <Text style={{ fontSize: 16, color: theme.colors.darkGray }}>{note.content}</Text>
              </View>
            ) : null}
            
            {/* Drawing canvas section - note the borderWidth to clearly show drawing boundaries */}
            <View style={{ 
              height: 400, 
              position: 'relative',
              borderWidth: 1, 
              borderColor: theme.colors.lightGray,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: theme.colors.white, // Set background to match the canvas
              marginBottom: 16,
            }}>
              <SignatureCanvas
                ref={sketchRef}
                onOK={data => {
                  setNote(prev => ({ ...prev, drawingPaths: data }));
                  if (pendingConvertToText.current) {
                    handleConvertToText(data);
                    pendingConvertToText.current = false;
                  }
                }}
                webStyle={`.m-signature-pad--footer {display: none;} .m-signature-pad { box-shadow: none; border: none; }`}
                backgroundColor={theme.colors.white}
                penColor={theme.colors.brown}
                descriptionText=""
                clearText="Clear"
                confirmText="Done"
                autoClear={false}
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
              
              {/* Undo/Redo buttons */}
              <View style={{
                position: 'absolute',
                top: 8,
                right: 8,
                flexDirection: 'row',
                zIndex: 10,
              }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(60, 60, 60, 0.7)',
                    borderRadius: 20,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 8,
                  }}
                  accessibilityLabel="Undo"
                  onPress={() => sketchRef.current && sketchRef.current.undo && sketchRef.current.undo()}
                >
                  <Icon name="undo" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(60, 60, 60, 0.7)',
                    borderRadius: 20,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  accessibilityLabel="Redo"
                  onPress={() => sketchRef.current && sketchRef.current.redo && sketchRef.current.redo()}
                >
                  <Icon name="redo" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Convert to Text button */}
            <TouchableOpacity
              style={{ 
                backgroundColor: theme.colors.primary, 
                padding: 12, 
                borderRadius: 8, 
                alignItems: 'center', 
                marginTop: 12,
                marginBottom: 24,
              }}
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
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Convert to Text</Text>
            </TouchableOpacity>
          </ScrollView>
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
      {/* Sticky, visually distinct header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={navigation.goBack} accessibilityLabel="Back">
          <Icon name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <TextInput
          style={styles.titleInput}
          placeholder="Note title..."
          value={note.title}
          onChangeText={(text) => setNote({ ...note, title: text })}
          maxLength={100}
          accessibilityLabel="Note title"
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving} accessibilityLabel="Save note">
          {isSaving ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Icon name="save" size={24} color={theme.colors.white} />
          )}
        </TouchableOpacity>
      </View>
      {/* Mode selector with clear icons and highlight */}
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
      {/* Main content area with card-like appearance */}
      <View style={styles.contentCard}>
        {/* Section title and divider */}
        <Text style={styles.sectionTitle}>
          {inputMode === 'text' && 'Text Note'}
          {inputMode === 'drawing' && 'Handwriting'}
          {inputMode === 'voice' && 'Voice Note'}
        </Text>
        <View style={styles.sectionDivider} />
        {renderInputMode()}
      </View>
      {/* Floating delete button in bottom right - only visible in text mode */}
      {inputMode === 'text' && (
        <TouchableOpacity style={styles.fabDeleteButton} onPress={handleDelete} accessibilityLabel="Delete note">
          <Icon name="delete" size={28} color={theme.colors.white} />
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create<any>({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  contentCard: {
    backgroundColor: theme.colors.secondary,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    justifyContent: 'flex-start',
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.brown,
    marginBottom: theme.spacing.sm,
    alignSelf: 'flex-start',
    letterSpacing: 0.5,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.colors.lightGray,
    marginBottom: theme.spacing.md,
    width: '100%',
    borderRadius: 1,
  },
  fabDeleteButton: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    backgroundColor: theme.colors.error,
    borderRadius: 32,
    padding: theme.spacing.lg,
    elevation: 6,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  // Removed earlier definitions for header, backButton, titleInput, saveButton. Will keep only the last definitions below.

  // Final, non-duplicated style definitions below:
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
  floatingToolbar: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10,
  },
  toolbarButton: {
    margin: 5,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  voiceContainer: {
    flex: 1,
  },
  voiceInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: theme.fontSize.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    elevation: 4,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  titleInput: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
  },
  saveButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  drawingScrollContainer: {
    flex: 1,
  },
  drawingContentContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
});

export default NoteDetailScreen;
