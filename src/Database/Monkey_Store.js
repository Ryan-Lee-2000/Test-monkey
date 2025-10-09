import { collection, addDoc, doc, setDoc, updateDoc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db,storage } from "@/Config/api_services";
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { getAuth } from "firebase/auth";

import {claude_getQuestions} from '@/Claude/ai'

export async function createUser(user_arr){
    var uid = user_arr[0]
    var name = user_arr[1]
    var role = user_arr[3]
    var monkey_doc = ""
    try {
      var role_name = role? 'Founder':'TestMonkey'
      await setDoc(doc(db, "Users", uid), {
            Name: name,
            Role: role_name,
            Data: ""
        });
        // console.log("User Document written with ID: ", uid);
    } catch (e) {
        console.error("Error adding document: ", e);
        return
    }

    if(role){ //If user is founder
        try {
            await setDoc(doc(db, 'Founders',uid), {
                User: uid,
                Demographic: user_arr[2]
            });
            // console.log("Monkey Document written with ID: ", docRef.id);
            const userRef = doc(db, 'Users', uid);
            await updateDoc(userRef, { Data: "/Founders/" + uid });
        } catch (e) {
            console.error("Error adding document: ", e);
            return
        }
    } else{ // User is a Test Monkey
        try {
            await setDoc(doc(db, 'TestMonkey',uid), {
                User: uid,
                Demographic: user_arr[2],
                active_missions: [],
                mission_history: []
            });
            // console.log("Monkey Document written with ID: ", docRef.id);
            const userRef = doc(db, 'Users', uid);
            await updateDoc(userRef, { 
              Data: "/TestMonkey/" + uid,
            });
        } catch (e) {
            console.error("Error adding document: ", e);
            return
        }
    }

}

export async function getUserRole(uid){
  const docRef =  doc(db, 'Users',uid)
  const userDoc = await getDoc(docRef)

  return userDoc.data().Role
  
}

export async function getUserName(uid){
  if(uid == null){
    return null
  }
  const docRef =  doc(db, 'Users',uid)
  const userDoc = await getDoc(docRef)
  
  if(userDoc.data()){
    return userDoc.data().Name
  }
  return null
  
}

export async function createMission(mission_detail){
        // 'missionName': missionName.value, 
        // 'description': description.value, 
        // 'num_testers': numberOfUsers.value, 
        // 'duration': duration.value, 
        // 'payout': bananasPayout.value, 
        // 'file': selectedFile.value
        // 'questions': mission_questions_array

  //Create Mission
  try{
    const auth = getAuth();
    const uid = auth.currentUser.uid;
    const file = mission_detail.file

    const docRef = await addDoc(collection(db, "Missions"), {
        name: mission_detail.missionName,
        description: mission_detail.description,
        num_testers: mission_detail.num_testers,
        duration: mission_detail.duration,
        payout: mission_detail.payout,
        questions: mission_detail.questions,
        owner: uid,
        active_testers: [],
        status: 'Active'
    });

    //Upload File
    const mission_ref = storageRef(storage,`mission/${docRef.id}`)
    try{
      const snapshot = await uploadBytes(mission_ref, file);
      console.log('Uploaded a blob or file!');
    } catch(error){
      console.error("Error uploading file:", error);
    }

  } catch (e){
    console.error("Error adding mission: ", e);
  }

}

export async function getMissions(){
  const snapshot = await getDocs(query(collection(db,'Missions')))
  const all_missions = []
  snapshot.forEach((doc)=>{
    // console.log('foreach:',doc.data())
    const mission_data = doc.data()
    mission_data.mission_id = doc.id
    all_missions.push(mission_data)
  })
  //Check for Missions that have max users and removes them from the list
  const auth = getAuth();
  const uid = auth.currentUser.uid;
  // console.log('start', all_missions)
  for(let i = all_missions.length - 1; i >= 0; i--){
    if(all_missions[i].active_testers.length >= all_missions[i].num_testers){
      all_missions.splice(i, 1);
    } else if(all_missions[i].active_testers.indexOf(uid) > -1){
      all_missions.splice(i, 1);
    }
  }
  // console.log('leftover missions: ',all_missions)
  return all_missions
}

export async function joinMission(mission_id){
  //Allows for a user to join a mission
  const missionRef = doc(db, "Missions", mission_id);
  const missionDoc = await getDoc(missionRef);

  const auth = getAuth();
  const uid = auth.currentUser.uid;

  const userRef =  doc(db, 'TestMonkey',uid)
  const userDoc = await getDoc(userRef)

  var mission_testers = missionDoc.data().active_testers
  var user_active_missions = userDoc.data().active_missions
  mission_testers.push(uid)
  user_active_missions.push(mission_id)

  await updateDoc(missionRef, { 
              active_testers: mission_testers,
            });
  await updateDoc(userRef, { 
              active_missions: user_active_missions,
            });
}

export async function get_user_missions(uid){
  
  const active_missions = []

  const snapshot = await getDocs(query(collection(db,'Missions'),where("active_testers", "array-contains", uid)))
  snapshot.forEach((doc)=>{
    console.log('doc', doc.data())
    if(doc.data().status == 'Active'){
      console.log('pushing')
      active_missions.push(doc.data())
    }
  })

  return active_missions

}