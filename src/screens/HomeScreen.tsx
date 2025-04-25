import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Note, getAllNotes } from '../utils/noteUtils';
import NoteCard from '../components/NoteCard';
import { theme } from '../utils/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  NoteDetail: { noteId?: string };
};

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const allNotes = await getAllNotes();
      // Sort notes by updatedAt (most recent first)
      allNotes.sort((a, b) => b.updatedAt - a.updatedAt);
      setNotes(allNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload notes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  const handleNotePress = (note: Note) => {
    navigation.navigate('NoteDetail', { noteId: note.id });
  };

  const handleAddNote = () => {
    navigation.navigate('NoteDetail', {});
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="note" size={80} color={theme.colors.lightGray} />
      <Text style={styles.emptyText}>No notes yet</Text>
      <Text style={styles.emptySubText}>
        Tap the + button to create your first note
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sticky Notes</Text>
      </View>

      <FlatList
        data={notes}
        renderItem={({ item }) => (
          <NoteCard note={item} onPress={handleNotePress} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!isLoading ? renderEmptyList : null}
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddNote}>
        <Icon name="add" size={24} color={theme.colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    elevation: 4,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  } as const,
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl * 2, // Extra space for FAB
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.xxl * 2,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray,
    marginTop: theme.spacing.md,
  } as const,
  emptySubText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});

export default HomeScreen;
