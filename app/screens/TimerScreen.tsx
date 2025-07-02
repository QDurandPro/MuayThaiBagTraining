import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Alert, AppState } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { TrainingSet } from '../types';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

const STORAGE_KEY = '@training_sets';

// Timer states
enum TimerState {
  READY = 'ready',
  ROUND = 'round',
  REST = 'rest',
  COMPLETE = 'complete'
}

// Audio configuration
const AUDIO_CONFIG = {
  // Whether to use Text-to-Speech announcements
  enableTTS: true,
  // Whether to play beep sounds
  enableBeeps: true,
  // Volume of beep sounds (0.0 to 1.0)
  beepVolume: 0.7,
  // Whether to play countdown beeps during the last 10 seconds
  enableCountdownBeeps: true
}

const TimerScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const trainingSetId = params.trainingSetId as string;

  // Training set state
  const [trainingSet, setTrainingSet] = useState<TrainingSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>(TimerState.READY);
  const [currentRound, setCurrentRound] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Audio state
  const [soundLoaded, setSoundLoaded] = useState(false);
  const beepSoundRef = useRef<Audio.Sound | null>(null);

  // Load and setup audio
  useEffect(() => {
    // Function to load the beep sound
    const loadSound = async () => {
      try {
        // Initialize audio
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        try {
          // Try to load beep sound
          const { sound } = await Audio.Sound.createAsync(
            require('../../assets/sounds/beep.mp3'),
            { volume: AUDIO_CONFIG.beepVolume }
          );

          beepSoundRef.current = sound;
          setSoundLoaded(true);
        } catch (soundError) {
          console.error('Error loading beep.mp3:', soundError);

          // If beep.mp3 is not found, create a fallback sound
          // This will use the device's built-in capability to generate a simple tone
          const fallbackSound = await Audio.Sound.createAsync(
            { uri: 'https://soundbible.com/mp3/Electronic_Chime-KevanGC-495939803.mp3' }, // Fallback to an online beep sound
            { volume: AUDIO_CONFIG.beepVolume }
          );

          beepSoundRef.current = fallbackSound.sound;
          setSoundLoaded(true);
          console.log('Using fallback sound');
        }
      } catch (error) {
        console.error('Error setting up audio:', error);
        // Disable beeps if audio setup fails
        AUDIO_CONFIG.enableBeeps = false;
      }
    };

    if (AUDIO_CONFIG.enableBeeps) {
      loadSound();
    }

    // Cleanup function
    return () => {
      if (beepSoundRef.current) {
        beepSoundRef.current.unloadAsync();
      }

      // Stop any ongoing speech
      if (AUDIO_CONFIG.enableTTS) {
        Speech.stop();
      }
    };
  }, []);

  // Function to play beep sound
  const playBeep = async () => {
    if (!AUDIO_CONFIG.enableBeeps || !beepSoundRef.current || !soundLoaded) return;

    try {
      // Rewind to start and play
      await beepSoundRef.current.setPositionAsync(0);
      await beepSoundRef.current.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // Function to speak text using TTS
  const speak = (text: string) => {
    if (!AUDIO_CONFIG.enableTTS) return;

    // Stop any ongoing speech before starting new one
    Speech.stop();
    Speech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9
    });
  };

  // Function to load training set - extracted to be reusable and memoized with useCallback
  const loadTrainingSet = useCallback(async () => {
    if (!trainingSetId) {
      // If accessed directly without a training set ID, redirect to home
      router.replace('/');
      return;
    }

    try {
      // Set loading state to true when starting to load
      setLoading(true);

      // Always fetch fresh data from AsyncStorage
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue !== null) {
        const trainingSets: TrainingSet[] = JSON.parse(jsonValue);
        const foundSet = trainingSets.find(set => set.id === trainingSetId);

        if (foundSet) {
          setTrainingSet(foundSet);

          // Update seconds based on current timer state
          if (foundSet.rounds.length > 0) {
            if (timerState === TimerState.READY) {
              // In READY state, initialize with first round duration
              setSeconds(foundSet.rounds[0].duration);
            } else if (timerState === TimerState.ROUND) {
              // In ROUND state, update with current round's duration from the new set
              const roundIndex = Math.min(currentRound, foundSet.rounds.length - 1);
              setSeconds(foundSet.rounds[roundIndex].duration);
            } else if (timerState === TimerState.REST) {
              // In REST state, update with the new set's rest time
              setSeconds(foundSet.restTime);
            }
          }
        } else {
          setError('Training set not found');
        }
      } else {
        setError('No training sets found');
      }
    } catch (error) {
      console.error('Error loading training set:', error);
      setError('Failed to load training set');
    } finally {
      setLoading(false);
    }
  }, [trainingSetId, timerState, currentRound]);

  // Load training set when component mounts or trainingSetId changes
  useEffect(() => {
    loadTrainingSet();
  }, [loadTrainingSet]);

  // Use AppState to reload training set when app comes to foreground
  useEffect(() => {
    // Reference to track if this is the first change (initial mount)
    let isFirstChange = true;

    // Function to handle AppState changes
    const handleAppStateChange = (nextAppState: string) => {
      // Skip the first change which happens on mount
      if (isFirstChange) {
        isFirstChange = false;
        return;
      }

      // If app comes to the foreground (active), reload the training set
      if (nextAppState === 'active') {
        console.log('App has come to the foreground, reloading training set');
        loadTrainingSet();
      }
    };

    // Subscribe to AppState changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup function to remove the subscription
    return () => {
      subscription.remove();
    };
  }, [loadTrainingSet]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && seconds > 0) {
      // Play countdown beeps during the last 10 seconds if enabled
      if (AUDIO_CONFIG.enableCountdownBeeps && 
          (timerState === TimerState.ROUND || timerState === TimerState.REST) && 
          seconds <= 10 && seconds > 0) {
        playBeep();
      }

      interval = setInterval(() => {
        setSeconds(seconds => seconds - 1);
      }, 1000);
    } else if (isActive && seconds === 0) {
      // Time's up, transition to next state
      handleTimerComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds]);

  // Handle timer completion
  const handleTimerComplete = () => {
    if (!trainingSet) return;

    if (timerState === TimerState.ROUND) {
      // Round finished, check if there are more rounds
      if (currentRound < trainingSet.rounds.length - 1) {
        // Move to rest period
        setTimerState(TimerState.REST);
        setSeconds(trainingSet.restTime);

        // Announce rest period
        speak("Rest");
        // Play beep for transition
        playBeep();
      } else {
        // Workout complete
        setTimerState(TimerState.COMPLETE);
        setIsActive(false);

        // Announce workout completion
        speak("Workout Complete");
        // Play beep for completion
        playBeep();
      }
    } else if (timerState === TimerState.REST) {
      // Rest period finished, move to next round
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      setTimerState(TimerState.ROUND);
      setSeconds(trainingSet.rounds[nextRound].duration);

      // Announce the theme of the next round
      speak(trainingSet.rounds[nextRound].theme);
      // Play beep for new round
      playBeep();
    }
  };

  // Start the workout
  const startWorkout = () => {
    if (!trainingSet || trainingSet.rounds.length === 0) return;

    setCurrentRound(0);
    setTimerState(TimerState.ROUND);
    setSeconds(trainingSet.rounds[0].duration);
    setIsActive(true);

    // Announce the first round theme
    speak(trainingSet.rounds[0].theme);
    // Play beep for workout start
    playBeep();
  };

  // Toggle timer (pause/resume)
  const toggleTimer = () => {
    if (timerState === TimerState.READY) {
      startWorkout();
    } else if (timerState === TimerState.COMPLETE) {
      // Reset to start a new workout
      setTimerState(TimerState.READY);
      if (trainingSet && trainingSet.rounds.length > 0) {
        setSeconds(trainingSet.rounds[0].duration);
      }
    } else {
      // Pause/resume current timer
      setIsActive(!isActive);
    }
  };

  // Reset current round or rest period
  const resetRound = () => {
    if (!trainingSet || (timerState !== TimerState.ROUND && timerState !== TimerState.REST)) return;

    // Reset the timer based on current state
    if (timerState === TimerState.ROUND) {
      // Reset round timer to original duration
      setSeconds(trainingSet.rounds[currentRound].duration);
      speak("Round reset");
    } else {
      // Reset rest timer to original duration
      setSeconds(trainingSet.restTime);
      speak("Rest reset");
    }

    // Ensure timer is running
    setIsActive(true);

    // Play beep for feedback
    playBeep();
  };

  // Reset entire workout
  const resetWorkout = () => {
    if (!trainingSet) return;

    // Reset to the beginning (first round)
    setCurrentRound(0);
    // Set state to ROUND to start immediately (not READY)
    setTimerState(TimerState.ROUND);
    // Reset to original duration of first round
    setSeconds(trainingSet.rounds[0].duration);
    // Ensure timer is running
    setIsActive(true);

    // Announce the reset
    speak("Workout reset");
    playBeep();
  };

  // Handle exiting the workout
  const handleExit = () => {
    // Stop any active timers
    setIsActive(false);

    // Stop any ongoing speech
    if (AUDIO_CONFIG.enableTTS) {
      Speech.stop();
    }

    // Stop any playing beep sounds
    if (beepSoundRef.current && soundLoaded) {
      try {
        beepSoundRef.current.stopAsync();
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }

    // Navigate back to home screen
    router.navigate('/');
  };

  // Format seconds to MM:SS
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get current round theme
  const getCurrentTheme = () => {
    if (!trainingSet || timerState !== TimerState.ROUND) return '';
    return trainingSet.rounds[currentRound].theme;
  };

  // Render loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900 p-4">
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text className="text-xl text-white mt-4 text-center">{error}</Text>
        <TouchableOpacity 
          className="mt-8 bg-red-600 py-3 px-6 rounded-lg"
          onPress={handleExit}
        >
          <Text className="text-white font-semibold">Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render workout complete state
  if (timerState === TimerState.COMPLETE) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900 p-4">
        <Ionicons name="checkmark-circle" size={80} color="#10b981" />
        <Text className="text-3xl font-bold text-white mt-6 mb-2">Workout Complete!</Text>
        <Text className="text-xl text-gray-300 mb-8">{trainingSet?.name}</Text>

        <TouchableOpacity 
          className="bg-green-600 py-3 px-6 rounded-lg shadow-md w-64 mb-4"
          onPress={() => startWorkout()}
        >
          <Text className="text-white font-semibold text-lg text-center">
            Start Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-red-600 py-3 px-6 rounded-lg shadow-md w-64"
          onPress={handleExit}
        >
          <Text className="text-white font-semibold text-lg text-center">
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900 p-4">
      {/* Header */}
      <View className="items-center mb-6 mt-4">
        <Text className="text-2xl font-bold text-red-500 mb-1">
          {trainingSet?.name}
        </Text>
        {timerState !== TimerState.READY && (
          <Text className="text-lg text-gray-300">
            Round {currentRound + 1} of {trainingSet?.rounds.length}
          </Text>
        )}
      </View>

      {/* Timer Display */}
      <View className="flex-1 justify-center items-center">
        {timerState === TimerState.READY ? (
          <View className="items-center">
            <Ionicons name="fitness" size={80} color="#ef4444" />
            <Text className="text-2xl text-white mt-6 mb-2">Ready to start</Text>
            <Text className="text-lg text-gray-300 mb-8">{trainingSet?.rounds.length} rounds</Text>
          </View>
        ) : (
          <>
            {/* Round/Rest indicator */}
            <Text className="text-xl font-bold text-white mb-4">
              {timerState === TimerState.REST ? 'REST' : getCurrentTheme()}
            </Text>

            {/* Timer circle */}
            <View className={`rounded-full w-64 h-64 justify-center items-center shadow-lg mb-8 ${
              timerState === TimerState.REST ? 'bg-blue-900' : 'bg-red-900'
            }`}>
              <Text className="text-6xl font-bold text-white">
                {formatTime(seconds)}
              </Text>
              <Text className="text-xl text-gray-300 mt-2">
                {timerState === TimerState.REST ? 'Rest' : 'Round'}
              </Text>
            </View>
          </>
        )}

        {/* Controls */}
        <View className="flex-row space-x-4 mb-6">
          <TouchableOpacity 
            className={`py-4 px-8 rounded-lg shadow-md ${
              isActive ? 'bg-yellow-600' : 'bg-green-600'
            }`}
            onPress={toggleTimer}
          >
            <Text className="text-white font-semibold text-lg">
              {timerState === TimerState.READY ? 'Start' : 
               isActive ? 'Pause' : 'Resume'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reset Controls - Only show during active workout */}
        {timerState !== TimerState.READY && timerState !== TimerState.COMPLETE && (
          <View className="flex-row space-x-4">
            {/* Reset Current button - Show during round or rest */}
            <TouchableOpacity 
              className="py-3 px-6 rounded-lg shadow-md bg-orange-600"
              onPress={resetRound}
            >
              <Text className="text-white font-semibold">
                {timerState === TimerState.ROUND ? 'Reset Round' : 'Reset Rest'}
              </Text>
            </TouchableOpacity>

            {/* Reset All button */}
            <TouchableOpacity 
              className="py-3 px-6 rounded-lg shadow-md bg-red-700"
              onPress={resetWorkout}
            >
              <Text className="text-white font-semibold">
                Reset All
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Back button */}
      <TouchableOpacity 
        className="mt-4 items-center"
        onPress={handleExit}
      >
        <Text className="text-red-500 font-semibold text-lg">
          Exit Workout
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default TimerScreen;
