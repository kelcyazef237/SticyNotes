import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, getAllNotes } from './noteUtils';
import { NativeModules, Platform } from 'react-native';

const WIDGET_NOTES_KEY = '@sticky_notes_widget';

// Get the native module if available
const { StickyNoteWidget } = NativeModules;

/**
 * Get notes selected for widget display
 */
export const getWidgetNotes = async (): Promise<string[]> => {
  try {
    const widgetNotesJson = await AsyncStorage.getItem(WIDGET_NOTES_KEY);
    return widgetNotesJson ? JSON.parse(widgetNotesJson) : [];
  } catch (error) {
    console.error('Error getting widget notes:', error);
    return [];
  }
};

/**
 * Add a note to widget display
 * @param noteId ID of the note to add to widget
 */
export const addNoteToWidget = async (noteId: string): Promise<boolean> => {
  try {
    const widgetNotes = await getWidgetNotes();
    
    // Check if note already exists in widget
    if (widgetNotes.includes(noteId)) {
      return true;
    }
    
    // Add note to widget
    widgetNotes.push(noteId);
    await AsyncStorage.setItem(WIDGET_NOTES_KEY, JSON.stringify(widgetNotes));
    
    // Update the widget if possible
    await updateWidget();
    
    return true;
  } catch (error) {
    console.error('Error adding note to widget:', error);
    return false;
  }
};

/**
 * Remove a note from widget display
 * @param noteId ID of the note to remove from widget
 */
export const removeNoteFromWidget = async (noteId: string): Promise<boolean> => {
  try {
    const widgetNotes = await getWidgetNotes();
    
    // Filter out the note
    const newWidgetNotes = widgetNotes.filter(id => id !== noteId);
    
    if (newWidgetNotes.length === widgetNotes.length) {
      return false; // Note not found
    }
    
    await AsyncStorage.setItem(WIDGET_NOTES_KEY, JSON.stringify(newWidgetNotes));
    
    // Update the widget if possible
    await updateWidget();
    
    return true;
  } catch (error) {
    console.error('Error removing note from widget:', error);
    return false;
  }
};

/**
 * Check if a note is in the widget
 * @param noteId ID of the note to check
 */
export const isNoteInWidget = async (noteId: string): Promise<boolean> => {
  try {
    const widgetNotes = await getWidgetNotes();
    return widgetNotes.includes(noteId);
  } catch (error) {
    console.error('Error checking if note is in widget:', error);
    return false;
  }
};

/**
 * Get all notes that should be displayed in the widget
 */
export const getNotesForWidget = async (): Promise<Note[]> => {
  try {
    const widgetNoteIds = await getWidgetNotes();
    const allNotes = await getAllNotes();
    
    let notesToDisplay: Note[] = [];
    
    // First add manually selected notes
    if (widgetNoteIds.length > 0) {
      notesToDisplay = allNotes.filter(note => widgetNoteIds.includes(note.id));
    }
    
    // If we have less than 3 notes or no manually selected notes,
    // add the most recently modified notes until we have 3
    if (notesToDisplay.length < 3) {
      // Sort all notes by updatedAt (most recent first)
      const recentNotes = [...allNotes].sort((a, b) => b.updatedAt - a.updatedAt);
      
      // Add recent notes that aren't already in the widget
      for (const note of recentNotes) {
        if (!notesToDisplay.some(n => n.id === note.id)) {
          notesToDisplay.push(note);
          if (notesToDisplay.length >= 3) {
            break;
          }
        }
      }
    }
    
    // Sort by most recent first
    return notesToDisplay.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Error getting notes for widget:', error);
    return [];
  }
};

/**
 * Update the widget with the latest data
 */
export const updateWidget = async (): Promise<void> => {
  if (Platform.OS === 'android' && StickyNoteWidget) {
    try {
      await StickyNoteWidget.updateWidget();
    } catch (error) {
      console.error('Error updating widget:', error);
    }
  } else {
    // iOS implementation would go here
    console.log('Widget update requested - not implemented for this platform');
  }
};
