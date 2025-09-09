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