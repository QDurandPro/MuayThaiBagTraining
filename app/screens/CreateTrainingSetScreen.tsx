import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const CreateTrainingSetScreen = () => {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 p-4">
      <Text className="text-3xl font-bold text-gray-800 mb-8">
        Create Training Set
      </Text>

      <View className="w-full max-w-md">
        <Text className="text-lg text-gray-700 mb-4">
          Configure your training session here.
        </Text>

        {/* Add training configuration options here */}

        <TouchableOpacity 
          className="bg-green-500 py-3 px-6 rounded-lg shadow-md mt-6"
          onPress={() => router.navigate('/screens/TimerScreen')}
        >
          <Text className="text-white font-semibold text-lg text-center">
            Start Training
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="mt-4"
          onPress={() => router.navigate('/')}
        >
          <Text className="text-blue-500 font-semibold text-center">
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CreateTrainingSetScreen;
