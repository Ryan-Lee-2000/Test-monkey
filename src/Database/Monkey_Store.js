import { collection, addDoc, doc, setDoc, updateDoc, getDoc, getDocs, query } from "firebase/firestore";
import { db,storage } from "@/main";
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { getAuth } from "firebase/auth";

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
            const docRef = await addDoc(collection(db, "Founders"), {
                User: uid,
                Demographic: user_arr[2]
            });
            // console.log("Monkey Document written with ID: ", docRef.id);
            monkey_doc = docRef.id
            const userRef = doc(db, 'Users', uid);
            updateDoc(userRef, { Data: "/Founders/" + monkey_doc });
        } catch (e) {
            console.error("Error adding document: ", e);
            return
        }
    } else{ // User is a Test Monkey
        try {
            const docRef = await addDoc(collection(db, "TestMonkey"), {
                User: uid,
                Demographic: user_arr[2]
            });
            // console.log("Monkey Document written with ID: ", docRef.id);
            monkey_doc = docRef.id
            const userRef = doc(db, 'Users', uid);
            updateDoc(userRef, { Data: "/TestMonkey/" + monkey_doc });
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

export async function createMission(mission_detail){
        // 'missionName': missionName.value, 
        // 'description': description.value, 
        // 'num_testers': numberOfUsers.value, 
        // 'duration': duration.value, 
        // 'payout': bananasPayout.value, 
        // 'file': selectedFile.value

  //Create Mission
  try{
    const auth = getAuth();
    const uid = auth.currentUser.uid;
    const file = mission_detail.file

    const docRef = await addDoc(collection(db, "Missions"), {
        name: mission_detail.missionName,
        description: mission_detail.description,
        testers: mission_detail.num_testers,
        duration: mission_detail.duration,
        payout: mission_detail.payout,
        owner: uid
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
    const mission_data = doc.data()
    mission_data.mission_id = doc.id
    all_missions.push(mission_data)
  })
  return all_missions
}


//Placeholder
export function exampleMissionData(){
    var mission_data = [
  {
    id: 1,
    name: "Movie Aggregator Site",
    description: "We need testers to ensure that movies can be accessed by users without issue.",
    company: "MovieCorp Inc.",
    length: "1 Week",
    salary: "20 Bananas",
    type: "Full-time",
    posted: "2 days ago"
  },
  {
    id: 2,
    name: "UX/UI Designer",
    description: "Create intuitive and beautiful user interfaces for our mobile and web applications using Figma and Adobe Creative Suite.",
    company: "Design Studio",
    length: "New York, NY",
    salary: "$70k - $95k",
    type: "Full-time",
    posted: "1 week ago"
  },
  {
    id: 3,
    name: "Backend Engineer",
    description: "Develop robust server-side applications using Node.js, Python, and cloud technologies. Experience with microservices preferred.",
    company: "CloudTech Solutions",
    length: "San Francisco, CA",
    salary: "$90k - $130k",
    type: "Full-time",
    posted: "3 days ago"
  },
  {
    id: 4,
    name: "Data Scientist",
    description: "Analyze complex datasets and build machine learning models to drive business insights and decision-making processes.",
    company: "Analytics Pro",
    length: "Boston, MA",
    salary: "$95k - $140k",
    type: "Full-time",
    posted: "5 days ago"
  },
  {
    id: 5,
    name: "DevOps Engineer",
    description: "Manage CI/CD pipelines, containerization, and cloud infrastructure using AWS, Docker, and Kubernetes technologies.",
    company: "Infrastructure Inc.",
    length: "Seattle, WA",
    salary: "$85k - $125k",
    type: "Contract",
    posted: "1 day ago"
  },
  {
    id: 6,
    name: "Mobile App Developer",
    description: "Build native iOS and Android applications using Swift, Kotlin, and cross-platform frameworks like Flutter.",
    company: "Mobile First",
    length: "Austin, TX",
    salary: "$75k - $110k",
    type: "Full-time",
    posted: "4 days ago"
  },
  {
    id: 7,
    name: "Product Manager",
    description: "Lead product development from conception to launch, working closely with engineering, design, and marketing teams.",
    company: "Innovation Labs",
    length: "Chicago, IL",
    salary: "$100k - $150k",
    type: "Full-time",
    posted: "1 week ago"
  },
  {
    id: 8,
    name: "Cybersecurity Analyst",
    description: "Protect our systems and data by implementing security measures, conducting audits, and responding to security incidents.",
    company: "SecureNet Corp",
    length: "Washington, DC",
    salary: "$80k - $120k",
    type: "Full-time",
    posted: "6 days ago"
  }
]
return mission_data
}