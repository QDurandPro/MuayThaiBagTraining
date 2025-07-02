# Muay Thai Bag Training App

This is a React Native app built with [Expo](https://expo.dev) for Muay Thai heavy bag training.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npm start
   ```

   Or use one of the platform-specific commands:

   ```bash
   npm run android  # Start on Android
   npm run ios      # Start on iOS
   npm run web      # Start on web
   ```

## Connecting a device or simulator

If you see the error "No apps connected. Sending 'reload' to all React Native apps failed", follow these steps:

### For iOS Simulator:
1. Make sure you have Xcode installed
2. Start an iOS simulator before running `npm run ios`
3. Or press `i` in the terminal after running `npm start`

### For Android Emulator:
1. Make sure you have Android Studio installed with an emulator set up
2. Start an Android emulator before running `npm run android`
3. Or press `a` in the terminal after running `npm start`

### For physical devices:
1. Install the Expo Go app on your device
2. Scan the QR code displayed in the terminal with your device's camera
3. Make sure your device is on the same network as your computer

### Troubleshooting Connection Issues:
1. Make sure your device/emulator is connected to the same network as your computer
2. Try restarting the Expo development server with `npm start -- --clear`
3. Check your firewall settings to ensure it's not blocking the connection
4. On Android, try using the "tunnel" connection method: `npm start -- --tunnel`
5. On iOS, ensure that your device trusts the development certificate

### Using Expo Go:
- [Expo Go for iOS](https://apps.apple.com/app/expo-go/id982107779)
- [Expo Go for Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
