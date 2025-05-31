# fastapi dev main.py

from fastapi import FastAPI
from sqlmodel import Field, Session, SQLModel, create_engine, select, func
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
from sqlalchemy import desc
from types import SimpleNamespace
from collections import defaultdict

# db mapping classes
class BODY_PART(SQLModel, table=True):
    ID: int | None = Field(default=None, primary_key=True)
    NAME: str = Field()

class EXERCISE(SQLModel, table=True):
    ID: int | None = Field(default=None, primary_key=True)
    NAME: str = Field()
    BODY_PART_ID: int | None = Field(index=True)
    WEIGHT_TYPE: str | None = Field()

class EXERCISE_SET(SQLModel, table=True):
    ID: int | None = Field(default=None, primary_key=True)
    WEIGHT: float = Field()
    DROPSET: bool = Field()
    WARMUP: bool = Field()
    FAILIURE: bool = Field()
    REPS: int = Field()
    SPLIT_RECORD_ID: int = Field(index=True)
    EXERCISE_ID: int = Field(index=True)

class SPLIT(SQLModel, table=True):
    ID: int | None = Field(default=None, primary_key=True)
    NAME: str = Field()

class SPLIT_RECORD(SQLModel, table=True):
    ID: int | None = Field(default=None, primary_key=True)
    SPLIT_ID: int = Field(index=True)
    DATE: str = Field(index=True)
    SPLIT_NAME: str = Field()
    FINISHED: bool = Field()

#db file location
sqlite_file_name = 'GymApp.db'
sqlite_url = f'sqlite:///./db/{sqlite_file_name}'

#db config
connect_args = {'check_same_thread': False}
engine = create_engine(sqlite_url, echo=True, connect_args=connect_args)

# create the tables if not present
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.on_event('startup')
def on_startup():
    create_db_and_tables()

@app.get('/getconn/')
def get_conn():
    return {
     'success': True
    }

@app.get('/indexpagepackage/')
def getIndexPagePackage(date: str):
    
    with Session(engine) as session:
        splits = session.exec(select(SPLIT)).all()
        exercises = session.exec(select(EXERCISE)).all()
        existingRec = session.exec(select(SPLIT_RECORD).filter(SPLIT_RECORD.DATE == date).limit(1)).first()
        previousRecords = session.exec(select(SPLIT_RECORD).filter(SPLIT_RECORD.FINISHED == True).limit(5)).all()

        if existingRec is None:
            return {
                'splits': splits,
                'allExercises': exercises,
                'existingRecord': existingRec,
                'previousRecords' : previousRecords,
                'isRecordEditable': True,
            }

        # get all exercise records for today
        ExerciseRecordsForToday = session.exec(select(EXERCISE_SET).filter( EXERCISE_SET.SPLIT_RECORD_ID == existingRec.ID)).all()
        
        # group them by exercise so instead of a list of everything we have : [[exercise1 records...], [exercise2 records...],]
        grouped = defaultdict(list)
        for rec in ExerciseRecordsForToday:
            grouped[rec.EXERCISE_ID].append(rec)

        ExerciseRecordsForTodayGrouped = list(grouped.values())

        ExercisesDoneTodayIds = []
        excludeIds = []                                             # when querying the database for previous set records, we need to ignore these
        for excercise in ExerciseRecordsForTodayGrouped:
            ExercisesDoneTodayIds.append(excercise[0].EXERCISE_ID)  # the exercise ID is populated in each set record of the exercise. 
            for eSet in excercise:
                excludeIds.append(eSet.ID)                          

        # find out the last workout session where this exercise was done by getting the latest record of it excluding the records done today
        # we get the session ID from this record and then query the database to find all instances of this record ID and this Exercise ID 
        previousExercises = []
        for exerciseID in ExercisesDoneTodayIds:
            latestExerciseRecord = session.exec(select(EXERCISE_SET).filter((EXERCISE_SET.EXERCISE_ID == exerciseID) & (~EXERCISE_SET.ID.in_(excludeIds))).limit(1).order_by(desc(EXERCISE_SET.ID))).first()
            if latestExerciseRecord is not None:
                previousWorkoutValuesForThisExercise = session.exec(select(EXERCISE_SET).filter((EXERCISE_SET.EXERCISE_ID == latestExerciseRecord.EXERCISE_ID) & (EXERCISE_SET.SPLIT_RECORD_ID == latestExerciseRecord.SPLIT_RECORD_ID))).all()
                previousExercises.append(previousWorkoutValuesForThisExercise)
        
        # this code block manipulates what we have into the object that the frontend needs
        exerciseObjectsForFrontend = []
        for exerciseID in ExercisesDoneTodayIds: 
            exerciseObj = next((e for e in exercises if e.ID == exerciseID), None)
            exerciseObjForFrontend = SimpleNamespace(**exerciseObj.__dict__) ###
            for exercise in ExerciseRecordsForTodayGrouped:
                if exercise[0].EXERCISE_ID == exerciseID:
                    exerciseObjForFrontend.sets = exercise
            for exercise in previousExercises:
                if exercise[0].EXERCISE_ID == exerciseID:
                    exerciseObjForFrontend.previousSets = exercise

            exerciseObjectsForFrontend.append(exerciseObjForFrontend)

        todaysSplit = next((s for s in splits if s.ID == existingRec.SPLIT_ID))
        return {
            'splits': splits,
            'allExercises': exercises,
            'previousRecords': previousRecords,
            'recordId': existingRec.ID,
            'currentExercises': exerciseObjectsForFrontend,
            'todaysSplit': todaysSplit,
            'isRecordEditable': not existingRec.FINISHED,
        }

@app.get('/createSplitRecord/')
def create_split_record(splitId: int, splitName: str):
    today = datetime.today().strftime('%d/%m/%Y')
    SplitRec = SPLIT_RECORD()
    SplitRec.SPLIT_ID = splitId
    SplitRec.SPLIT_NAME = splitName
    SplitRec.DATE = today
    SplitRec.FINISHED = False

    with Session(engine) as session:
        session.query(SPLIT_RECORD).filter(SPLIT_RECORD.FINISHED == False).update({SPLIT_RECORD.FINISHED: True }) # auto finish any existing workout
        session.add(SplitRec)
        session.commit()

        return {
            'success': True,
            'recordId': SplitRec.ID,
        }

@app.get('/addset/')
def add_set(weight: float, reps: int, dropset: bool, warmup: bool, failuire: bool, recordId: int, exerciseId: int):
    print('hi')
    exerciseSet = EXERCISE_SET()
    exerciseSet.WEIGHT = weight
    exerciseSet.REPS = reps
    exerciseSet.DROPSET = dropset
    exerciseSet.WARMUP = warmup
    exerciseSet.FAILIURE = failuire
    exerciseSet.SPLIT_RECORD_ID = recordId
    exerciseSet.EXERCISE_ID = exerciseId

    with Session(engine) as session:
        session.add(exerciseSet)
        session.commit()

        return {
            'success': True,
            'recordId': exerciseSet.ID,
        }
    
@app.get('/getPreviousSetsFor/')
def get_previous_sets_for(exerciseId: int):
    with Session(engine) as session:
        latestExerciseRecord = session.exec(select(EXERCISE_SET).filter(EXERCISE_SET.EXERCISE_ID == exerciseId).limit(1).order_by(desc(EXERCISE_SET.ID))).first()
        if latestExerciseRecord is not None:
            AllSetsForThisExerciseInThatWorkout = session.exec(select(EXERCISE_SET).filter((EXERCISE_SET.EXERCISE_ID == exerciseId) & (EXERCISE_SET.SPLIT_RECORD_ID == latestExerciseRecord.SPLIT_RECORD_ID))).all()

            return {
                'success': True,
                'previousSets': AllSetsForThisExerciseInThatWorkout,
            }
        return {
            'success': True,
            'previousSets' : [],
            'message' : 'no previous sets were found for this exercise',
        }

@app.get('/finishSession/')
def finish_session():
    with Session(engine) as session:
        currentRecord = session.exec(
            select(SPLIT_RECORD).where(SPLIT_RECORD.FINISHED == False)
        ).first()

        if not currentRecord:
            return {
                'success': False,
                'message': 'No unfinished sessions found'
            }

        currentRecord.FINISHED = True
        session.add(currentRecord)
        session.commit()

        return {
            'success': True,
            'message': 'Session complete!'
        }

@app.get('/addSplit/')
def add_split(splitName : str):
    with Session(engine) as session:
        split = SPLIT()
        split.NAME = splitName
        session.add(split)
        session.commit()

        return {
            'success': True,
            'message': 'Split added!'
        }

@app.get('/addExcerciseToDb/')
def add_exc(excName: str):
    with Session(engine) as session:
        exc = EXERCISE()
        exc.NAME = excName
        session.add(exc)
        session.commit()

        return {
            'success': True,
            'message': 'Split added!'
        }
