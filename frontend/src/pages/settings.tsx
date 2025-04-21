import axios from "axios"
import { useRef } from "react";

export default function SettingsPage() {

    const splitRef = useRef<HTMLInputElement>(null);
    const excRef = useRef<HTMLInputElement>(null);

    function AddSplit() {
        axios.get('backend/addSplit/', { params: {
            splitName: splitRef.current!.value
        }})
        .then((response) => {
            console.log(response);
            if (!response.data.success) {
                alert('there was an error processing the request: ' + response.data.message);
            }
        })
    }

    function AddExc() {
        axios.get('backend/addExcerciseToDb/', { params: {
            excName: excRef.current!.value
        }})
        .then((response) => {
            console.log(response);
            if (!response.data.success) {
                alert('there was an error processing the request: ' + response.data.message);
            }
        })
    }

    return <>
        <div className="p-6 max-w-md mx-auto space-y-6 bg-base-200 rounded-lg shadow-md">
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

