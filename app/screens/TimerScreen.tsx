import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const TimerScreen = () => {
  const router = useRouter();
  const [seconds, setSeconds] = useState(30);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }

    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setSeconds(30);
    setIsActive(false);
  };

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 p-4">
      <Text className="text-3xl font-bold text-gray-800 mb-8">
        Training Timer
      </Text>

      <View className="bg-white rounded-full w-64 h-64 justify-center items-center shadow-lg mb-8">
        <Text className="text-6xl font-bold text-gray-800">
          {seconds}
        </Text>
        <Text className="text-xl text-gray-600 mt-2">
          seconds
        </Text>
      </View>

      <View className="flex-row space-x-4">
        <TouchableOpacity 
          className={`py-3 px-6 rounded-lg shadow-md ${isActive ? 'bg-red-500' : 'bg-green-500'}`}
          onPress={toggleTimer}
        >
          <Text className="text-white font-semibold text-lg">
            {isActive ? 'Pause' : 'Start'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-gray-500 py-3 px-6 rounded-lg shadow-md"
          onPress={resetTimer}
        >
          <Text className="text-white font-semibold text-lg">
            Reset
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        className="mt-8"
        onPress={() => router.navigate('/')}
      >
        <Text className="text-blue-500 font-semibold">
          Back to Home
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default TimerScreen;
