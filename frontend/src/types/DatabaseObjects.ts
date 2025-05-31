// interfaces with DB indicate an interface that can be directly received from the database

export type DBSplit = {
  ID: number;
  NAME: string;
};

export type DBSplitRecord = {
  ID: number;
  SPLIT_ID: string;
  DATE: string;
  SPLIT_NAME: string;
};

export type DBExerciseSet = {
  ID?: number;
  WEIGHT: number;
  DROPSET: boolean;
  WARMUP: boolean;
  FAILIURE: boolean;
  REPS: number;
  SPLIT_RECORD_ID?: number;
  EXERCISE_ID: number;
};
