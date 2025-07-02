import React, { useState, useCallback, useRef } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Animated, 
  PanResponder,
  Alert,
  Dimensions
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { TrainingSet } from '../types';

const STORAGE_KEY = '@training_sets';

const HomeScreen = () => {
  const router = useRouter();
  const [trainingSets, setTrainingSets] = useState<TrainingSet[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadTrainingSets();
    }, [])
  );

  const loadTrainingSets = async () => {
    setLoading(true);
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue !== null) {
        setTrainingSets(JSON.parse(jsonValue));
      } else {
        setTrainingSets([]);
      }
    } catch (error) {
      console.error('Error loading training sets:', error);
      setTrainingSets([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteTrainingSet = async (id: string) => {
    try {
      // Get current training sets
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue !== null) {
        const currentSets: TrainingSet[] = JSON.parse(jsonValue);
        // Filter out the set to delete
        const updatedSets = currentSets.filter(set => set.id !== id);
        // Save updated sets back to AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSets));
        // Update state
        setTrainingSets(updatedSets);
      }
    } catch (error) {
      console.error('Error deleting training set:', error);
      Alert.alert('Error', 'Failed to delete training set');
    }
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Training Set',
      `Are you sure you want to delete "${name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: () => deleteTrainingSet(id),
          style: 'destructive'
        }
      ]
    );
  };

  const SwipeableItem = ({ item }: { item: TrainingSet }) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const screenWidth = Dimensions.get('window').width;
    const deleteButtonWidth = 80;

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Only respond to horizontal movements
          return Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 3);
        },
        onPanResponderGrant: () => {
          pan.setOffset({
            x: pan.x._value,
            y: 0
          });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event(
          [null, { dx: pan.x }],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: (_, gestureState) => {
          pan.flattenOffset();

          // If swiped left more than 1/3 of delete button width, show delete button
          if (gestureState.dx < -deleteButtonWidth / 3) {
            Animated.spring(pan.x, {
              toValue: -deleteButtonWidth,
              useNativeDriver: false,
              friction: 5
            }).start();
          } else {
            // Otherwise, reset position
            Animated.spring(pan.x, {
              toValue: 0,
              useNativeDriver: false,
              friction: 5
            }).start();
          }
        }
      })
    ).current;

    // Handle item click to edit
    const handleItemPress = () => {
      // Navigate to CreateTrainingSetScreen with the training set data
      router.navigate({
        pathname: '/screens/CreateTrainingSetScreen',
        params: { trainingSet: JSON.stringify(item) }
      });
    };

    return (
      <View className="mb-3">
        <Animated.View
          style={{
            transform: [{ translateX: pan.x }],
            zIndex: 1
          }}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity onPress={handleItemPress}>
            <View className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
              <Text className="text-xl font-bold text-red-900">{item.name}</Text>
              <View className="flex-row justify-between mt-2">
                <Text className="text-red-700">Rounds: {item.rounds.length}</Text>
                <Text className="text-red-700">Rest: {item.restTime}s</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Delete button that appears when swiped */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: deleteButtonWidth,
            backgroundColor: '#ef4444',
            justifyContent: 'center',
            alignItems: 'center',
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8
          }}
          onPress={() => confirmDelete(item.id, item.name)}
        >
          <Ionicons name="trash-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderTrainingSet = ({ item }: { item: TrainingSet }) => (
    <SwipeableItem item={item} />
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
          {trainingSets.length > 0 ? (
            <FlatList
              data={trainingSets}
              renderItem={renderTrainingSet}
              keyExtractor={(item) => item.id}
              className="w-full"
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className="text-lg text-gray-400 text-center">
                No training sets yet. Create one to get started!
              </Text>
            </View>
          )}
        </View>
      )}

      <View className="w-full mt-4">
        <TouchableOpacity 
          className="bg-red-600 py-3 px-6 rounded-lg shadow-md w-full"
          onPress={() => router.navigate('/screens/CreateTrainingSetScreen')}
        >
          <Text className="text-white font-semibold text-lg text-center">
            Create Training Set
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;
