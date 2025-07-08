import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import { TrainingSet } from '../types';

/**
 * Hook that encapsulates CRUD logic for TrainingSets using AsyncStorage.
 * Screen components only need to consume this hook instead of touching
 * storage directly.
 */
export const useTrainingSets = () => {
  const [trainingSets, setTrainingSets] = useState<TrainingSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch on first mount
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.TRAINING_SETS);
      if (jsonValue) {
        setTrainingSets(JSON.parse(jsonValue));
      } else {
        setTrainingSets([]);
      }
    } catch (err) {
      console.error('[useTrainingSets] load error', err);
      setTrainingSets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = async (newSets: TrainingSet[]) => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.TRAINING_SETS,
      JSON.stringify(newSets),
    );
  };

  const addOrUpdate = async (set: TrainingSet) => {
    const updated = trainingSets.some((s) => s.id === set.id)
      ? trainingSets.map((s) => (s.id === set.id ? set : s))
      : [...trainingSets, set];
    setTrainingSets(updated);
    await persist(updated);
  };

  const remove = async (id: string) => {
    const updated = trainingSets.filter((s) => s.id !== id);
    setTrainingSets(updated);
    await persist(updated);
  };

  return {
    trainingSets,
    loading,
    reload: load,
    saveTrainingSet: addOrUpdate,
    deleteTrainingSet: remove,
  } as const;
};

// Dummy default export so Expo Router ignores this non-screen file
export default {};
