import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, firestore, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export enum ClearanceStatus {
    disapproved = 'Disapproved',
    approved = 'Approved',
    noneStatus = 'None',
    reSubmit = 'Re-submit'
}

export interface Clearance {
  docId: string;
  fetched: Boolean
}

export interface Props {
  data: CreatedClearance[];
  fetched: Boolean
}

export interface CreatedClearance {
    docId: string;
    role: string;
    fullName: string;
    amount: string;
    purpose: string;
    status: ClearanceStatus;
}

export interface ClearanceData {
    clearanceId: string;
    creatorId: string;
    disapproveReason: string;
    gcashNumber: string;
    receiptURL: string | null;
    status: string;
    studentID: string;
    studentName: string;
    userId: string;
}

export const fetchDisapprovedClearances = async (): Promise<CreatedClearance[]> => {
  try {
    const user = auth.currentUser; 

    if (!user) {
      throw new Error('No user is logged in.');
    }

    const userUid = user.uid;

    const submissionsQuery = query(
      collection(firestore, 'studentSubmissions'),
      where('userId', '==', userUid) 
    );

    const submissionsSnapshot = await getDocs(submissionsQuery);
    const statuses: { [key: string]: ClearanceStatus } = {};

    submissionsSnapshot.forEach((doc) => {
      const data = doc.data();
      statuses[data.clearanceId] = data.status as ClearanceStatus;
    });

    const clearancesSnapshot = await getDocs(collection(firestore, 'clearances'));
    const clearancesWithStatus: CreatedClearance[] = [];

    clearancesSnapshot.forEach((doc) => {
      const data = doc.data();
      const status = statuses[doc.id] || ClearanceStatus.noneStatus; 

      clearancesWithStatus.push({
        docId: doc.id,
        role: data.role,
        fullName: data.roleName,
        amount: data.amount,
        purpose: data.purpose,
        status: status,
      });
    });

    console.log(clearancesWithStatus)
    return clearancesWithStatus;
  } catch (error) {
    console.error('Error fetching clearances or statuses:', error);
    return [];
  }
};

export const fetchDisapprovedClearancesData = async (clearanceId: string): Promise<ClearanceData | null> => {
  try {
    const q = query(
      collection(firestore, "studentSubmissions"),
      where("clearanceId", "==", clearanceId),
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]; 
      const data = doc.data() as ClearanceData;
      return data;
    } else {
      console.log("No such document with clearanceId:", clearanceId);
      return null;
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    return null;
  }
};
export const updateClearance = async (
  clearanceId: string,
  updatedData: Partial<ClearanceData>,
  receipt?: File // Use the actual File object if provided
) => {
  const submissionsQuery = query(
    collection(firestore, 'studentSubmissions'),
    where('clearanceId', '==', clearanceId)
  );

  const submissionsSnapshot = await getDocs(submissionsQuery);

  if (submissionsSnapshot.empty) {
    throw new Error(`No document found with clearanceId ${clearanceId}`);
  }

  const docToUpdate = submissionsSnapshot.docs[0];
  const docRef = doc(firestore, 'studentSubmissions', docToUpdate.id);

  if (receipt) {
    const receiptURL = await uploadReceipt(receipt); // Pass the File, not receiptURL
    updatedData.receiptURL = receiptURL; // Save the receipt URL in updatedData
  }

  updatedData.status = 'Pending';

  if (Object.keys(updatedData).length === 0) {
    throw new Error('No data to update');
  }

  try {
    await updateDoc(docRef, updatedData); // Update the Firestore document with the new data
    console.log('Document updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating document:', error);
    return false;
  }
};

const uploadReceipt = async (receipt: File): Promise<string> => {
  const storageRef = ref(storage, `receipts/${receipt.name}`); // Reference for Firebase Storage
  await uploadBytes(storageRef, receipt); // Upload the file to Firebase Storage
  return getDownloadURL(storageRef); // Get the download URL and return it
};