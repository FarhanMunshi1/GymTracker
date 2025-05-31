import { DBExerciseSet, DBSplit, DBSplitRecord } from './DatabaseObjects';

// database version has WEIGHT_TYPE_ID instead
export interface Exercise {
  ID: number;
  NAME: string;
  WEIGHT_TYPE: string;
  BODY_PART_ID: number;
}

// used to populate each exercise, their sets & previous sets
export interface ExerciseRecordForFrontend extends Exercise {
  sets: Array<DBExerciseSet>;
  previousSets: Array<DBExerciseSet>;
}

// what we recieve from the backend in order to use the frontend
export interface IndexPagePackage {
  splits: Array<DBSplit>;
  allExercises: Array<Exercise>;
  recordId?: number;
  currentExercises: Array<ExerciseRecordForFrontend>;
  todaysSplit: DBSplit;
  previousRecords: Array<DBSplitRecord>;
  isRecordEditable: boolean;
}

// RESPONSE OBJECTS

export type AddSetResponse = {
  success: boolean;
  recordId: number;
};

export type PreviousSetsResponse = {
  success: boolean;
  previousSets: DBExerciseSet[];
  message: string;
};

export type FinishSessionResponse = {
  success: boolean;
  message: string;
};
