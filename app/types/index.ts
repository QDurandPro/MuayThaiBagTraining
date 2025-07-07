// Centralised app-wide TypeScript types
// --------------------------------------
// Instead of putting this file in the routeable root of the Expo Router (which
// required a dummy default export), we locate it under `app/types/` so it’s
// never treated as a screen.

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

// Dummy default export to silence Expo Router route warning
export default {};
