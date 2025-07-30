import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Alert, AppState } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { TrainingSet } from '../src/types';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

// Hide from tab bar
export const href = null;
export const options = { headerShown: false };

const STORAGE_KEY = '@training_sets';

// Timer states
enum TimerState {
  READY = 'ready',
  COUNTDOWN = 'countdown',
  ROUND = 'round',
  REST = 'rest',
  COMPLETE = 'complete',
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
  enableCountdownBeeps: true,
};

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
  const [bellLoaded, setBellLoaded] = useState(false);
  const beepSoundRef = useRef<Audio.Sound | null>(null);
  const bellSoundRef = useRef<Audio.Sound | null>(null);

  // Prevent first appstate change
  let isFirstChange = true;

  // ================== AUDIO ======================
  useEffect(() => {
    const loadSound = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        try {
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/beep.mp3'),
            { volume: AUDIO_CONFIG.beepVolume }
          );
          beepSoundRef.current = sound;
          setSoundLoaded(true);
          // Load boxing bell sound
          try {
            const { sound: bell } = await Audio.Sound.createAsync(
              require('../assets/sounds/boxing-bell.mp3'),
              { volume: AUDIO_CONFIG.beepVolume }
            );
            bellSoundRef.current = bell;
            setBellLoaded(true);
          } catch (bellError) {
            console.error('Error loading boxing-bell.mp3:', bellError);
          }
        } catch (soundError) {
          console.error('Error loading beep.mp3:', soundError);
          const fallbackSound = await Audio.Sound.createAsync(
            {
              uri: 'https://soundbible.com/mp3/Electronic_Chime-KevanGC-495939803.mp3',
            },
            { volume: AUDIO_CONFIG.beepVolume }
          );
          beepSoundRef.current = fallbackSound.sound;
          setSoundLoaded(true);
        }
      } catch (error) {
        console.error('Error setting up audio:', error);
        AUDIO_CONFIG.enableBeeps = false;
      }
    };

    if (AUDIO_CONFIG.enableBeeps) {
      loadSound();
    }

    return () => {
      if (beepSoundRef.current) {
        beepSoundRef.current.unloadAsync();
      }
      if (bellSoundRef.current) {
        bellSoundRef.current.unloadAsync();
      }
      if (AUDIO_CONFIG.enableTTS) {
        Speech.stop();
      }
    };
  }, []);

  const playBeep = async () => {
    if (!AUDIO_CONFIG.enableBeeps || !beepSoundRef.current || !soundLoaded) return;
    try {
      await beepSoundRef.current.setPositionAsync(0);
      await beepSoundRef.current.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const playBell = async () => {
    if (!AUDIO_CONFIG.enableBeeps || !bellSoundRef.current || !bellLoaded) return;
    try {
      await bellSoundRef.current.setPositionAsync(0);
      await bellSoundRef.current.playAsync();
    } catch (error) {
      console.error('Error playing bell sound:', error);
    }
  };

  const speak = (text: string) => {
    if (!AUDIO_CONFIG.enableTTS) return;
    Speech.stop();
    Speech.speak(text, { language: 'en', pitch: 1.0, rate: 0.9 });
  };

  // ================== LOAD TRAINING SET ======================
  const loadTrainingSet = useCallback(async () => {
    setLoading(true);
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue) {
        const allSets: TrainingSet[] = JSON.parse(jsonValue);
        const foundSet = allSets.find((s) => s.id === trainingSetId);
        if (foundSet) {
          setTrainingSet(foundSet);
          setError(null);
          // Prepare timer seconds depending on state
          if (timerState === TimerState.READY) {
            setSeconds(foundSet.rounds[0].duration);
          } else if (timerState === TimerState.ROUND) {
            setSeconds(foundSet.rounds[currentRound].duration);
          } else if (timerState === TimerState.REST) {
            setSeconds(foundSet.restTime);
          }
        } else {
          setError('Training set not found');
        }
      } else {
        setError('No training sets found');
      }
    } catch (e) {
      console.error('Error loading training set', e);
      setError('Failed to load training set');
    } finally {
      setLoading(false);
    }
  }, [trainingSetId, timerState, currentRound]);

  useEffect(() => {
    loadTrainingSet();
  }, [loadTrainingSet]);

  // Reload when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (isFirstChange) {
        isFirstChange = false;
        return;
      }
      if (next === 'active') {
        loadTrainingSet();
      }
    });
    return () => sub.remove();
  }, [loadTrainingSet]);

  // ================== TIMER LOGIC ======================
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (isActive && seconds === 0) {
      handleTimerComplete();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds]);

  // Play sounds according to timer state
  useEffect(() => {
    if (!AUDIO_CONFIG.enableBeeps || !isActive) return;

    if (timerState === TimerState.COUNTDOWN) {
      // Beep every second during countdown
      playBeep();
    } else if (timerState === TimerState.ROUND) {
      // Bell at the very first second is handled when ROUND starts.
      if (seconds === 1) {
        // Last second of round
        playBell();
      } else if (AUDIO_CONFIG.enableCountdownBeeps && seconds <= 10) {
        // Countdown beeps for the last 10 seconds (except last one)
        playBeep();
      }
    } else if (timerState === TimerState.REST && seconds <= 10) {
      // Countdown beeps during rest period
      playBeep();
    }
  }, [seconds, timerState, isActive]);

  const startWorkout = () => {
    if (!trainingSet || trainingSet.rounds.length === 0) return;
    setCurrentRound(0);
    setTimerState(TimerState.COUNTDOWN);
    setSeconds(15);
    setIsActive(true);
    speak('Get ready. 15 second countdown before first round.');
    playBeep();
  };

  const toggleTimer = () => {
    if (timerState === TimerState.READY) {
      startWorkout();
    } else if (timerState === TimerState.COMPLETE) {
      setTimerState(TimerState.READY);
      if (trainingSet && trainingSet.rounds.length > 0) {
        setSeconds(trainingSet.rounds[0].duration);
      }
    } else {
      setIsActive(!isActive);
    }
  };

  const resetRound = () => {
    if (!trainingSet || (timerState !== TimerState.ROUND && timerState !== TimerState.REST)) return;
    if (timerState === TimerState.ROUND) {
      setSeconds(trainingSet.rounds[currentRound].duration);
      speak('Round reset');
    } else {
      setSeconds(trainingSet.restTime);
      speak('Rest reset');
    }
    setIsActive(true);
    playBeep();
  };

  const resetWorkout = () => {
    if (!trainingSet) return;
    setCurrentRound(0);
    setTimerState(TimerState.COUNTDOWN);
    setSeconds(15);
    setIsActive(true);
    speak('Workout reset. Get ready for countdown.');
    playBeep();
  };

  const handleTimerComplete = () => {
    if (!trainingSet) return;
    if (timerState === TimerState.COUNTDOWN) {
      setTimerState(TimerState.ROUND);
      setSeconds(trainingSet.rounds[currentRound].duration);
      speak(`Round ${currentRound + 1}. ${trainingSet.rounds[currentRound].theme}`);
      playBell();
    } else if (timerState === TimerState.ROUND) {
      if (currentRound < trainingSet.rounds.length - 1) {
        setTimerState(TimerState.REST);
        setSeconds(trainingSet.restTime);
        speak('Rest');
      } else {
        setTimerState(TimerState.COMPLETE);
        setIsActive(false);
        speak('Workout Complete');
      }
    } else if (timerState === TimerState.REST) {
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      setTimerState(TimerState.ROUND);
      setSeconds(trainingSet.rounds[nextRound].duration);
      speak(trainingSet.rounds[nextRound].theme);
      playBell();
    }
  };

  const handleExit = () => {
    setIsActive(false);
    if (AUDIO_CONFIG.enableTTS) Speech.stop();
    if (beepSoundRef.current && soundLoaded) {
      beepSoundRef.current.stopAsync().catch(() => {});
    }
    setTrainingSet(null);
    setTimerState(TimerState.READY);
    setCurrentRound(0);
    setSeconds(0);
    setError(null);
    router.navigate('/');
  };

  const formatTime = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getCurrentTheme = () => {
    if (!trainingSet || timerState !== TimerState.ROUND) return '';
    return trainingSet.rounds[currentRound].theme;
  };

  // ================== UI ======================
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-900">
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-900 p-4">
        <Text className="text-white text-lg mb-4 text-center">{error}</Text>
        <TouchableOpacity
          className="bg-red-600 py-3 px-6 rounded-lg"
          onPress={() => router.navigate('/')}
        >
          <Text className="text-white font-semibold">Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900 p-4">
      {/* Header */}
      <View className="items-center mb-4">
        <Text className="text-2xl font-bold text-red-500 mb-1">
          {trainingSet?.name}
        </Text>
        {timerState !== TimerState.READY && (
          <Text className="text-lg text-gray-300">
            {timerState === TimerState.COUNTDOWN
              ? `Get ready for Round ${currentRound + 1}`
              : `Round ${currentRound + 1} of ${trainingSet?.rounds.length}`}
          </Text>
        )}
      </View>

      {/* Timer Display */}
      <View className="flex-1 justify-center items-center">
        {timerState === TimerState.READY ? (
          <View className="items-center">
            <Ionicons name="fitness" size={80} color="#ef4444" />
            <Text className="text-2xl text-white mt-6 mb-2">Ready to start</Text>
            <Text className="text-lg text-gray-300 mb-8">
              {trainingSet?.rounds.length} rounds
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-xl font-bold text-white mb-4">
              {timerState === TimerState.REST
                ? 'REST'
                : timerState === TimerState.COUNTDOWN
                ? 'GET READY'
                : getCurrentTheme()}
            </Text>
            <View
              className={`rounded-full w-64 h-64 justify-center items-center shadow-lg mb-8 ${
                timerState === TimerState.REST
                  ? 'bg-blue-900'
                  : timerState === TimerState.COUNTDOWN
                  ? 'bg-yellow-700'
                  : 'bg-red-900'
              }`}
            >
              <Text className="text-6xl font-bold text-white">
                {formatTime(seconds)}
              </Text>
              <Text className="text-xl text-gray-300 mt-2">
                {timerState === TimerState.REST
                  ? 'Rest'
                  : timerState === TimerState.COUNTDOWN
                  ? 'Countdown'
                  : 'Round'}
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
              {timerState === TimerState.READY
                ? 'Start'
                : isActive
                ? 'Pause'
                : 'Resume'}
            </Text>
          </TouchableOpacity>
        </View>

        {(timerState === TimerState.ROUND ||
          timerState === TimerState.REST ||
          timerState === TimerState.COUNTDOWN) && (
          <View className="flex-row space-x-4">
            {(timerState === TimerState.ROUND || timerState === TimerState.REST) && (
              <TouchableOpacity
                className="py-3 px-6 rounded-lg shadow-md bg-orange-600"
                onPress={resetRound}
              >
                <Text className="text-white font-semibold">
                  {timerState === TimerState.ROUND ? 'Reset Round' : 'Reset Rest'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="py-3 px-6 rounded-lg shadow-md bg-red-700"
              onPress={resetWorkout}
            >
              <Text className="text-white font-semibold">Reset All</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity className="mt-4 items-center" onPress={handleExit}>
        <Text className="text-red-500 font-semibold text-lg">Exit Workout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TimerScreen;
