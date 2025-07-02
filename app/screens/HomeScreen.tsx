import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const HomeScreen = () => {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 p-4">
      <Text className="text-3xl font-bold text-gray-800 mb-8">
        Muay Thai Bag Training
      </Text>

      <TouchableOpacity 
        className="bg-blue-500 py-3 px-6 rounded-lg shadow-md"
        onPress={() => router.navigate('/screens/CreateTrainingSetScreen')}
      >
        <Text className="text-white font-semibold text-lg">
          Create Training Set
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;
