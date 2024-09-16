import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase'; // Assuming auth is also exported from firebase config

type ClearanceStatus = 'Approved' | 'Disapproved' | 'None' | 'Pending' | 'Re-submit';

interface CreatedClearance {
  docId: string;
  role: string;
  fullName: string;
  amount: number;
  purpose: string;
  status: ClearanceStatus;
}

interface StudentSubmission {
  studentName: string;
  studentID: string;
  gcashNumber: string;
  receiptURL: string;
  status: ClearanceStatus;
}

function ClearanceStatusView() {
  const [fetchClearances, setFetchClearances] = useState<CreatedClearance[]>([]);
  const [selectedClearance, setSelectedClearance] = useState<CreatedClearance | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentSubmission | null>(null);
  const [showModal, setShowModal] = useState(false);

  const clearanceStatus = { 
    approvedStatus: 'Approved' as ClearanceStatus,
    disapprovedStatus: 'Disapproved' as ClearanceStatus,
    noneStatus: 'None' as ClearanceStatus,
    pendingStatus: 'Pending' as ClearanceStatus,
    reSubmit: 'Re-submit' as ClearanceStatus
  };

  const getStatusColor = (status: ClearanceStatus) => {
    switch (status) {
      case clearanceStatus.approvedStatus:
        return 'text-green-500';
      case clearanceStatus.disapprovedStatus:
        return 'text-red-500';
      case clearanceStatus.pendingStatus:
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  useEffect(() => {
    const fetchClearancesWithStatus = async () => {
      try {
        const user = auth.currentUser; // Get the currently logged-in user
        if (user) {
          const userUid = user.uid;

          // Query the 'studentSubmissions' collection where the user ID matches the logged-in user
          const submissionsQuery = query(
            collection(firestore, 'studentSubmissions'),
            where('userId', '==', userUid) // Assuming 'userId' is the field in studentSubmissions
          );
          const submissionsSnapshot = await getDocs(submissionsQuery);
          const statuses: { [key: string]: ClearanceStatus } = {};

          submissionsSnapshot.forEach((doc) => {
            const data = doc.data();
            statuses[data.clearanceId] = data.status as ClearanceStatus; // Adjust based on actual field names
          });

          // Fetch clearances and match them with statuses
          const clearancesSnapshot = await getDocs(collection(firestore, 'clearances'));
          const clearancesWithStatus: CreatedClearance[] = [];

          clearancesSnapshot.forEach((doc) => {
            const data = doc.data();
            console.log(doc)
            clearancesWithStatus.push({
              docId: doc.id,
              role: data.role,
              fullName: data.roleName,
              amount: data.amount,
              purpose: data.purpose,
              status: statuses[doc.id] || clearanceStatus.noneStatus, // Get status or default to 'None'
            });
          });

          setFetchClearances(clearancesWithStatus);
        }
      } catch (error) {
        console.error('Error fetching clearances or statuses:', error);
      }
    };

    fetchClearancesWithStatus();
  }, []);

  const handleViewClick = async (clearance: CreatedClearance) => {
    setSelectedClearance(clearance);

    // Fetch student details
    try {
      const submissionsSnapshot = await getDocs(collection(firestore, 'studentSubmissions'));
      const studentData = submissionsSnapshot.docs.find(doc => doc.data().clearanceId === clearance.docId)?.data();
      
      if (studentData) {
        setStudentDetails({
          studentName: studentData.studentName,
          studentID: studentData.studentID,
          gcashNumber: studentData.gcashNumber,
          receiptURL: studentData.receiptURL,
          status: studentData.status,
        });
      } else {
        setStudentDetails(null);
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      setStudentDetails(null);
    }

    setShowModal(true);
  };

  const resubmit = async (clearanceId: string) => {
    console.log(clearanceId);
    try {
      if (!clearanceId) {
        throw new Error('Clearance ID is empty');
      }
  
      const submissionsQuery = query(
        collection(firestore, 'studentSubmissions'),
        where('clearanceId', '==', clearanceId)
      );
  
      const submissionsSnapshot = await getDocs(submissionsQuery);
  
      if (submissionsSnapshot.empty) {
        throw new Error(`No document found with clearanceId ${clearanceId}`);
      }
  
      const docToUpdate = submissionsSnapshot.docs[0]; 
      const submissionDocId = docToUpdate.id; 
  
      const submissionDocRef = doc(firestore, 'studentSubmissions', submissionDocId);
      await updateDoc(submissionDocRef, {
        status: 'Re-submit',
      });
  
      setStudentDetails((prev) => prev ? { ...prev, status: 'Pending' } : null);
      setShowModal(false);
      console.log('Status updated to Pending.');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 text-gray-800">
      <section className="container mx-auto px-4 mt-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 ml-8">
          {fetchClearances
            .filter(clearance => clearance.status !== clearanceStatus.noneStatus && clearance.status !== clearanceStatus.reSubmit && clearance.status !== clearanceStatus.disapprovedStatus)
            .map((clearance) => (
              
              <div key={clearance.docId} className="relative bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Status:</h2>
                  <p className={`text-lg font-medium ${getStatusColor(clearance.status)}`}>
                    {clearance.status}
                  </p>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700">{clearance.role}:</span>
                      <span className="ml-2 text-gray-600">{clearance.fullName}</span>
                    </div>
                    <button className="text-blue-600 hover:underline font-semibold" onClick={() => handleViewClick(clearance)}>
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Modal for displaying student details */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-[25rem] max-h-[80%] overflow-y-auto relative">
            <h2 className="text-2xl mb-6 text-center font-semibold">Clearance Status</h2>
            {studentDetails ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="block text-gray-700">Student ID</label>
                  <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={studentDetails.studentID} readOnly/>
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-700">Student Name</label>
                  <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={studentDetails.studentName} readOnly/>
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-700">GCASH Number</label>
                  <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={studentDetails.gcashNumber} readOnly/>
                </div>

                {studentDetails.receiptURL && ( 
                  <div className="space-y-1">
                    <label className="block text-gray-700">Submitted Evidence</label>
                    <img className="w-full h-auto border border-gray-300 rounded" src={studentDetails.receiptURL} alt="Receipt" />
                  </div>
                )}
                
              </div>
            ) : (
              <p>No details available</p>
            )}
            <div className="gap-3 flex items-center justify-center">
              <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-300 mt-7 w-32" onClick={() => setShowModal(false)}>Close</button>
              {
              studentDetails?.status && studentDetails.status === 'Disapproved' &&
                <button className="bg-emerald-400 text-white px-4 py-2 rounded hover:bg-emerald-700 transition duration-300 mt-7 w-32" onClick={() => resubmit(selectedClearance?.docId || '')}>Re-Submit</button>
            }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClearanceStatusView;
