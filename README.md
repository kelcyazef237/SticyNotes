# Sticky Notes App

A modern, feature-rich React Native application for creating, editing, and managing notes with multiple input modes. This app brings the convenience of sticky notes to your mobile device with advanced features like handwriting recognition, voice recording, home screen widgets, and sharing capabilities.

## 📖 What This Project Is About

**Sticky Notes** is a cross-platform mobile application (iOS and Android) that reimagines the traditional note-taking experience. It combines the simplicity of sticky notes with powerful modern features to create a versatile note-taking solution that adapts to different user preferences and situations.

### Key Capabilities

The app supports three distinct input methods to accommodate different use cases:
- **Text Input**: Traditional keyboard typing for quick notes
- **Handwriting/Drawing**: Digital canvas for sketching ideas, diagrams, or handwritten notes with OCR support
- **Voice Recording**: Audio capture for hands-free note-taking

Beyond basic note-taking, the app includes productivity features like:
- Android home screen widgets to display notes at a glance
- Cross-app sharing to easily export notes to other applications
- OCR (Optical Character Recognition) to convert handwritten notes to searchable text
- Persistent local storage ensuring your notes are always available offline

## ✨ Features

### Core Note Management
- **Create, Edit, and Delete**: Full CRUD operations for managing your notes
- **Rich Note Structure**: Each note includes a title, content, and timestamps
- **Automatic Sorting**: Notes are automatically sorted by most recently modified
- **Quick Access**: Tap any note to instantly view or edit it

### Three Input Modes

#### 1. Typing Mode (Text Input)
- Standard text input via keyboard
- Supports multi-line content
- Real-time text editing
- Perfect for quick notes and to-do lists

#### 2. Handwriting/Drawing Mode
- Full-featured drawing canvas powered by `react-native-signature-canvas`
- Draw with finger or stylus
- Multiple pen colors and stroke widths
- Clear and undo capabilities
- **OCR Integration**: Convert handwritten notes to typed text using OCR.space API
- Save drawings as images
- Ideal for sketches, diagrams, and handwritten notes

#### 3. Voice Recording Mode
- High-quality audio recording
- Playback controls with seek functionality
- Audio file management
- Automatic permission handling
- Great for meetings, lectures, or voice memos

### Advanced Features

#### Home Screen Widgets (Android)
- Display up to 3 notes on your home screen
- Quick access to important notes without opening the app
- Auto-updates when notes are modified
- Customizable note selection (pin specific notes to widget)
- Fallback to most recent notes if no notes are pinned

#### Sharing Capabilities
- Share text notes as plain text to any app
- Share voice recordings as audio files
- Share drawings as PNG images
- Native platform sharing dialog
- Compatible with messaging apps, email, cloud storage, and more

#### Storage & Persistence
- Local storage using AsyncStorage
- No internet connection required for core functionality
- Fast read/write operations
- Automatic save on edit
- Data persists across app restarts

#### User Interface
- Professional sticky-note-inspired design
- Clean, modern Material Design components
- Smooth animations and transitions
- Custom splash screen with branding
- Intuitive navigation
- Responsive layouts

## 🏗️ Technical Architecture

### Technology Stack

**Core Framework**
- **React Native 0.79.1**: Cross-platform mobile development
- **React 19.0.0**: Latest React with concurrent features
- **TypeScript 5.0.4**: Type-safe development

**Navigation & UI**
- **React Navigation 7.x**: Native stack navigation
- **react-native-vector-icons**: Material Design icons
- **react-native-safe-area-context**: Safe area handling

**Storage & Data**
- **@react-native-async-storage/async-storage**: Local persistent storage for notes
- **uuid**: Unique identifier generation for notes

**Audio Features**
- **react-native-audio-recorder-player**: High-quality audio recording and playback
- **react-native-fs**: File system access for audio file management

**Drawing Features**
- **react-native-signature-canvas**: Canvas-based drawing and handwriting
- **react-native-webview**: WebView component for canvas rendering

**Sharing**
- **react-native-share**: Native sharing functionality

**Development Tools**
- **ESLint**: Code quality and linting
- **Jest**: Unit testing framework
- **Prettier**: Code formatting
- **Babel**: JavaScript transpilation

### Project Architecture

```
StickyNotes/
├── src/
│   ├── assets/           # Static assets (images, icons)
│   ├── components/       # Reusable UI components
│   │   ├── AudioRecorderPlayer.tsx    # Audio recording/playback component
│   │   └── NoteCard.tsx               # Note display card component
│   ├── screens/          # Application screens
│   │   ├── SplashScreen.tsx           # App startup screen
│   │   ├── HomeScreen.tsx             # Main notes list view
│   │   └── NoteDetailScreen.tsx       # Note editing interface
│   └── utils/            # Helper functions and utilities
│       ├── noteUtils.ts               # Note CRUD operations
│       ├── shareUtils.ts              # Sharing functionality
│       ├── widgetUtils.ts             # Widget management
│       ├── permissions.ts             # Permission handling
│       └── theme.ts                   # App-wide styling constants
├── android/              # Android native code
│   └── app/src/main/java/com/stickynotes/
│       ├── StickyNoteWidgetProvider.java    # Android widget provider
│       ├── StickyNoteWidgetService.java     # Widget data service
│       ├── StickyNoteWidgetModule.java      # Native module bridge
│       └── StickyNoteWidgetPackage.java     # Package configuration
├── ios/                  # iOS native code
├── App.tsx               # Main application component
└── index.js              # App entry point
```

### Data Flow

1. **Note Creation/Editing**
   - User interacts with UI (HomeScreen or NoteDetailScreen)
   - Data flows through React state management
   - Changes are persisted via `noteUtils.ts` to AsyncStorage
   - Widget updates are triggered automatically

2. **Widget Updates**
   - Notes are marked for widget display via `widgetUtils.ts`
   - Native Android module is called to refresh widget
   - Widget displays up to 3 most recent or pinned notes

3. **Sharing**
   - User initiates share action
   - `shareUtils.ts` prepares content based on note type
   - Native share dialog is presented
   - Content is shared to selected app

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 18.x
- **npm** or **yarn**: Latest version
- **React Native CLI**: Installed globally
- **Android Studio**: For Android development (with Android SDK)
- **Xcode**: For iOS development (macOS only, with CocoaPods)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kelcyazef237/SticyNotes.git
   cd SticyNotes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies** (macOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

### Running the App

#### Android
```bash
# Start Metro bundler
npm start

# In a new terminal, run Android app
npm run android
# or
npx react-native run-android
```

#### iOS (macOS only)
```bash
# Start Metro bundler
npm start

# In a new terminal, run iOS app
npm run ios
# or
npx react-native run-ios
```

### Building for Production

#### Android APK
```bash
cd android
./gradlew assembleRelease
# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

#### Android App Bundle (for Play Store)
```bash
cd android
./gradlew bundleRelease
# Bundle will be at: android/app/build/outputs/bundle/release/app-release.aab
```

#### iOS (requires Apple Developer account)
```bash
# Open Xcode
open ios/StickyNotes.xcworkspace
# Use Xcode to archive and distribute
```

## 📱 Usage Guide

### Creating Your First Note

1. **Launch the app**: You'll see the splash screen followed by the home screen
2. **Tap the + button**: Located at the bottom-right corner
3. **Choose your input mode**: Text, Drawing, or Voice
4. **Add a title**: Tap the title field to enter a name for your note
5. **Create content**: Use your selected input mode to add content
6. **Save automatically**: Notes are saved as you type/draw/record

### Using Different Input Modes

#### Text Mode
1. Tap the "Text" button at the top
2. Use the keyboard to type your note content
3. Supports multi-line text and editing
4. Changes save automatically

#### Drawing Mode
1. Tap the "Drawing" button at the top
2. Use your finger or stylus to draw on the canvas
3. Adjust pen color and width using the controls
4. Use "Clear" to start over or "Undo" to remove last stroke
5. Tap "Convert to Text" to use OCR and convert handwriting to typed text
6. Drawing is saved as a base64-encoded PNG image

#### Voice Mode
1. Tap the "Voice" button at the top
2. Grant microphone permissions if prompted
3. Tap the record button to start recording
4. Tap stop when finished
5. Use playback controls to listen to your recording
6. Audio is saved as an M4A/MP3 file

### Managing Notes

**Editing a Note**
- Tap any note card on the home screen
- Make your changes
- Changes are saved automatically

**Deleting a Note**
- Open the note you want to delete
- Tap the delete/trash icon
- Confirm deletion

**Searching Notes**
- Notes are automatically sorted by most recent
- Scroll through the list on the home screen

### Using Widgets (Android)

1. **Add Widget to Home Screen**
   - Long-press on home screen
   - Select "Widgets"
   - Find "Sticky Notes" widget
   - Drag to desired location

2. **Pin Notes to Widget**
   - Open any note
   - Tap the widget/pin icon
   - Note will appear in the widget

3. **Unpin Notes from Widget**
   - Open the pinned note
   - Tap the widget/pin icon again

The widget automatically shows:
- Up to 3 pinned notes (if any)
- Falls back to 3 most recent notes
- Updates when notes are modified

### Sharing Notes

1. **Share Text Note**
   - Open the note
   - Tap the share icon
   - Select destination app
   - Note title and content will be shared as text

2. **Share Voice Note**
   - Open a note with voice recording
   - Tap the share icon
   - Audio file will be shared

3. **Share Drawing**
   - Open a note with a drawing
   - Tap the share icon
   - Drawing will be shared as a PNG image

## 🔧 Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Code Formatting
The project uses Prettier for code formatting. Configuration is in `.prettierrc.js`.

## 🐛 Troubleshooting

### Common Issues

**Metro Bundler Port Conflict**
```bash
# Kill the process using port 8081
npx react-native start --reset-cache
```

**Android Build Failures**
```bash
# Clean build
cd android
./gradlew clean
cd ..

# Clear cache and rebuild
rm -rf android/app/build
npm run android
```

**iOS Pod Installation Issues**
```bash
# Clean and reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod deintegrate
pod install
cd ..
```

**Voice Recording Not Working**
- Ensure microphone permissions are granted in device settings
- Check that `@react-native-voice/voice` is properly linked
- On Android, verify `RECORD_AUDIO` permission in AndroidManifest.xml

**Widget Not Updating**
- Ensure the native module is properly linked
- Try removing and re-adding the widget
- Check that notes are properly saved to AsyncStorage

**Drawing Not Saving**
- Ensure sufficient device storage
- Check that WebView component is properly loaded
- Verify that `react-native-signature-canvas` is correctly installed

### Debug Mode

To run in debug mode with Chrome DevTools:
```bash
npm start
# Then press 'd' in Metro bundler and select "Debug"
```

## 📚 API Documentation

### noteUtils.ts

**`saveNote(note: Partial<Note>): Promise<Note>`**
- Creates or updates a note
- Returns the saved note with generated ID and timestamps

**`getAllNotes(): Promise<Note[]>`**
- Retrieves all notes from storage
- Returns array of Note objects

**`getNote(id: string): Promise<Note | null>`**
- Fetches a single note by ID
- Returns note or null if not found

**`deleteNote(id: string): Promise<boolean>`**
- Deletes a note by ID
- Returns true if successful, false otherwise

### shareUtils.ts

**`shareNote(note: Note): Promise<void>`**
- Shares text note content via native share dialog

**`shareVoiceNote(note: Note): Promise<void>`**
- Shares audio file from voice note

**`shareDrawingNote(note: Note): Promise<void>`**
- Converts drawing to PNG and shares via native dialog

### widgetUtils.ts

**`addNoteToWidget(noteId: string): Promise<boolean>`**
- Pins a note to the home screen widget

**`removeNoteFromWidget(noteId: string): Promise<boolean>`**
- Unpins a note from the widget

**`isNoteInWidget(noteId: string): Promise<boolean>`**
- Checks if a note is currently pinned

**`getNotesForWidget(): Promise<Note[]>`**
- Gets up to 3 notes for widget display

## ❓ FAQ

**Q: Is an internet connection required?**
A: No, the app works completely offline. The only internet-dependent feature is OCR (handwriting to text conversion), which uses the OCR.space API.

**Q: Where are my notes stored?**
A: Notes are stored locally on your device using AsyncStorage. They are not synced to the cloud.

**Q: Can I export all my notes?**
A: Currently, notes can be shared individually. Bulk export is not yet implemented.

**Q: Does the app support cloud sync?**
A: No, cloud synchronization is not currently implemented. All data remains local to your device.

**Q: What audio formats are supported for voice notes?**
A: The app records in M4A format on iOS and can handle both M4A and MP3 formats.

**Q: Can I use the app on tablets?**
A: Yes, the app is responsive and works on tablets, though it's optimized for phone screens.

**Q: Is there a limit to the number of notes?**
A: There's no hard limit, but performance may degrade with thousands of notes due to AsyncStorage limitations.

**Q: Can I customize the widget appearance?**
A: Widget styling is currently fixed but can be customized by modifying the Android widget layout XML files.

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. Create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Device and OS version
   - Screenshots if applicable

### Suggesting Features

1. Check existing feature requests in Issues
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Mockups or examples (if applicable)

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation
4. **Run tests and linting**
   ```bash
   npm test
   npm run lint
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add: brief description of changes"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**
   - Describe your changes
   - Reference any related issues
   - Include screenshots for UI changes

### Code Style Guidelines

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Keep components small and focused
- Use functional components with hooks
- Follow React Native best practices

## 🗺️ Roadmap

Potential future enhancements:

- [ ] Cloud synchronization (Firebase/iCloud)
- [ ] Search functionality
- [ ] Note categories/tags
- [ ] Rich text formatting
- [ ] Image attachments
- [ ] Note templates
- [ ] Dark mode
- [ ] Biometric lock
- [ ] Bulk operations
- [ ] iOS widget support
- [ ] Web version
- [ ] Export/Import functionality
- [ ] Reminders and notifications
- [ ] Collaborative notes
- [ ] Note encryption

## 📄 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2024 Sticky Notes App

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 👥 Authors & Acknowledgments

**Original Creator**: kelcyazef237

**Built With**:
- React Native and the amazing open-source community
- Material Design icons by Google
- OCR.space API for handwriting recognition

## 📞 Support

If you encounter issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review [FAQ](#-faq)
3. Search existing [Issues](https://github.com/kelcyazef237/SticyNotes/issues)
4. Create a new issue if needed

---

**Made with ❤️ using React Native**
