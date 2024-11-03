import React, { useState } from 'react';
import { collection, getDocs, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '@/lib/firebase';

type ClearanceStatus = 'Approved' | 'Disapproved' | 'None' | 'Pending';

interface StudentSubmissionData {
  studentName: string;
  studentID: string;
  status: ClearanceStatus;
  approvedAt: Timestamp;
  submittedAt: Timestamp;
  teacherUID: string;
  scheduleDate: string;
  userDepartment: string;
  userCourse: string;
  studentUID: string;
  userLevel: string;
  requirementFiles?: { requirement: string; urls: string[] }[];
  submissionsUID: string;
  teacherName: string;
  teacherDepartment: string;
  teacherID: string;
  signature: string;
  studentAmountInput: string;
  studentGcashNumber: string;
  purpose: string;
  SSGAdviserattachedReceiptURL: string;
  PTCATreasurerAttachedReceiptURL: string;
  DeanAttachedReceiptURL: string;
}

function PendingStatus() {
  const [studentSubmissionsData, setStudentSubmissionsData] = useState<StudentSubmissionData[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchAttempts, setFetchAttempts] = useState<number>(0);
  const [noMoreData, setNoMoreData] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedViewClearance, setSelectedViewClearance] = useState<StudentSubmissionData | null>(null);
  const [loadingDisapprove, setLoadingDisapprove] = useState<boolean>(false);
  const [showDisapproveField, setShowDisapproveField] = useState<boolean>(false);
  const [disapproveReason, setDisapproveReason] = useState<string>('');

  const auth = getAuth();
  const currentUser = auth.currentUser;

  const MAX_ATTEMPTS = 3;

  const fetchStudentSubmissionsData = async () => {
    if (fetchAttempts >= MAX_ATTEMPTS || noMoreData) return;

    try {
      const fetchStudentSubmissionsDataSnapshot = await getDocs(collection(firestore, 'studentSubmissions'));
      const fetchedSubmissionData: StudentSubmissionData[] = [];

      fetchStudentSubmissionsDataSnapshot.forEach(doc => {
        const data = doc.data();
        fetchedSubmissionData.push({
          studentName: data.studentName,
          status: data.status as ClearanceStatus,
          submittedAt: data.submittedAt,
          teacherUID: data.teacherUID,
          scheduleDate: data.scheduleDate,
          studentID: data.studentID,
          userDepartment: data.userDepartment,
          userCourse: data.userCourse,
          userLevel: data.userLevel,
          requirementFiles: data.requirementFiles || [],
          submissionsUID: data.submissionsUID,
          studentUID: data.studentUID,
          approvedAt:data.approvedAt,
          teacherName:data.teacherName,
          teacherDepartment:data.teacherDepartment,
          teacherID:data.teacherID,
          signature:data.signature,
          studentAmountInput:data.studentAmountInput,
          studentGcashNumber:data.studentGcashNumber,
          purpose:data.purpose,
          SSGAdviserattachedReceiptURL:data.SSGAdviserattachedReceiptURL,
          PTCATreasurerAttachedReceiptURL:data.PTCATreasurerAttachedReceiptURL,
          DeanAttachedReceiptURL:data.DeanAttachedReceiptURL
        });
      });

      if (fetchedSubmissionData.length === 0) {
        setErrorMessage('No clearance has been submitted yet.');
        setNoMoreData(true);
      } else {
        setStudentSubmissionsData(fetchedSubmissionData);
        setErrorMessage(null);
      }

      if(currentUser){
        const submissionOwner = fetchedSubmissionData.filter(
          submissionStudentChecker => submissionStudentChecker.studentUID === currentUser.uid
        );
        setStudentSubmissionsData(submissionOwner);
      }

    } catch (error) {
      console.error('Error fetching clearances:', error);
      setErrorMessage('Failed to fetch student submissions.');
    } finally {
      setFetchAttempts(prev => prev + 1);
    }
  };

  if (currentUser && fetchAttempts < MAX_ATTEMPTS && studentSubmissionsData.length === 0) {
    fetchStudentSubmissionsData();
  }

  const getStatusColor = (status: ClearanceStatus) => {
    switch (status) {
      case 'Approved':
        return 'text-green-500';
      case 'Disapproved':
        return 'text-red-500';
      case 'Pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatTimestamp = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleString();
  };
  
  const getSubmissionStatusMessage = (approvedAt: Timestamp, scheduleDate: string) => {
    const submittedDate = approvedAt.toDate();
    const scheduledDate = new Date(scheduleDate);

    if (submittedDate > scheduledDate) {
      return { message: 'Overdue', color: 'text-red-500' };
    } else {
      return { message: 'On Time', color: 'text-green-500' };
    }
  };

  const openModal = (ViewSelectedclearance: StudentSubmissionData) => {
    setSelectedViewClearance(ViewSelectedclearance);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowDisapproveField(false);
    setSelectedViewClearance(null);
    setDisapproveReason('');
  };

  const pendingSubmissions = studentSubmissionsData.filter(submission => submission.status === 'Pending');
  if (pendingSubmissions.length === 0 && errorMessage === null) {
    setErrorMessage('No Pending Clearance yet.');  // Set the error message if there are no approved submissions
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 text-gray-800">
      <section className="container mx-auto px-4 mt-10">
        {errorMessage && <p className="text-red-500 text-center italic">{errorMessage}</p>}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 ml-8">
        {pendingSubmissions.map((submissionDataInfo, index) => {
          const { message, color } = getSubmissionStatusMessage(submissionDataInfo.submittedAt, submissionDataInfo.scheduleDate);
            return (
              <div key={index} className="relative bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <span className="font-semibold text-gray-700 text-xl">Status:</span>                    
                  <span className={`ml-2 text-xl ${getStatusColor(submissionDataInfo.status)}`}>
                    {submissionDataInfo.status}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700">Instructor Name:</span>
                      <span className="ml-2 text-gray-600">{submissionDataInfo.teacherName}</span>
                    </div>
                    <button onClick={() => openModal(submissionDataInfo)} className="text-blue-600 hover:underline font-semibold ml-3">View</button>
                    </div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700">Submitted Time:</span>
                      <span className="text-gray-700 ml-2">{formatTimestamp(submissionDataInfo.submittedAt)}</span>
                    </div>
                    <span className={`${color} font-semibold cursor-not-allowed`}>{message}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* INSTRUCTOR DISPLAY */}
      {isModalOpen && selectedViewClearance?.teacherDepartment === 'INSTRUCTOR' &&(
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-[25rem] max-h-[80%] overflow-y-auto relative">
            <h2 className="text-2xl mb-6 text-center font-semibold mt-5">Clearance Submitted</h2>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="block text-gray-700">Teacher Name:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.teacherName} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Teacher Department:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.teacherDepartment} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Teacher ID:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.teacherID} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Submitted Time:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text"   value={formatTimestamp(selectedViewClearance?.submittedAt)} readOnly/>
              </div>

              {selectedViewClearance?.requirementFiles && selectedViewClearance.requirementFiles.length > 0 && (
                <div className="space-y-1 mt-4">
                  <label className="block text-gray-700">Requirement:</label>
                  {selectedViewClearance.requirementFiles.map((file, index) => (
                    <div key={index} className="mt-2">
                      <p className="w-full p-2 border border-gray-300 rounded cursor-not-allowed">{file.requirement}</p>
                      {file.requirement !== "No" && (
                        <>
                          <label className="block text-gray-700 mt-3">Attached Requirement:</label>
                          {file.urls.map((url, i) => (
                            <div key={i} className="mt-2 border border-gray-300 rounded overflow-hidden">
                              <img
                                src={url}
                                alt="Attached Requirement"
                                className="w-full p-2 border border-gray-300 rounded"
                                style={{ maxHeight: '5000px', objectFit: 'contain' }}
                              />
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-center space-x-5">
                <div className="flex justify-center space-x-5 mt-5">
                  <button onClick={closeModal} disabled= {loadingDisapprove} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray&t-700 transition duration-300 w-40 mt-5">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SSG ADVISER DISPLAY */}
      {isModalOpen && selectedViewClearance?.teacherDepartment === 'SSG ADVISER' &&(
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-[25rem] max-h-[80%] overflow-y-auto relative">
            <h2 className="text-2xl mb-6 text-center font-semibold mt-5">Clearance Submitted</h2>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="block text-gray-700">Teacher Name:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.teacherName} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Teacher Department:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.teacherDepartment} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Teacher ID:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.teacherID} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Submitted Time:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={formatTimestamp(selectedViewClearance?.submittedAt)} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Purpose</label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" 
                  value={selectedViewClearance?.purpose} 
                  readOnly 
                  rows={4}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Amount Submitted</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={`₱ ${selectedViewClearance?.studentAmountInput}`} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Gcash Number</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.studentGcashNumber} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Reciept Submitted</label>
                {selectedViewClearance?.SSGAdviserattachedReceiptURL && (
                  <img
                    src={selectedViewClearance.SSGAdviserattachedReceiptURL}
                    alt="Student Reciept"
                    className="w-full p-2 border border-gray-300 rounded"
                    style={{ maxHeight: '5000px', objectFit: 'contain' }}
                  />
                )}
              </div>

              <div className="flex justify-center space-x-5">
                <div className="flex justify-center space-x-5 mt-5">
                  <button onClick={closeModal} disabled= {loadingDisapprove} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray&t-700 transition duration-300 w-40 mt-5">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* PTCA TREASURER DISPLAY */}
      {isModalOpen && selectedViewClearance?.teacherDepartment === 'PTCA TREASURER' &&(
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-[25rem] max-h-[80%] overflow-y-auto relative">
            <h2 className="text-2xl mb-6 text-center font-semibold mt-5">Clearance Submitted</h2>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="block text-gray-700">Teacher Name:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.teacherName} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Teacher Department:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.teacherDepartment} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Teacher ID:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.teacherID} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Submitted Time:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={formatTimestamp(selectedViewClearance?.submittedAt)} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Purpose</label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" 
                  value={selectedViewClearance?.purpose} 
                  readOnly 
                  rows={4}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Amount Submitted</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={`₱ ${selectedViewClearance?.studentAmountInput}`} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Gcash Number</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.studentGcashNumber} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Reciept Submitted</label>
                {selectedViewClearance?.PTCATreasurerAttachedReceiptURL && (
                  <img
                    src={selectedViewClearance.PTCATreasurerAttachedReceiptURL}
                    alt="Student Reciept"
                    className="w-full p-2 border border-gray-300 rounded"
                    style={{ maxHeight: '5000px', objectFit: 'contain' }}
                  />
                )}
              </div>

              <div className="flex justify-center space-x-5">
                <div className="flex justify-center space-x-5 mt-5">
                  <button onClick={closeModal} disabled= {loadingDisapprove} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray&t-700 transition duration-300 w-40 mt-5">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* DEAN */}
      {isModalOpen && selectedViewClearance?.teacherDepartment === 'DEAN' &&(
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-[25rem] max-h-[80%] overflow-y-auto relative">
            <h2 className="text-2xl mb-6 text-center font-semibold mt-5">Clearance Submitted</h2>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="block text-gray-700">Teacher Name:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.teacherName} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Teacher Department:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.teacherDepartment} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Teacher ID:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.teacherID} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Submitted Time:</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={formatTimestamp(selectedViewClearance?.submittedAt)} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Purpose</label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" 
                  value={selectedViewClearance?.purpose} 
                  readOnly 
                  rows={4}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Amount Submitted</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={`₱ ${selectedViewClearance?.studentAmountInput}`} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Gcash Number</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.studentGcashNumber} readOnly/>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-700">Reciept Submitted</label>
                {selectedViewClearance?.DeanAttachedReceiptURL && (
                  <img
                    src={selectedViewClearance.DeanAttachedReceiptURL}
                    alt="Student Reciept"
                    className="w-full p-2 border border-gray-300 rounded"
                    style={{ maxHeight: '5000px', objectFit: 'contain' }}
                  />
                )}
              </div>

              <div className="flex justify-center space-x-5">
                <div className="flex justify-center space-x-5 mt-5">
                  <button onClick={closeModal} disabled= {loadingDisapprove} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray&t-700 transition duration-300 w-40 mt-5">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingStatus;