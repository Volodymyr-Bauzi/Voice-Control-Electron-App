# Voice Commander

A production-ready, standalone Electron-based desktop application with integrated voice recognition. This app is fully self-contained and exportable as a portable .exe with no installation required for the end user.

## Features

### 🔊 Wake Word Activation
- Customizable wake word (e.g., "Hey John" instead of "Hey Google")
- Passive background listening until activated by voice
- Uses Porcupine by Picovoice for offline wake word detection

### 🗣️ Voice Recognition and Command Mapping
- Listens for specific user-defined voice commands after wake word detection
- Support for non-native English speakers with custom pronunciation mapping
- Uses Vosk for offline speech recognition

### 🗂️ Voice-to-File/Program Mapping
- Configure a folder to store files, shortcuts, or scripts
- Assign custom voice commands to each item
- Auto-refresh mappings when files change
- Launch mapped files/scripts via child_process.spawn

### 🧠 Handling Recognition Errors
- Displays recognized phrases in the UI
- Allows correction of mismatches
- Stores corrections for improved recognition

### 🖥️ Interact with Opened Programs
- Simulates keyboard input for controlling active applications
- Extensible architecture for app-specific handlers
- Uses robotjs for cross-platform keyboard and mouse simulation

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/voice-commander.git
cd voice-commander
```

2. Install dependencies:
```
npm install
```

3. Start the application:
```
npm start
```

### Building the Portable Executable

To build a standalone .exe file:

```
npm run build
```

This will create a portable executable in the `dist` folder that can be run without installation.

## Configuration

### Wake Word

Voice Commander uses Picovoice's Porcupine for wake word detection. The free version includes several built-in wake words:
- "Alexa"
- "Computer"
- "Hey Google"
- "Hey Siri"
- "Jarvis"
- "Ok Google"
- "Picovoice"
- "Porcupine"
- "Bumblebee"

For custom wake words, you'll need to create them using Picovoice Console and add the .ppn file to the resources/models/keywords folder.

### Voice Recognition

The app uses Vosk for offline speech recognition. The default small English model is included, but you can download larger models for better accuracy from the [Vosk website](https://alphacephei.com/vosk/models).

### Custom Pronunciation

You can add custom pronunciations for words that are difficult to recognize, especially for non-native speakers. Use the Phonetics tab in the application to add these mappings.

## Project Structure

```
voice-commander/
├── resources/                  # Resources for the application
│   ├── models/                 # Speech recognition and wake word models
│   │   ├── vosk/               # Vosk speech recognition models
│   │   └── keywords/           # Custom wake word models
│   └── icon.ico                # Application icon
├── src/                        # Source code
│   ├── main/                   # Main process code
│   │   ├── main.js             # Main entry point
│   │   ├── preload.js          # Preload script for secure IPC
│   │   ├── wakeword.js         # Wake word detection module
│   │   ├── voiceRecognition.js # Voice recognition module
│   │   ├── commandManager.js   # Command management module
│   │   └── inputSimulator.js   # Keyboard/mouse simulation module
│   ├── renderer/               # Renderer process code
│   │   ├── index.html          # Main HTML file
│   │   ├── styles.css          # CSS styles
│   │   └── renderer.js         # Renderer JavaScript
│   └── assets/                 # Application assets
├── package.json                # Project configuration
└── README.md                   # Project documentation
```

## Technical Details

### Offline Operation

Voice Commander is designed to work completely offline:

- **Wake Word Detection**: Porcupine runs locally on your device
- **Speech Recognition**: Vosk processes audio locally without sending data to the cloud
- **Command Execution**: All commands are processed and executed locally

### Memory Usage and Performance

- **Wake Word Detection**: ~5-20MB RAM
- **Speech Recognition**: ~50-200MB RAM (depending on model size)
- **Total Application**: ~150-300MB RAM during normal operation

### Packaging as Standalone .exe

The application is packaged using electron-builder with the following configuration:

- `asar: true` to bundle app code
- `asarUnpack` for native modules that need direct filesystem access
- Bundled models and resources in the executable
- Portable build target for zero-installation operation

## License

MIT

## Acknowledgements

- [Electron](https://www.electronjs.org/)
- [Picovoice Porcupine](https://picovoice.ai/platform/porcupine/)
- [Vosk](https://alphacephei.com/vosk/)
- [RobotJS](http://robotjs.io/)
