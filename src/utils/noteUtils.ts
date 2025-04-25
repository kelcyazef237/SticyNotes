import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Polyfill for uuid v4 for React Native
function uuidv4() {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    // Use Math.random for React Native
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  } else {
    // fallback or web
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

export interface Note {
  id: string;
  title: string;
  content: string;
  drawingPaths?: string;
  audioPath?: string, // Path to recorded voice note
  createdAt: number;
  updatedAt: number;
}

const NOTES_STORAGE_KEY = '@sticky_notes';

export const saveNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Note> => {
  try {
    const timestamp = Date.now();
    const notes = await getAllNotes();
    
    let savedNote: Note;
    
    if (note.id) {
      // Update existing note
      const existingNoteIndex = notes.findIndex(n => n.id === note.id);
      if (existingNoteIndex >= 0) {
        savedNote = {
          ...notes[existingNoteIndex],
          ...note,
          updatedAt: timestamp
        };
        notes[existingNoteIndex] = savedNote;
      } else {
        throw new Error('Note not found');
      }
    } else {
      // Create new note
      savedNote = {
        ...note,
        id: note.id || uuidv4(),
        createdAt: (note as any).createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      notes.push(savedNote);
    }
    
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    return savedNote;
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
};

export const getAllNotes = async (): Promise<Note[]> => {
  try {
    const notesJson = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
    return notesJson ? JSON.parse(notesJson) : [];
  } catch (error) {
    console.error('Error getting notes:', error);
    return [];
  }
};

export const getNote = async (id: string): Promise<Note | null> => {
  try {
    const notes = await getAllNotes();
    return notes.find(note => note.id === id) || null;
  } catch (error) {
    console.error('Error getting note:', error);
    return null;
  }
};

export const deleteNote = async (id: string): Promise<boolean> => {
  try {
    const notes = await getAllNotes();
    const newNotes = notes.filter(note => note.id !== id);
    
    if (notes.length === newNotes.length) {
      return false; // Note not found
    }
    
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(newNotes));
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    return false;
  }
};
