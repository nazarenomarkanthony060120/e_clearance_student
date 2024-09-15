import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';

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
  disapproveReason?: string; // Added field for disapproveReason
}

function ClearanceStatusView() {
  const [fetchClearances, setFetchClearances] = useState<CreatedClearance[]>([]);
  const [selectedClearance, setSelectedClearance] = useState<CreatedClearance | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentSubmission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false); // New loading state

  const clearanceStatus = { 
    approvedStatus: 'Approved' as ClearanceStatus,
    disapprovedStatus: 'Disapproved' as ClearanceStatus,
    noneStatus: 'None' as ClearanceStatus,
    reSubmitStatus: 'Re-submit' as ClearanceStatus,
    pendingStatus: 'Pending' as ClearanceStatus,
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
        const user = auth.currentUser;
        if (user) {
          const userUid = user.uid;
  
          // Query the 'studentSubmissions' collection where the user ID matches the logged-in user
          const submissionsQuery = query(
            collection(firestore, 'studentSubmissions'),
            where('userId', '==', userUid)
          );
          const submissionsSnapshot = await getDocs(submissionsQuery);
          const statuses: { [key: string]: ClearanceStatus } = {};
  
          submissionsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status !== clearanceStatus.noneStatus) {
              statuses[data.clearanceId] = data.status as ClearanceStatus;
            }
          });
  
          // Fetch clearances and match them with statuses
          const clearancesSnapshot = await getDocs(collection(firestore, 'clearances'));
          const clearancesWithStatus: CreatedClearance[] = [];
  
          clearancesSnapshot.forEach((doc) => {
            const data = doc.data();
            if (statuses[doc.id]) {
              clearancesWithStatus.push({
                docId: doc.id,
                role: data.role,
                fullName: data.roleName,
                amount: data.amount,
                purpose: data.purpose,
                status: statuses[doc.id] || clearanceStatus.noneStatus,
              });
            }
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
          disapproveReason: studentData.disapproveReason, // Set disapproveReason if available
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

  const handleResubmit = async () => {
    if (selectedClearance) {
      setLoading(true); // Start loading
      const timeoutId = setTimeout(() => {
        setLoading(false); // End loading after 3 seconds
      }, 3000); // 3 seconds delay
      setLoading(true);

      try {
        const user = auth.currentUser;
        if (!user) return; 
  
        const userUid = user.uid;
  
        // Update the status in the 'clearances' collection
        const clearanceDocRef = doc(firestore, 'clearances', selectedClearance.docId);
        await updateDoc(clearanceDocRef, { status: clearanceStatus.noneStatus });
  
        // Update the status in the 'studentSubmissions' collection
        const studentSubmissionQuery = query(
          collection(firestore, 'studentSubmissions'),
          where('userId', '==', userUid), // Assuming 'userId' is used to identify the student
          where('clearanceId', '==', selectedClearance.docId) // Match by clearance ID
        );
  
        const studentSubmissionSnapshot = await getDocs(studentSubmissionQuery);
        if (!studentSubmissionSnapshot.empty) {
          const submissionDocId = studentSubmissionSnapshot.docs[0].id;
          const submissionDocRef = doc(firestore, 'studentSubmissions', submissionDocId);
          await updateDoc(submissionDocRef, { status: clearanceStatus.reSubmitStatus });
        }
  
        // Remove the clearance from the display by filtering it out from the state
        setFetchClearances((prevClearances) =>
          prevClearances.filter((c) => c.docId !== selectedClearance.docId)
        );
  
        // Close the modal
        setShowModal(false);
  
        console.log('Clearance status updated to None');
      } catch (error) {
        console.error('Error updating clearance status:', error);
      } finally {
        setLoading(false); // End loading
      }
    }
  };
  

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 text-gray-800">
      <section className="container mx-auto px-4 mt-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 ml-8">
          {fetchClearances
            .filter(clearance => clearance.status !== clearanceStatus.reSubmitStatus)
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
                  <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={studentDetails.studentID} readOnly />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-700">Student Name</label>
                  <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={studentDetails.studentName} readOnly />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-700">GCASH Number</label>
                  <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={studentDetails.gcashNumber} readOnly />
                </div>

                {studentDetails.receiptURL && ( 
                  <div className="space-y-1">
                    <label className="block text-gray-700">Submitted Evidence</label>
                    <img className="w-full h-auto border border-gray-300 rounded" src={studentDetails.receiptURL} alt="Receipt" />
                  </div>
                )}

                {/* Conditionally render disapproveReason if status is 'Disapproved' */}
                {selectedClearance?.status === clearanceStatus.disapprovedStatus && studentDetails.disapproveReason && (
                  <div className="space-y-1">
                    <label className="block text-red-700 mt-10">Disapproval Reason:</label>
                    <textarea className="w-full p-2 border border-gray-300 rounded cursor-not-allowed h-32 resize-none overflow-y-auto"
                    value={studentDetails.disapproveReason} readOnly/> 

                  </div>
                )}
                
              </div>
            ) : (
              <p>No details available</p>
            )}
            <div className="flex justify-center mt-15 space-x-4">
              {/* Resubmit Button */}
              {selectedClearance?.status === clearanceStatus.disapprovedStatus && (
                <button
                  className={`bg-blue-500 text-white py-2 px-4 mt-4 rounded hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleResubmit}
		              disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Resubmit'}
                </button>
              )}
              <button
                className={`bg-gray-500 text-white py-2 px-4 mt-4 rounded hover:bg-gray-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setShowModal(false)}
		            disabled={loading} // Disable button if loading
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClearanceStatusView;
