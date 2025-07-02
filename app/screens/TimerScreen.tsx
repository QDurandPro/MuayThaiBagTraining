import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { TrainingSet } from '../types';

const STORAGE_KEY = '@training_sets';

// Timer states
enum TimerState {
  READY = 'ready',
  ROUND = 'round',
  REST = 'rest',
  COMPLETE = 'complete'
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

  // Load training set
  useEffect(() => {
    const loadTrainingSet = async () => {
      if (!trainingSetId) {
        setError('No training set ID provided');
        setLoading(false);
        return;
      }

      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue !== null) {
          const trainingSets: TrainingSet[] = JSON.parse(jsonValue);
          const foundSet = trainingSets.find(set => set.id === trainingSetId);

          if (foundSet) {
            setTrainingSet(foundSet);
            // Initialize with first round duration
            if (foundSet.rounds.length > 0) {
              setSeconds(foundSet.rounds[0].duration);
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
    };

    loadTrainingSet();
  }, [trainingSetId]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && seconds > 0) {
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
      } else {
        // Workout complete
        setTimerState(TimerState.COMPLETE);
        setIsActive(false);
      }
    } else if (timerState === TimerState.REST) {
      // Rest period finished, move to next round
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      setTimerState(TimerState.ROUND);
      setSeconds(trainingSet.rounds[nextRound].duration);
    }
  };

  // Start the workout
  const startWorkout = () => {
    if (!trainingSet || trainingSet.rounds.length === 0) return;

    setCurrentRound(0);
    setTimerState(TimerState.ROUND);
    setSeconds(trainingSet.rounds[0].duration);
    setIsActive(true);
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
          onPress={() => router.navigate('/')}
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
          onPress={() => router.navigate('/')}
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
        <View className="flex-row space-x-4">
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
      </View>

      {/* Back button */}
      <TouchableOpacity 
        className="mt-4 items-center"
        onPress={() => router.navigate('/')}
      >
        <Text className="text-red-500 font-semibold text-lg">
          Exit Workout
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default TimerScreen;
