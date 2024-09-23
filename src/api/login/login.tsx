import { firestore } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

export const getLoginType = async(uid: string) => {
    const userDocRef = doc(firestore, 'users', uid) 
    const userDoc = await getDoc(userDocRef)
    if (userDoc.exists()) {
        const userData = userDoc.data()
        return userData ? userData?.department : 'student'
    }

    return null
}