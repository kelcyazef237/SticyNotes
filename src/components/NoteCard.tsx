import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Note } from '../utils/noteUtils';
import { theme } from '../utils/theme';
import { shareNote, shareVoiceNote, shareDrawingNote } from '../utils/shareUtils';

interface NoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
}

const getRandomColor = () => {
  const colors = [
    theme.colors.secondary,
    theme.colors.tertiary,
    '#FFECB3', // Light amber
    '#FFE0B2', // Light orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const NoteCard: React.FC<NoteCardProps> = ({ note, onPress }) => {
  // Truncate content to show only a preview
  const contentPreview = note.content.length > 80 
    ? `${note.content.substring(0, 80)}...` 
    : note.content;
  
  // Format date
  const formattedDate = new Date(note.updatedAt).toLocaleDateString();
  
  const handleShare = async (e: any) => {
    e.stopPropagation(); // Prevent triggering the card's onPress
    
    try {
      if (note.audioPath) {
        await shareVoiceNote(note);
      } else if (note.drawingPaths) {
        await shareDrawingNote(note);
      } else {
        await shareNote(note);
      }
    } catch (error) {
      console.error('Error sharing note:', error);
    }
  };
  
  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: getRandomColor() }]}
      onPress={() => onPress(note)}
      activeOpacity={0.8}
    >
      <Text style={styles.title} numberOfLines={1}>
        {note.title || 'Untitled Note'}
      </Text>
      <Text style={styles.content} numberOfLines={3}>
        {contentPreview}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.date}>{formattedDate}</Text>
        <TouchableOpacity 
          style={styles.shareButton} 
          onPress={handleShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="share" size={18} color={theme.colors.brown} />
        </TouchableOpacity>
      </View>
      {note.drawingPaths && (
        <View style={styles.drawingIndicator}>
          <Text style={styles.drawingIndicatorText}>✏️</Text>
        </View>
      )}
      {note.audioPath && (
        <View style={styles.audioIndicator}>
          <Text style={styles.audioIndicatorText}>🎤</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    minHeight: 120,
    elevation: 2,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.brown,
    marginBottom: theme.spacing.xs,
  } as const,
  content: {
    fontSize: theme.fontSize.md,
    color: theme.colors.black,
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  date: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray,
  },
  shareButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  drawingIndicator: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
  },
  drawingIndicatorText: {
    fontSize: theme.fontSize.md,
  },
  audioIndicator: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs * 4,
  },
  audioIndicatorText: {
    fontSize: theme.fontSize.md,
  }
});

export default NoteCard;
