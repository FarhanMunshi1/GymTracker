import axios from 'axios';
import { DBSplit, DBExerciseSet } from '../../types/DatabaseObjects';
import { AddSetResponse, PreviousSetsResponse, FinishSessionResponse } from '../../types/IndexPage';

export function GetIndexPagePackage(date: string) {
  return new Promise<any>((resolve, reject) => {
    axios
      .get('backend/indexpagepackage/', {
        params: {
          date: date,
        },
      })
      .then(r => resolve(r.data))
      .catch(e => reject(e));
  });
}

export function GetPreviousSetsFor(exerciseId: number) {
  return new Promise<PreviousSetsResponse>((resolve, reject) => {
    axios
      .get('backend/getPreviousSetsFor/', {
        params: {
          exerciseId: exerciseId,
        },
      })
      .then(r => resolve(r.data as PreviousSetsResponse))
      .catch(e => reject(e));
  });
}

// has the same response type as addset response
export function SendCreateSplitRecordRequest(split: DBSplit) {
  return new Promise<AddSetResponse>((resolve, reject) => {
    axios
      .get('backend/createSplitRecord/', {
        params: {
          splitId: split.ID,
          splitName: split.NAME,
        },
      })
      .then(r => resolve(r.data as AddSetResponse))
      .catch(e => reject(e));
  });
}

export function SendAddSetRequest(params: DBExerciseSet) {
  return new Promise<AddSetResponse>((resolve, reject) => {
    axios
      .get('backend/addset/', {
        params: {
          weight: params.WEIGHT,
          reps: params.REPS,
          dropset: params.DROPSET,
          warmup: params.WARMUP,
          failuire: params.FAILIURE,
          recordId: params.SPLIT_RECORD_ID,
          exerciseId: params.EXERCISE_ID,
        },
      })
      .then(r => resolve(r.data as AddSetResponse))
      .catch(e => reject(e));
  });
}

export function SendFinishSessionRequest() {
  return new Promise<FinishSessionResponse>((resolve, reject) => {
    axios
      .get('backend/finishSession/')
      .then(r => resolve(r.data as FinishSessionResponse))
      .catch(e => reject(e));
  });
}
