# Sticky Notes App

A modern, professional React Native app for creating, editing, and managing notes with multiple input modes.

## Features

- **Notes Management**: Create, edit, and delete notes with titles and content
- **Three Input Modes**:
  - **Typing Mode**: Standard text input via keyboard
  - **Handwriting Mode**: Draw/write with finger or stylus on a canvas
  - **Voice Mode**: Dictate notes using speech-to-text
- **Persistent Storage**: All notes are saved locally using AsyncStorage
- **Professional UI**: Sticky-note-inspired color palette with clean, modern design
- **Splash Screen**: Custom app logo with loading animation

## Technical Stack

- React Native (latest stable)
- AsyncStorage for local storage
- @react-native-voice/voice for speech-to-text
- @terrylinla/react-native-sketch-canvas for handwriting
- react-native-vector-icons for icons
- uuid for unique note IDs

## Installation

```bash
# Install dependencies
npm install

# For iOS (requires macOS)
cd ios && pod install && cd ..
```

## Running the App

### Android

```bash
npx react-native run-android
```

### iOS (requires macOS)

```bash
npx react-native run-ios
```

## Project Structure

```
src/
  ├── assets/        # Images and other static assets
  ├── components/    # Reusable UI components
  ├── screens/       # App screens
  ├── utils/         # Utility functions and constants
```

## Usage

1. **Home Screen**: View all your notes in a list format
2. **Create Note**: Tap the + button to create a new note
3. **Edit Note**: Tap on any note to edit it
4. **Switch Input Mode**: Use the mode selector at the top of the note screen
5. **Delete Note**: Use the delete button to remove a note

## License

MIT
# StickNotes
