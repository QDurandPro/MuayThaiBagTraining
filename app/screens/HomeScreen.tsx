import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { TrainingSetCard } from '../components/TrainingSetCard';
import { useTrainingSets } from '../hooks/useTrainingSets';
import { TrainingSet } from '../types';

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { trainingSets, loading, reload, deleteTrainingSet } = useTrainingSets();

  // Refresh list whenever screen regains focus
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handleEdit = (item: TrainingSet) =>
    router.navigate({
      pathname: '/screens/CreateTrainingSetScreen',
      params: { trainingSet: JSON.stringify(item) },
    });

  const handleStart = (item: TrainingSet) =>
    router.push({
      pathname: '/screens/TimerScreen',
      params: { trainingSetId: item.id },
    });

  const handleDelete = (item: TrainingSet) =>
    Alert.alert('Delete Training Set', `Delete “${item.name}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTrainingSet(item.id),
      },
    ]);

  const renderItem = ({ item }: { item: TrainingSet }) => (
    <TrainingSetCard
      item={item}
      onEdit={handleEdit}
      onStart={handleStart}
      onDelete={handleDelete}
    />
  );

  return (
    <View className="flex-1 bg-gray-900 p-4">
      <Text className="text-3xl font-bold text-red-500 mb-6 text-center mt-4">
        Muay Thai Bag Training
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#ef4444" className="flex-1" />
      ) : (
        <View className="flex-1 w-full">
          {trainingSets.length ? (
            <FlatList
              data={trainingSets}
              renderItem={renderItem}
              keyExtractor={(it) => it.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-lg text-gray-400 text-center">
                No training sets yet. Create one to get started!
              </Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        className="bg-red-600 py-3 px-6 rounded-lg shadow-md w-full mt-4"
        onPress={() => router.navigate('/screens/CreateTrainingSetScreen')}
      >
        <Text className="text-white font-semibold text-lg text-center">
          Create Training Set
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;