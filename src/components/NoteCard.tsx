import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Note } from '../utils/noteUtils';
import { theme } from '../utils/theme';

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
      <Text style={styles.date}>{formattedDate}</Text>
      {note.drawingPaths && (
        <View style={styles.drawingIndicator}>
          <Text style={styles.drawingIndicatorText}>✏️</Text>
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
  date: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray,
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-end',
  },
  drawingIndicator: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
  },
  drawingIndicatorText: {
    fontSize: theme.fontSize.md,
  }
});

export default NoteCard;
