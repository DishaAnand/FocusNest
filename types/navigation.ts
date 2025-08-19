// src/types/navigation.ts
export type Task = { id: string; title: string; icon: string };

export type RootStackParamList = {
  Home: undefined;
  Timer: { task: Task; autoStart?: boolean };
};
