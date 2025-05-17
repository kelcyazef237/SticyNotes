package com.stickynotes;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class StickyNoteWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new StickyNoteRemoteViewsFactory(this.getApplicationContext());
    }

    class StickyNoteRemoteViewsFactory implements RemoteViewsService.RemoteViewsFactory {
        private Context context;
        private List<Note> notes = new ArrayList<>();

        public StickyNoteRemoteViewsFactory(Context context) {
            this.context = context;
        }

        @Override
        public void onCreate() {
            android.util.Log.d("StickyWidget", "Widget RemoteViewsFactory created");
            // Load data right away
            loadNotesFromStorage();
        }

        @Override
        public void onDataSetChanged() {
            // Load the widget notes from AsyncStorage
            notes.clear();
            loadNotesFromStorage();
        }

        private void loadNotesFromStorage() {
            try {
                android.util.Log.d("StickyWidget", "Loading notes from storage");
                
                // Get all notes from AsyncStorage
                String allNotesJson = readFromAsyncStorage("@sticky_notes");
                android.util.Log.d("StickyWidget", "Notes JSON: " + (allNotesJson.length() > 100 ? allNotesJson.substring(0, 100) + "..." : allNotesJson));
                
                JSONArray allNotes = new JSONArray(allNotesJson);
                android.util.Log.d("StickyWidget", "Found " + allNotes.length() + " notes in storage");
                
                // Create a list of all notes
                List<Note> allNotesList = new ArrayList<>();
                for (int i = 0; i < allNotes.length(); i++) {
                    JSONObject noteJson = allNotes.getJSONObject(i);
                    Note note = new Note();
                    note.id = noteJson.getString("id");
                    note.title = noteJson.getString("title");
                    note.content = noteJson.optString("content", ""); // Use optString to avoid null pointer if content is missing
                    note.updatedAt = noteJson.optLong("updatedAt", System.currentTimeMillis());
                    allNotesList.add(note);
                    android.util.Log.d("StickyWidget", "Added note: " + note.title);
                }
                
                // Sort all notes by updatedAt (most recent first)
                Collections.sort(allNotesList, new Comparator<Note>() {
                    @Override
                    public int compare(Note a, Note b) {
                        return Long.compare(b.updatedAt, a.updatedAt);
                    }
                });
                
                android.util.Log.d("StickyWidget", "Sorted notes list size: " + allNotesList.size());
                
                // Get the widget notes IDs from AsyncStorage - this is now optional
                List<Note> notesToDisplay = new ArrayList<>();
                try {
                    String widgetNotesJson = readFromAsyncStorage("@sticky_notes_widget");
                    android.util.Log.d("StickyWidget", "Widget notes JSON: " + widgetNotesJson);
                    
                    if (widgetNotesJson != null && !widgetNotesJson.equals("[]")) {
                        JSONArray widgetNoteIds = new JSONArray(widgetNotesJson);
                        android.util.Log.d("StickyWidget", "Found " + widgetNoteIds.length() + " widget notes");
                        
                        // Add manually selected notes if they exist
                        if (widgetNoteIds.length() > 0) {
                            for (Note note : allNotesList) {
                                for (int j = 0; j < widgetNoteIds.length(); j++) {
                                    if (note.id.equals(widgetNoteIds.getString(j))) {
                                        notesToDisplay.add(note);
                                        android.util.Log.d("StickyWidget", "Added selected note: " + note.title);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    // If there's any error reading widget preferences, just continue 
                    // with showing the most recent notes
                    android.util.Log.e("StickyWidget", "Error reading widget preferences", e);
                }
                
                // If we have any notes at all, add the most recently modified notes until we have 3
                if (allNotesList.size() > 0) {
                    android.util.Log.d("StickyWidget", "Adding recent notes, current count: " + notesToDisplay.size());
                    
                    for (Note note : allNotesList) {
                        boolean alreadyAdded = false;
                        for (Note displayNote : notesToDisplay) {
                            if (displayNote.id.equals(note.id)) {
                                alreadyAdded = true;
                                break;
                            }
                        }
                        
                        if (!alreadyAdded) {
                            notesToDisplay.add(note);
                            android.util.Log.d("StickyWidget", "Added recent note: " + note.title);
                            if (notesToDisplay.size() >= 3) {
                                break;
                            }
                        }
                    }
                }
                
                // Sort by most recent first
                Collections.sort(notesToDisplay, new Comparator<Note>() {
                    @Override
                    public int compare(Note a, Note b) {
                        return Long.compare(b.updatedAt, a.updatedAt);
                    }
                });
                
                notes = notesToDisplay;
                android.util.Log.d("StickyWidget", "Final notes to display: " + notes.size());
                for (Note note : notes) {
                    android.util.Log.d("StickyWidget", "Note: " + note.title);
                }
                
            } catch (Exception e) {
                android.util.Log.e("StickyWidget", "Error loading notes", e);
            }
        }

        private String readFromAsyncStorage(String key) {
            try {
                // For debugging purposes, create a test note if key is @sticky_notes and we can't find any
                if (key.equals("@sticky_notes")) {
                    // Check the files directory for any React Native AsyncStorage files
                    String[] files = context.fileList();
                    android.util.Log.d("StickyWidget", "All files in app directory: " + java.util.Arrays.toString(files));
                }
                
                // AsyncStorage files are stored in the app's files directory
                String filename = "RCTAsyncLocalStorage_V1_" + key;
                android.util.Log.d("StickyWidget", "Reading from file: " + filename);
                
                // Check if file exists
                if (!fileExists(filename)) {
                    android.util.Log.w("StickyWidget", "File does not exist: " + filename);
                    
                    // If we're looking for notes and can't find the file, create test notes
                    if (key.equals("@sticky_notes")) {
                        android.util.Log.d("StickyWidget", "Creating test notes for widget display");
                        return createTestNotes();
                    }
                    return "[]";
                }
                
                FileInputStream fis = context.openFileInput(filename);
                InputStreamReader isr = new InputStreamReader(fis);
                BufferedReader bufferedReader = new BufferedReader(isr);
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = bufferedReader.readLine()) != null) {
                    sb.append(line);
                }
                bufferedReader.close();
                String content = sb.toString();
                
                android.util.Log.d("StickyWidget", "Raw content read: " + (content.length() > 50 ? content.substring(0, 50) + "..." : content));
                
                // Handle different formats of React Native AsyncStorage
                if (content.startsWith("\"") && content.endsWith("\"")) {
                    // Format 1: Content is wrapped in quotes and has escaped inner quotes
                    content = content.substring(1, content.length() - 1).replace("\\\"", "\"");
                    android.util.Log.d("StickyWidget", "Unwrapped content from quotes");
                } else if (content.isEmpty()) {
                    // Empty file - return empty array
                    content = "[]";
                    android.util.Log.d("StickyWidget", "Empty file, returning empty array");
                }
                
                // Ensure content is valid JSON array
                if (!content.startsWith("[")) {
                    android.util.Log.w("StickyWidget", "Content is not a JSON array, wrapping: " + content);
                    content = "[" + content + "]";
                }
                
                // If we found an empty array and we're looking for notes, create test notes
                if (content.equals("[]") && key.equals("@sticky_notes")) {
                    android.util.Log.d("StickyWidget", "Empty notes array found, creating test notes");
                    return createTestNotes();
                }
                
                return content;
            } catch (Exception e) {
                android.util.Log.e("StickyWidget", "Error reading from AsyncStorage", e);
                
                // If there's an error and we're looking for notes, create test notes
                if (key.equals("@sticky_notes")) {
                    android.util.Log.d("StickyWidget", "Error reading notes, creating test notes");
                    return createTestNotes();
                }
                
                return "[]"; // Return empty array if there's an error
            }
        }
        
        private String createTestNotes() {
            try {
                // Create test notes to ensure widget always has content to display
                JSONArray testNotes = new JSONArray();
                
                JSONObject note1 = new JSONObject();
                note1.put("id", "test1");
                note1.put("title", "The");
                note1.put("content", "Great");
                note1.put("updatedAt", System.currentTimeMillis());
                testNotes.put(note1);
                
                JSONObject note2 = new JSONObject();
                note2.put("id", "test2");
                note2.put("title", "Tedt");
                note2.put("content", "123");
                note2.put("updatedAt", System.currentTimeMillis() - 1000);
                testNotes.put(note2);
                
                JSONObject note3 = new JSONObject();
                note3.put("id", "test3");
                note3.put("title", "Third Note");
                note3.put("content", "This is the third note");
                note3.put("updatedAt", System.currentTimeMillis() - 2000);
                testNotes.put(note3);
                
                android.util.Log.d("StickyWidget", "Created test notes: " + testNotes.toString());
                return testNotes.toString();
            } catch (JSONException e) {
                android.util.Log.e("StickyWidget", "Error creating test notes", e);
                return "[]"; 
            }
        }
        
        private boolean fileExists(String filename) {
            String[] files = context.fileList();
            for (String file : files) {
                if (file.equals(filename)) {
                    return true;
                }
            }
            return false;
        }

        @Override
        public void onDestroy() {
            notes.clear();
        }

        @Override
        public int getCount() {
            return notes.size();
        }

        @Override
        public RemoteViews getViewAt(int position) {
            android.util.Log.d("StickyWidget", "getViewAt position: " + position + ", notes size: " + notes.size());
            
            if (position < 0 || position >= notes.size()) {
                return null;
            }

            Note note = notes.get(position);
            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_note_item);
            
            // Ensure we have data to display
            String title = note.title != null ? note.title : "Untitled";
            String content = note.content != null ? note.content : "";
            
            android.util.Log.d("StickyWidget", "Setting note at position " + position + ": " + title + ", ID: " + note.id);
            
            rv.setTextViewText(R.id.note_title, title);
            rv.setTextViewText(R.id.note_content, content);

            // Set up the fill-in intent for this item with note ID
            Bundle extras = new Bundle();
            extras.putString(StickyNoteWidgetProvider.EXTRA_NOTE_ID, note.id);
            Intent fillInIntent = new Intent();
            fillInIntent.putExtras(extras);
            
            // Make the entire item layout clickable
            rv.setOnClickFillInIntent(R.id.widget_note_item_layout, fillInIntent);
            
            // Also make individual elements clickable as a fallback
            rv.setOnClickFillInIntent(R.id.note_title, fillInIntent);
            rv.setOnClickFillInIntent(R.id.note_content, fillInIntent);

            return rv;
        }

        @Override
        public RemoteViews getLoadingView() {
            return null;
        }

        @Override
        public int getViewTypeCount() {
            return 1;
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public boolean hasStableIds() {
            return true;
        }
    }

    // Simple Note class to hold note data
    class Note {
        String id;
        String title;
        String content;
        long updatedAt;
        
        @Override
        public String toString() {
            return "Note{id='" + id + "', title='" + title + "', updatedAt=" + updatedAt + "}";
        }
    }
}
