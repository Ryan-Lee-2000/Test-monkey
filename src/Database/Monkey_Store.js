import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/main";
export async function createUser(user_arr){
    var uid = user_arr[0]
    var name = user_arr[1]
    var role = "TestMonkey"
    var monkey_doc = ""
    try {
        await setDoc(doc(db, "Users", uid), {
            Name: name,
            Role: role,
            Data: ""
        });
        // console.log("User Document written with ID: ", uid);
    } catch (e) {
        console.error("Error adding document: ", e);
        return
    }

    if(role == "TestMonkey"){
        try {
            const docRef = await addDoc(collection(db, "TestMonkey"), {
                User: uid,
                Demographic: user_arr[2]
            });
            // console.log("Monkey Document written with ID: ", docRef.id);
            monkey_doc = docRef.id
            const userRef = doc(db, 'Users', uid);
            setDoc(userRef, { Data: "/TestMonkey/" + monkey_doc });
        } catch (e) {
            console.error("Error adding document: ", e);
            return
        }
    }

}


async function addUserDoc(){

}

export function exampleMissionData(){
    var mission_data = [
  {
    id: 1,
    name: "Senior Frontend Developer",
    description: "Join our team to build cutting-edge web applications using React and Vue.js with modern development practices.",
    company: "TechCorp Inc.",
    location: "Remote",
    salary: "$80k - $120k",
    type: "Full-time",
    posted: "2 days ago"
  },
  {
    id: 2,
    name: "UX/UI Designer",
    description: "Create intuitive and beautiful user interfaces for our mobile and web applications using Figma and Adobe Creative Suite.",
    company: "Design Studio",
    location: "New York, NY",
    salary: "$70k - $95k",
    type: "Full-time",
    posted: "1 week ago"
  },
  {
    id: 3,
    name: "Backend Engineer",
    description: "Develop robust server-side applications using Node.js, Python, and cloud technologies. Experience with microservices preferred.",
    company: "CloudTech Solutions",
    location: "San Francisco, CA",
    salary: "$90k - $130k",
    type: "Full-time",
    posted: "3 days ago"
  },
  {
    id: 4,
    name: "Data Scientist",
    description: "Analyze complex datasets and build machine learning models to drive business insights and decision-making processes.",
    company: "Analytics Pro",
    location: "Boston, MA",
    salary: "$95k - $140k",
    type: "Full-time",
    posted: "5 days ago"
  },
  {
    id: 5,
    name: "DevOps Engineer",
    description: "Manage CI/CD pipelines, containerization, and cloud infrastructure using AWS, Docker, and Kubernetes technologies.",
    company: "Infrastructure Inc.",
    location: "Seattle, WA",
    salary: "$85k - $125k",
    type: "Contract",
    posted: "1 day ago"
  },
  {
    id: 6,
    name: "Mobile App Developer",
    description: "Build native iOS and Android applications using Swift, Kotlin, and cross-platform frameworks like Flutter.",
    company: "Mobile First",
    location: "Austin, TX",
    salary: "$75k - $110k",
    type: "Full-time",
    posted: "4 days ago"
  },
  {
    id: 7,
    name: "Product Manager",
    description: "Lead product development from conception to launch, working closely with engineering, design, and marketing teams.",
    company: "Innovation Labs",
    location: "Chicago, IL",
    salary: "$100k - $150k",
    type: "Full-time",
    posted: "1 week ago"
  },
  {
    id: 8,
    name: "Cybersecurity Analyst",
    description: "Protect our systems and data by implementing security measures, conducting audits, and responding to security incidents.",
    company: "SecureNet Corp",
    location: "Washington, DC",
    salary: "$80k - $120k",
    type: "Full-time",
    posted: "6 days ago"
  }
]
return mission_data
}