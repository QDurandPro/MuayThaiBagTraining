import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrainingSet } from '../types';

interface Props {
  item: TrainingSet;
  onEdit: (item: TrainingSet) => void;
  onStart: (item: TrainingSet) => void;
  onDelete: (item: TrainingSet) => void;
}

/**
 * Swipe-to-delete card that represents a TrainingSet.
 * Extracted from the original HomeScreen for clarity & memoised to avoid
 * unnecessary re-renders when surrounding list updates.
 */
const TrainingSetCardComponent: React.FC<Props> = ({ item, onEdit, onStart, onDelete }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const screenWidth = Dimensions.get('window').width;
  const deleteButtonWidth = 80;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 3);
      },
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        if (gestureState.dx < -deleteButtonWidth / 3) {
          Animated.spring(pan.x, {
            toValue: -deleteButtonWidth,
            useNativeDriver: false,
            friction: 5,
          }).start();
        } else {
          Animated.spring(pan.x, {
            toValue: 0,
            useNativeDriver: false,
            friction: 5,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View className="mb-3" style={{ width: screenWidth - 32 }}>
      <Animated.View
        style={{ transform: [{ translateX: pan.x }], zIndex: 1 }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity onPress={() => onEdit(item)}>
          <View className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
            <Text className="text-xl font-bold text-red-900">{item.name}</Text>
            <View className="flex-row justify-between mt-2">
              <Text className="text-red-700">Rounds: {item.rounds.length}</Text>
              <Text className="text-red-700">Rest: {item.restTime}s</Text>
            </View>

            <TouchableOpacity
              className="bg-green-600 py-2 px-4 rounded-lg mt-3"
              onPress={() => onStart(item)}
            >
              <Text className="text-white font-semibold text-center">Start Workout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Delete button */}
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
          borderBottomRightRadius: 8,
        }}
        onPress={() => onDelete(item)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export const TrainingSetCard = React.memo(TrainingSetCardComponent);

// Named export only; no default export to avoid accidental route registration
