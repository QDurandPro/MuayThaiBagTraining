# Sound Files for Muay Thai Bag Training App

## Required Sound Files

### beep.mp3
This file is used for timer notifications in the app. It should be a short, clear beep sound.

## How to Download beep.mp3

### Option 1: Direct Download (Recommended)
1. Click on this URL: [Download beep.mp3](https://soundbible.com/mp3/Electronic_Chime-KevanGC-495939803.mp3)
2. Your browser will either play the sound or download it automatically
3. If it plays in the browser:
   - Right-click on the page and select "Save Audio As..." or "Download Audio"
   - Save the file as `beep.mp3`

### Option 2: Alternative Sources
- Download a free beep sound from sites like [Freesound](https://freesound.org/search/?q=beep)
- Create your own using audio software
- Use a system sound converted to MP3

## Where to Place the File
1. Save the file as `beep.mp3`
2. Place it in the `assets/sounds/` directory of your project
3. The full path should be: `[your-project-path]/muay_thai_bag_training/assets/sounds/beep.mp3`

### Using Terminal/Command Line (Alternative Method)
If you're comfortable with the command line, you can download the file directly to the correct location:

#### For macOS/Linux:
```bash
# Navigate to your project's assets/sounds directory
cd /path/to/your/muay_thai_bag_training/assets/sounds

# Download the file using curl
curl -o beep.mp3 https://soundbible.com/mp3/Electronic_Chime-KevanGC-495939803.mp3
```

#### For Windows:
```bash
# Navigate to your project's assets/sounds directory
cd C:\path\to\your\muay_thai_bag_training\assets\sounds

# Download the file using PowerShell
powershell -command "Invoke-WebRequest -Uri 'https://soundbible.com/mp3/Electronic_Chime-KevanGC-495939803.mp3' -OutFile 'beep.mp3'"
```

## Sound Requirements
- Keep sound files small (under 100KB if possible)
- Use MP3 format for best compatibility
- The beep sound should be short (0.5-1 second) and clear

## Note About Audio Implementation
This app uses the expo-av package for audio functionality. The package provides a comprehensive API for playing sounds and managing audio playback.

## Troubleshooting

### If you can't download the file:
1. Try a different browser
2. Check your internet connection
3. Try the alternative download URL: [Alternative beep sound](https://www.soundjay.com/buttons/sounds/beep-07.mp3)
4. If all else fails, you can use any short MP3 file and rename it to beep.mp3

### If the app can't find the sound file:
1. Make sure the file is named exactly `beep.mp3` (case sensitive)
2. Verify the file is in the correct location: `/assets/sounds/beep.mp3`
3. Restart your development server with `npm start -- --clear`
4. Check the app logs for any error messages related to sound loading

### If the sound doesn't play:
1. Make sure the beep.mp3 file is correctly placed in this directory
2. Verify you have the correct version of expo-av installed: `npx expo install expo-av`
3. Check that your device's volume is turned up
4. Ensure the app has audio permissions if required
