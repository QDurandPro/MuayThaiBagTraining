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