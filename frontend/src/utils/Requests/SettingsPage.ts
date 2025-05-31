import axios from "axios"

export function SendCreateSplitRequest(splitName: string) {
    return new Promise<any>((resolve, reject) => {
        axios.get('backend/addSplit/', { params: {
            splitName: splitName
        }})
        .then((r) => resolve(r.data))
        .catch((e) => reject(e))
    })
}

export function SendCreateExerciseRequest(excName: string) {
    return new Promise<any>((resolve, reject) => {
        axios.get('backend/addExcerciseToDb/', { params: {
            excName: excName
        }})
        .then((r) => resolve(r.data))
        .catch((e) => reject(e))
    })
}
