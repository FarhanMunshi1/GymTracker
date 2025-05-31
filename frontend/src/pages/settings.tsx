import { useRef } from "react";
import * as Database from "../utils/Requests/SettingsPage";

export default function SettingsPage() {

    const splitRef = useRef<HTMLInputElement>(null);
    const excRef = useRef<HTMLInputElement>(null);

    function AddSplit() {
        Database.SendCreateSplitRequest(splitRef.current!.value).then(
            (data) => data.success ? alert('split added') : alert('error: ' + data.message),
            (error) => alert("Something went wrong sending the request: " + error) 
        );
    }

    function AddExc() {
        Database.SendCreateExerciseRequest(excRef.current!.value).then(
            (data) => data.success ? alert('excercise added') : alert('error: ' + data.message),
            (error) => alert("Something went wrong sending the request: " + error) 
        );
    }

    return <>
        <div className="p-6 max-w-md mx-auto h-screen space-y-6 bg-base-200 rounded-lg shadow-md">
            {/* Create Split Section */}
            <div>
                <p className="text-xl font-semibold underline mb-2">Create Split</p>
                <input ref={splitRef} placeholder="Split name" className="input input-bordered w-full mb-3" />
                <button className="btn btn-primary float-right mb-5" onClick={() => AddSplit()}>Add</button>
            </div>

            <div className="divider mt-15">OR</div>

            {/* Create Exercise Section */}
            <div>
                <p className="text-xl font-semibold underline mb-2">Create Exercise</p>
                <input ref={excRef} placeholder="Exercise name" className="input input-bordered w-full mb-3" />
                <button className="btn btn-primary float-right mb-5" onClick={() => AddExc()}>Add</button>
            </div>
        </div>
    </>
}
