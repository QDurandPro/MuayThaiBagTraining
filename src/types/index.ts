// Centralised app-wide TypeScript types
// --------------------------------------
// Keep shared types here, outside the Expo Router `app` directory so they’re
// never treated as routes.

export type TrainingSet = {
  id: string;
  name: string;
  rounds: Round[];
  restTime: number;
};

export type Round = {
  id: string;
  theme: string;
  duration: number; // seconds
};

// Timer workflow states – duplicated from TimerScreen for now but will be
// consumed by the upcoming `useTimer` hook.
export enum TimerState {
  READY = 'ready',
  COUNTDOWN = 'countdown',
  ROUND = 'round',
  REST = 'rest',
  COMPLETE = 'complete',
}
