export type TrainingSet = {
  id: string;
  name: string;
  rounds: Round[];
  restTime: number;
};

export type Round = {
  id: string;
  theme: string;
  duration: number;
};

// Adding a default export to satisfy Expo Router requirements
const TypesPage = () => null;
export default TypesPage;
