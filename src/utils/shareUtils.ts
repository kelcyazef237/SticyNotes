import Share from 'react-native-share';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { Note } from './noteUtils';

/**
 * Share a note's content via the device's share dialog
 * @param note The note to share
 */
export const shareNote = async (note: Note): Promise<void> => {
  try {
    const message = `${note.title}\n\n${note.content}`;
    const shareOptions = {
      title: 'Share Note',
      message,
    };
    
    await Share.open(shareOptions);
  } catch (error) {
    console.error('Error sharing note:', error);
    throw error;
  }
};

/**
 * Share a voice note via the device's share dialog
 * @param note The note containing the voice recording to share
 */
export const shareVoiceNote = async (note: Note): Promise<void> => {
  if (!note.audioPath) {
    throw new Error('No audio file to share');
  }

  try {
    const extension = note.audioPath.split('.').pop();
    const mimeType = extension === 'mp3' ? 'audio/mp3' : 'audio/m4a';
    
    // For Android, we need to ensure the file path is accessible
    let filePath = note.audioPath;
    
    // On Android, we might need to copy the file to a shareable location
    if (Platform.OS === 'android' && !filePath.startsWith('file://')) {
      filePath = `file://${filePath}`;
    }
    
    const shareOptions = {
      title: 'Share Voice Note',
      message: note.title,
      url: filePath,
      type: mimeType,
    };
    
    await Share.open(shareOptions);
  } catch (error) {
    console.error('Error sharing voice note:', error);
    throw error;
  }
};

/**
 * Share a drawing note via the device's share dialog
 * @param note The note containing the drawing to share
 */
export const shareDrawingNote = async (note: Note): Promise<void> => {
  if (!note.drawingPaths) {
    throw new Error('No drawing to share');
  }

  try {
    // The drawing is stored as a base64 string
    let base64Data = note.drawingPaths;
    
    // If it's a data URL, extract just the base64 part
    if (base64Data.startsWith('data:image')) {
      base64Data = base64Data.split(',')[1];
    }
    
    // Create a temporary file to share
    const tempFilePath = `${RNFS.CachesDirectoryPath}/drawing-${Date.now()}.png`;
    
    // Write the base64 data to a file
    await RNFS.writeFile(tempFilePath, base64Data, 'base64');
    
    const shareOptions = {
      title: 'Share Drawing',
      message: note.title,
      url: `file://${tempFilePath}`,
      type: 'image/png',
    };
    
    await Share.open(shareOptions);
    
    // Clean up the temporary file after sharing
    setTimeout(() => {
      RNFS.unlink(tempFilePath).catch(err => 
        console.error('Error cleaning up temp file:', err)
      );
    }, 5000);
  } catch (error) {
    console.error('Error sharing drawing:', error);
    throw error;
  }
};
