import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrainingSet, Round } from '../types';

const STORAGE_KEY = '@training_sets';

// Predefined themes for rounds
const THEMES = [
  'Free',
  'Jab-Cross',
  'Hooks',
  'Uppercuts',
  'Low Kicks',
  'Body Kicks',
  'Head Kicks',
  'Knees',
  'Elbows',
  'Clinch',
  'Combos'
];

const CreateTrainingSetScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Check if we're in edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [numberOfRounds, setNumberOfRounds] = useState('3');
  const [restTime, setRestTime] = useState('60');

  // Rounds state
  const [rounds, setRounds] = useState<Omit<Round, 'id'>[]>([]);

  // Load training set data if in edit mode
  useEffect(() => {
    if (params.trainingSet) {
      try {
        const trainingSet: TrainingSet = JSON.parse(params.trainingSet as string);

        // Set edit mode
        setIsEditMode(true);
        setEditingId(trainingSet.id);

        // Pre-fill form fields
        setName(trainingSet.name);
        setNumberOfRounds(trainingSet.rounds.length.toString());
        setRestTime(trainingSet.restTime.toString());

        // Pre-fill rounds (without ids)
        setRounds(trainingSet.rounds.map(round => ({
          theme: round.theme,
          duration: round.duration
        })));
      } catch (error) {
        console.error('Error parsing training set data:', error);
      }
    }
  }, [params.trainingSet]);

  // Update rounds array when numberOfRounds changes
  useEffect(() => {
    const roundCount = parseInt(numberOfRounds) || 0;

    if (roundCount > rounds.length) {
      // Add new rounds
      const newRounds = [...rounds];
      for (let i = rounds.length; i < roundCount; i++) {
        newRounds.push({
          theme: THEMES[i % THEMES.length],
          duration: 180
        });
      }
      setRounds(newRounds);
    } else if (roundCount < rounds.length) {
      // Remove excess rounds
      setRounds(rounds.slice(0, roundCount));
    }
  }, [numberOfRounds]);

  // Update round theme
  const updateRoundTheme = (index: number, theme: string) => {
    const newRounds = [...rounds];
    newRounds[index] = { ...newRounds[index], theme };
    setRounds(newRounds);
  };

  // Update round duration
  const updateRoundDuration = (index: number, duration: string) => {
    const newRounds = [...rounds];
    newRounds[index] = { ...newRounds[index], duration: parseInt(duration) || 0 };
    setRounds(newRounds);
  };

  // Generate a unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Save training set
  const saveTrainingSet = async () => {
    // Validate form
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for your training set');
      return;
    }

    if (rounds.length === 0) {
      Alert.alert('Error', 'Please add at least one round');
      return;
    }

    try {
      // Get existing training sets
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      let trainingSets: TrainingSet[] = [];

      if (jsonValue !== null) {
        trainingSets = JSON.parse(jsonValue);
      }

      if (isEditMode && editingId) {
        // Update existing training set
        const updatedTrainingSets = trainingSets.map(set => {
          if (set.id === editingId) {
            // Keep the same ID but update other fields
            return {
              id: editingId,
              name: name.trim(),
              rounds: rounds.map(round => ({
                ...round,
                // Generate new IDs for rounds or keep existing ones if available
                id: generateId()
              })),
              restTime: parseInt(restTime) || 60
            };
          }
          return set;
        });

        // Save updated training sets
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrainingSets));

        // Show success message
        Alert.alert('Success', 'Training set updated successfully');
      } else {
        // Create new training set
        const trainingSet: TrainingSet = {
          id: generateId(),
          name: name.trim(),
          rounds: rounds.map(round => ({
            ...round,
            id: generateId()
          })),
          restTime: parseInt(restTime) || 60
        };

        // Add new training set
        trainingSets.push(trainingSet);

        // Save to AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trainingSets));

        // Show success message
        Alert.alert('Success', 'Training set created successfully');
      }

      // Navigate back to home screen
      router.navigate('/');
    } catch (error) {
      console.error('Error saving training set:', error);
      Alert.alert('Error', 'Failed to save training set');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-gray-900 p-4">
        <Text className="text-3xl font-bold text-red-500 mb-6 text-center mt-4">
          {isEditMode ? 'Edit Training Set' : 'Create Training Set'}
        </Text>

        <View className="w-full mb-6">
          <Text className="text-lg text-gray-300 mb-2">Training Set Name</Text>
          <TextInput
            className="bg-gray-800 text-white p-3 rounded-lg border border-gray-700 mb-4"
            placeholder="Enter name"
            placeholderTextColor="#6b7280"
            value={name}
            onChangeText={setName}
          />

          <Text className="text-lg text-gray-300 mb-2">Number of Rounds</Text>
          <TextInput
            className="bg-gray-800 text-white p-3 rounded-lg border border-gray-700 mb-4"
            placeholder="Enter number of rounds"
            placeholderTextColor="#6b7280"
            value={numberOfRounds}
            onChangeText={setNumberOfRounds}
            keyboardType="numeric"
          />

          <Text className="text-lg text-gray-300 mb-2">Rest Time Between Rounds (seconds)</Text>
          <TextInput
            className="bg-gray-800 text-white p-3 rounded-lg border border-gray-700 mb-4"
            placeholder="Enter rest time in seconds"
            placeholderTextColor="#6b7280"
            value={restTime}
            onChangeText={setRestTime}
            keyboardType="numeric"
          />
        </View>

        <Text className="text-2xl font-bold text-red-500 mb-4">Rounds</Text>

        {rounds.map((round, index) => (
          <View key={index} className="bg-gray-800 p-4 rounded-lg mb-4 border border-gray-700">
            <Text className="text-lg text-white font-bold mb-2">Round {index + 1}</Text>

            <Text className="text-gray-300 mb-1">Theme</Text>
            <TextInput
              className="bg-gray-700 text-white p-3 rounded-lg mb-3"
              placeholder="Enter theme (e.g., Free, Combo, Low Kick)"
              placeholderTextColor="#6b7280"
              value={round.theme}
              onChangeText={(text) => updateRoundTheme(index, text)}
            />

            <Text className="text-gray-300 mb-1">Duration (seconds)</Text>
            <TextInput
              className="bg-gray-700 text-white p-3 rounded-lg"
              placeholder="Enter duration in seconds"
              placeholderTextColor="#6b7280"
              value={round.duration.toString()}
              onChangeText={(text) => updateRoundDuration(index, text)}
              keyboardType="numeric"
            />
          </View>
        ))}

        <View className="mt-6 mb-20">
          <TouchableOpacity 
            className="bg-red-600 py-3 px-6 rounded-lg shadow-md w-full mb-4"
            onPress={saveTrainingSet}
          >
            <Text className="text-white font-semibold text-lg text-center">
              {isEditMode ? 'Update Training Set' : 'Save Training Set'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="py-3 px-6 rounded-lg border border-gray-600 w-full"
            onPress={() => router.navigate('/')}
          >
            <Text className="text-gray-300 font-semibold text-lg text-center">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateTrainingSetScreen;
