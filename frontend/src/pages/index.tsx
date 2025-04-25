
import axios from "axios";             
import { useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from "react";

import { IoMdAdd } from "react-icons/io";
import { IoArrowBack } from "react-icons/io5";
import { FaSearch } from "react-icons/fa";
import { ImBin } from "react-icons/im";
import { HiOutlineSwitchHorizontal } from "react-icons/hi";

export default function IndexPage() {

    // get the date in the url for this splits record
    const useQuery = () => { return new URLSearchParams(useLocation().search) };
    const query = useQuery();
    var date = query.get('date');
    if (!date) {
        date = new Date().toLocaleDateString('en-GB');
    }

    // interfaces with DB indicate an interface that can be directly received from the database 
    interface DBSplit {
        ID: number,
        NAME: string,
    }

    interface DBSplitRecord {
        ID: number,
        SPLIT_ID: string,
        DATE: string,
        SPLIT_NAME: string
    }

    interface DBExerciseSet {
        ID: number,
        WEIGHT: number,
        DROPSET: boolean,
        WARMUP: boolean,
        REPS: number,
        SPLIT_RECORD_ID?: number,
        EXERCISE_ID: number,
    }

    // database version has WEIGHT_TYPE_ID instead
    interface Exercise {
        ID: number,
        NAME: string,
        WEIGHT_TYPE: string,
        BODY_PART_ID: number
    }

    // used to populate eeach exercise, their sets & previous sets
    interface ExerciseRecordForFrontend extends Exercise {
        sets: Array<DBExerciseSet>,
        previousSets: Array<DBExerciseSet>
    }

    // what we recieve from the backend in order to use the frontend
    interface IndexPagePackage {
        splits: Array<DBSplit>,
        allExercises: Array<Exercise>,
        recordId?: number,
        currentExercises: Array<ExerciseRecordForFrontend>,
        todaysSplit: DBSplit,
        previousRecords: Array<DBSplitRecord>,
        isRecordEditable: boolean
    }

    // use states
    const [splitSelected, setSplitSelected] = useState<DBSplit>({ ID: -1, NAME: 'none' });
    const [userLookingForNewSession, setNewRoutine] = useState<boolean>(true);

    const [selectedExercise, setSelectedExercise] = useState<Exercise>();
    const [allExercises, setAllExercises] = useState<Array<Exercise>>([]);

    const [splits, setSplits] = useState<Array<DBSplit>>([]);

    const [exercises, setExercises] = useState<Array<ExerciseRecordForFrontend>>([]);
    const [recordId, setRecordId] = useState<number>(-1);

    const [previousRecords, setPreviousRecords] = useState<Array<DBSplitRecord>>([]);
    const [editable, setEditable] = useState<boolean>(true);

    const [dropset, setDropset] = useState<boolean>(false);
    const [warmup, setWarmup] = useState<boolean>(false);

    const set_weight_ref = useRef<HTMLInputElement>(null);
    const set_reps_ref = useRef<HTMLInputElement>(null);

    // on page load
    useEffect(() => {
        axios.get('backend/getconn/',{})
           .then((response) => {
	      console.log(response.data);	
	   });

        axios.get('backend/indexpagepackage/', {
            params: {
                date: date
            }
        })
            .then((response) => {
                console.log(response.data);
                var data: IndexPagePackage = response.data;

                setSplits(data.splits);
                setAllExercises(data.allExercises);
                setPreviousRecords(data.previousRecords);
                setEditable(data.isRecordEditable);

                if (data.recordId) {
                    setSplitSelected(data.todaysSplit)
                    setExercises(data.currentExercises);
                    setRecordId(data.recordId);
                }
            });
    }, [])

    // dont allow warmup and dropset to be toggled on at the same time
    useEffect(() => {
        if (dropset) setWarmup(false);
    }, [dropset])

    useEffect(() => {
        if (warmup) setDropset(false);
    }, [warmup])

    // once the user has selected the exercise 
    function AddExerciseConfirmed() {
        if (!selectedExercise) { alert('exercise not found'); return; } // if for some reason it's null

        // give the selected exercise sets and previous sets properties 
        var selectedExcCpy = selectedExercise as ExerciseRecordForFrontend;
        selectedExcCpy['sets'] = [];
        selectedExcCpy['previousSets'] = [];

        // get the previous workout sessions sets for this exercise
        axios.get('backend/getPreviousSetsFor/', {
            params: {
                exerciseId: selectedExercise.ID
            }
        }).then((response) => {
            // console.log(response.data);
            for (var set of response.data.previousSets) {
                selectedExcCpy.previousSets.push(set);
            }
            var cpy = structuredClone(exercises);
            cpy.push(selectedExcCpy);

            setExercises(cpy);
        })

        // hide the add exercise modal
        const modal = document.getElementById('select-exercise-modal') as HTMLDialogElement | null;
        modal!.close();
    }

    // if the user accidentally selects the wrong exercise, have it deleted
    function deleteExercise(exercise: ExerciseRecordForFrontend) {
        // shouldn't delete an exercise with sets
        if (exercise.sets.length != 0) {
            return;
        }
        var cpy = structuredClone(exercises);
        var filtered = cpy.filter((e) => e.ID !== exercise.ID); // remove the exercise from the global exercises array
        setExercises(filtered);
    }

    // add a set for the selected exercise
    function addSet() {

        // ensure that the weight and rep fields are not empty 
        if (/\S/.test(set_weight_ref.current!.value) == false || /\S/.test(set_reps_ref.current!.value) == false) {
            return;
        }

        // convert them into numbers
        const weight = Number(set_weight_ref.current!.value);
        console.log(weight);
        const reps = Number(set_reps_ref.current!.value);
        var setId: number = -1;

        // if the record Id is null - the record doesn't exist. send a req to create a record for this session
        if (recordId == -1) {
            axios.get('backend/createSplitRecord/', {
                params: {
                    splitId: splitSelected.ID,
                    splitName: splitSelected.NAME
                },
            })
                .then((response) => {
                    // console.log(response.data);
                    if (!response.data.success) {
                        alert('something went wrong creating the split record..');
                    } else {
                        setRecordId(response.data.recordId);
                    }
                    setId = sendAddSetRequest(weight, reps, response.data.recordId);
                });
        }
        else {
            setId = sendAddSetRequest(weight, reps);
        }

        // add this set to the sets property for this exercise
        var cpy = structuredClone(exercises);

        // selectedExc is a reference NOT a copy
        var selectedExc = cpy.find((obj) => obj.NAME == selectedExercise!.NAME);

        if (!selectedExc) { alert("selected Exercise is null"); return; }
        selectedExc.sets.push({
            REPS: reps,
            WEIGHT: weight,
            WARMUP: warmup,
            DROPSET: dropset,
            ID: setId,
            EXERCISE_ID: selectedExc.ID
        });

        // console.log(cpy);

        setExercises(cpy);

        // clear the inputs and reset the warmup/dropdown checkboxes
        set_weight_ref.current!.value = '';
        set_reps_ref.current!.value = '';
        setWarmup(false);
        setDropset(false);

        // hide the modal 
        const modal = document.getElementById('add-set-modal') as HTMLDialogElement | null;
        modal!.close();
    }

    // add the set to the database record
    function sendAddSetRequest(weight: number, reps: number, recId?: number) {
        var setId = -1;
        axios.get('backend/addset/', {
            params: {
                weight: weight,
                reps: reps,
                dropset: dropset,
                warmup: warmup,
                recordId: recId ?? recordId,
                exerciseId: selectedExercise!.ID,
            }
        })
            .then((response) => {
                console.log(response.data);
                setId = response.data.recordId;
            });
        return setId;
    }

    // user presses complete 
    function finishSession() {
        if (!confirm('are you sure you want to complete the session?')) return;
        axios.get('backend/finishSession/', {})
            .then((response: any) => {
                console.log(response.data);
                if (!response.data.success) {
                    alert(response.data.message);
                }
                else {
                    window.location.reload();
                }
            });
    }

    // convert floats if they can be integers. 16kg looks cleaner than 16.0kg 
    function convertIfInteger(num: number) {
        if (num % 1 === 0) {
            return Math.floor(num);
        }
        return num;
    }

    return <div className="overflow-y-auto">
        <div className="space-y-2 pb-36">
            {splitSelected.NAME != 'none' && (<>

                <div className="flex items-center justify-between w-full px-4 py-3 border-b shadow-sm bg-white">
                    <div className="flex items-center gap-3">
                        <a><IoArrowBack className="cursor-pointer text-2xl text-gray-700" onClick={() => setSplitSelected({ ID: -1, NAME: 'none' })} /></a>
                        <h1 className="text-xl font-semibold text-gray-900">{splitSelected.NAME}</h1>
                    </div>
                    {editable && (
                        <button className="btn btn-success btn-soft p-2" onClick={() => finishSession()}>Finish</button>
                    )}
                </div>

                {exercises.map((exercise, key) => {
                    return <>
                        <div key={key} className="w-screen mx-auto overflow-hidden flex flex-col mt-5">
                            <div className="bg-gray-600 h-full w-11/12 m-auto rounded-xl mb-5 flex">
                                <h2 className="text-lg text-white w-full font-semibold p-3">{exercise.NAME}</h2>
                                {editable && exercise.sets && exercise.sets.length == 0 && (
                                    <button onClick={() => deleteExercise(exercise)}><ImBin size={25} className="mr-5" color="red" /> </button>
                                )}
                            </div>

                            <div className="flex space-x-4 p-4 gap-3">
                                {exercise.previousSets && exercise.previousSets.map((set, key) => {
                                    return <div key={key} className="w-20 h-20 flex flex-col justify-center items-center border-2 border-gray-700 rounded-lg indicator">
                                        {set.WARMUP && (<span className="indicator-item badge bg-[#FFBC00]"></span>)}
                                        {set.DROPSET && (<span className="indicator-item badge bg-red-500"></span>)}
                                        <div className="text-xl font-bold text-whtie">{convertIfInteger(set.WEIGHT)}kg</div>
                                        <div className="text-sm text-gray-400">{set.REPS} reps</div>
                                    </div>
                                })}
                            </div>

                            <div className="flex space-x-4 p-4 gap-3">
                                {exercise.sets && exercise.sets.map((set, k) => {
                                    return <div key={k} className="w-20 h-20 flex flex-col justify-center items-center border-2 border-gray-300 rounded-lg indicator">
                                        {set.WARMUP && (<span className="indicator-item badge bg-[#FFBC00]"></span>)}
                                        {set.DROPSET && (<span className="indicator-item badge bg-red-500"></span>)}
                                        <div className="text-xl font-bold text-whtie">{convertIfInteger(set.WEIGHT)}kg</div>
                                        <div className="text-sm text-gray-400">{set.REPS} reps</div>
                                    </div>
                                })}
                            </div>
                            {editable && (
                                <button
                                    className=" btn btn-success ml-auto text-white rounded-md mr-5 mt-5"
                                    onClick={() => {
                                        setSelectedExercise(exercise);
                                        const modal = document.getElementById('add-set-modal') as HTMLDialogElement | null;
                                        modal!.showModal()
                                    }}>
                                    Add set
                                </button>
                            )}
                        </div>
                        <div className="divider px-5 "></div>
                    </>
                })}
                
                {editable && (
                    <button className="btn btn-circle float-right mr-5 bg-[#616161]" onClick={() => {
                        const modal = document.getElementById('select-exercise-modal') as HTMLDialogElement | null
                        modal!.showModal();
                    }}><IoMdAdd size={20}/></button>
                )}
            </>)}

            {splitSelected.NAME == 'none' && (<>

                {(userLookingForNewSession && recordId == -1) && (<>
                    <div className='h-[70vh] flex flex-col items-center justify-start py-2 mt-10'>
                        {splits.map((split, key) => {
                            return <button key={key} className='btn btn-outline btn-primary m-auto w-60 rounded-xl text-white' onClick={() => setSplitSelected(split)}>{split.NAME}</button>
                        })}
                    </div>
                    <button className="fixed bottom-24 right-4 btn btn-secondary" onClick={() => setNewRoutine(false)}>
                        Select Existing Workout
                    </button>
                </>)}

                {(!userLookingForNewSession || recordId != -1) && (<>
                    <div className="flex bg-gray-800">
                        <p className="text-xl m-auto py-5">Choose previous session</p>
                    </div>
                    <div className='h-[70vh] flex flex-col items-center justify-start py-2 mt-10'>
                        {previousRecords.map((rec, key) => {
                            return <button key={key} className='btn btn-outline btn-primary m-auto w-60 rounded-xl text-white' onClick={() => { window.location.href = '?date=' + rec.DATE }}>{`${rec.SPLIT_NAME} on ${rec.DATE}`}</button>
                        })
                        }
                    </div>
                    {recordId != -1 && (
                        <button className="fixed bottom-24 right-4 btn btn-primary" onClick={() => window.location.reload()}>
                            Todays Workout
                        </button>
                    )}
                    {recordId == -1 && (
                        <button className="fixed bottom-24 right-4 btn btn-primary" onClick={() => setNewRoutine(true)}>
                            New Workout
                        </button>
                    )}
                </>)}
            </>)}

            <dialog id="select-exercise-modal" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-5">Select exercise</h3>
                    <label className="input mb-5">
                        <FaSearch /><input type="search" required placeholder="Search" />
                    </label>
                    <div className="w-64 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md m-auto">
                        {allExercises.map(function (obj, k) {
                            if (!exercises.find((e) => e.ID == obj.ID)) {
                                if (selectedExercise) {
                                    return <div key={k} onDoubleClick={AddExerciseConfirmed} className={`px-4 py-2 text-black ${selectedExercise.ID == obj.ID ? 'bg-amber-400' : 'bg-white'}`} onClick={() => setSelectedExercise(obj)}><div className="flex"><p className="m-auto">{obj.NAME}</p></div></div>
                                } else {
                                    return <div key={k} className={`px-4 py-2 text-black bg-white}`} onClick={() => setSelectedExercise(obj)}><div className="flex"><p className="m-auto">{obj.NAME}</p></div></div>
                                }
                            }
                        })}
                    </div>
                    <button className="btn btn-success float-right mt-5" onClick={AddExerciseConfirmed}>Select</button>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

            <dialog id="add-set-modal" className="modal overflow-visible">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-5">Add set</h3>
                    <div className="flex flex-col gap-5">
                        <div className="flex">
                            <div className='flex w-2/3'>
                                <label className="input">
                                    <input ref={set_weight_ref} type="search" className="grow" placeholder="weight" />
                                    <kbd className="kbd kbd-sm">kg</kbd>
                                </label>
                            </div>
                            <button className='btn btn-square bg-gray-400 ml-auto'><HiOutlineSwitchHorizontal size={20} /></button>
                        </div>
                        <input ref={set_reps_ref} type="number" className="input w-2/3" placeholder="Reps"></input>
                        <div className="flex w-2/3">
                            <label>Warmup</label>
                            <input type="checkbox" checked={warmup} onChange={() => setWarmup(!warmup)} className="toggle toggle-warning ml-auto" />
                        </div>
                        <div className="flex w-2/3">
                            <label>Dropset</label>
                            <input type="checkbox" checked={dropset} onChange={() => setDropset(!dropset)} className="toggle toggle-error ml-auto" />
                        </div>
                    </div>
                    <button className="btn btn-success float-right mt-5" onClick={() => addSet()}>Add</button>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

        </div>
    </div>
}
