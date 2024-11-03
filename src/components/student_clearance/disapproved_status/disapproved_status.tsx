import React, { useState } from 'react';
import { collection, getDocs, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { firestore, storage } from '@/lib/firebase';

type ClearanceStatus = 'Approved' | 'Disapproved' | 'None' | 'Pending';

interface StudentSubmissionData {
  status: ClearanceStatus;
  submittedAt: Timestamp;
  teacherUID: string;
  scheduleDate: string;
  studentUID: string;
  requirementFiles?: { requirement: string; urls: string[] }[];
  submissionsUID: string;
  teacherName: string;
  teacherDepartment: string;
  teacherID: string;
  disapprovedAt: Timestamp;
  disapproveReason: string;
  purpose: string;
  amount: string;
  SSGAdviserattachedReceiptURL: string;
  PTCATreasurerAttachedReceiptURL: string;
  DeanAttachedReceiptURL: string;
  qrCodeURL: string
}

function DisapprovedStatus() {
  const [studentSubmissionsData, setStudentSubmissionsData] = useState<StudentSubmissionData[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchAttempts, setFetchAttempts] = useState<number>(0);
  const [noMoreData, setNoMoreData] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedViewClearance, setSelectedViewClearance] = useState<StudentSubmissionData | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<{ [key: number]: File[] }>({});
  const [filePreviews, setFilePreviews] = useState<{ [key: number]: string[] }>({});

  const [studentGcashNumber, setStudentGcashNumber] = useState<string>('');
  const [studentAmountInput, setStudentAmountInput] = useState<string>('');
  const [ssgAdviserReciept, setSsgAdviserReciept] = useState<File | null>(null);
  const [ssgAdviserRecieptView, setSsgAdviserRecieptView] = useState<string | null>(null);

  const [deanReciept, setDeanReciept] = useState<File | null>(null);
  const [deanRecieptView, setDeanRecieptView] = useState<string | null>(null);
  const [rawAmount, setRawAmount] = useState('');



  const auth = getAuth();
  const currentUser = auth.currentUser;
  const uid = currentUser ? currentUser.uid : null;

  const MAX_ATTEMPTS = 3;

  const fetchStudentSubmissionsData = async () => {
    if (fetchAttempts >= MAX_ATTEMPTS || noMoreData) return;

    try {
      const fetchStudentSubmissionsDataSnapshot = await getDocs(collection(firestore, 'studentSubmissions'));
      const fetchedSubmissionData: StudentSubmissionData[] = [];

      fetchStudentSubmissionsDataSnapshot.forEach(doc => {
        const data = doc.data();
        fetchedSubmissionData.push({
          status: data.status as ClearanceStatus,
          submittedAt: data.submittedAt,
          teacherUID: data.teacherUID,
          scheduleDate: data.scheduleDate,
          requirementFiles: data.requirementFiles || [],
          submissionsUID: data.submissionsUID,
          studentUID: data.studentUID,
          teacherName:data.teacherName,
          teacherDepartment:data.teacherDepartment,
          teacherID:data.teacherID,
          disapprovedAt:data.disapprovedAt,
          disapproveReason:data.disapproveReason,
          purpose:data.purpose,
          amount:data.amount,
          SSGAdviserattachedReceiptURL:data.SSGAdviserattachedReceiptURL,
          qrCodeURL:data.qrCodeURL,
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
  
  const getSubmissionStatusMessage = (submittedAt: Timestamp, scheduleDate: string) => {
    const submittedDate = submittedAt.toDate();
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
    setSelectedViewClearance(null);
    setUploadedFiles({});
    setSsgAdviserReciept(null);
    setSsgAdviserRecieptView('');
    setDeanReciept(null);
    setDeanRecieptView('');
    setStudentGcashNumber('');
    setStudentAmountInput('');

  };

  const pendingSubmissions = studentSubmissionsData.filter(submission => submission.status === 'Disapproved');
  if (pendingSubmissions.length === 0 && errorMessage === null) {
    setErrorMessage('No Approved Clearance yet.');
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setUploadedFiles(prev => ({ ...prev, [index]: fileArray }));
  
      // Generate file previews
      const filePreviewsArray = fileArray.map(file => URL.createObjectURL(file));
      setFilePreviews(prev => ({ ...prev, [index]: filePreviewsArray }));
    }
  };

  const handleResubmit = async () => {
    setIsLoading(true);
    if (!selectedViewClearance || !currentUser) return;

    try {
        const updatedUrls: string[][] = [];

        // Handle uploading files in the StudentRequirementsFiles folder
        for (const [index, files] of Object.entries(uploadedFiles)) {
            const urls: string[] = [];
            const teacherUID = selectedViewClearance.teacherUID;

            for (const file of files) {
                const filePath = `StudentRequirementsFiles/${uid}/${teacherUID}/${file.name}`;
                const storageRef = ref(storage, filePath);

                await uploadBytes(storageRef, file);
                const downloadUrl = await getDownloadURL(storageRef);
                urls.push(downloadUrl);
            }
            updatedUrls[+index] = urls;
        }

        // Upload files conditionally for each department
        const adviserFile = uploadedFiles[0]?.[0]; // Assuming the adviser file is the first uploaded file
        const ptcAdviserFile = uploadedFiles[0]?.[0];
        const deanFile = uploadedFiles[0]?.[0];

        let ssgAdviserReceiptUrl = '';
        let ptcaTreasurerReceiptUrl = '';
        let deanReceiptUrl = '';

        if (adviserFile) {
            const adviserFilePath = `SSGADVISERSubmitlist/${uid}/${selectedViewClearance.teacherUID}/${adviserFile.name}`;
            const adviserStorageRef = ref(storage, adviserFilePath);

            await uploadBytes(adviserStorageRef, adviserFile);
            ssgAdviserReceiptUrl = await getDownloadURL(adviserStorageRef);
        }

        if (ptcAdviserFile) {
            const adviserFilePath = `PTCATREASURERSubmitlist/${uid}/${selectedViewClearance.teacherUID}/${ptcAdviserFile.name}`;
            const adviserStorageRef = ref(storage, adviserFilePath);

            await uploadBytes(adviserStorageRef, ptcAdviserFile);
            ptcaTreasurerReceiptUrl = await getDownloadURL(adviserStorageRef);
        }

        if (deanFile) {
            const adviserFilePath = `DEANSubmitlist/${uid}/${selectedViewClearance.teacherUID}/${deanFile.name}`;
            const adviserStorageRef = ref(storage, adviserFilePath);

            await uploadBytes(adviserStorageRef, deanFile);
            deanReceiptUrl = await getDownloadURL(adviserStorageRef);
        }

        // Initialize additionalFields based on department conditions
        const additionalFields: any = {};

        if (selectedViewClearance.teacherDepartment === 'DEAN' && deanReceiptUrl) {
            additionalFields.DeanAttachedReceiptURL = deanReceiptUrl;
        } else if (selectedViewClearance.teacherDepartment === 'PTCA TREASURER' && ptcaTreasurerReceiptUrl) {
            additionalFields.PTCATreasurerAttachedReceiptURL = ptcaTreasurerReceiptUrl;
        } else if (selectedViewClearance.teacherDepartment === 'SSG ADVISER' && ssgAdviserReceiptUrl) {
            additionalFields.SSGAdviserattachedReceiptURL = ssgAdviserReceiptUrl;
        } else {
            additionalFields.requirementFiles = selectedViewClearance.requirementFiles?.map((file, i) => ({
                ...file,
                urls: updatedUrls[i] || file.urls,
            }));
        }

        // Update Firestore document with conditionally added fields
        const docRef = doc(firestore, 'studentSubmissions', selectedViewClearance.submissionsUID);
        await updateDoc(docRef, {
            ...additionalFields,  // Spread conditional fields
            status: 'Pending',
            submittedAt: Timestamp.now(),
            studentGcashNumber,
            studentAmountInput,
        });

        // Close modal and reset file states
        closeModal();
        setUploadedFiles({});
        setFilePreviews({});
    } catch (error) {
        console.error('Error updating submission:', error);
    } finally {
        setIsLoading(false);
    }
  };


  const handleGcashNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9]/g, ''); // Keep only numbers
  
    // Limit to 11 digits
    const limitedValue = inputValue.slice(0, 11);
  
    setStudentGcashNumber(limitedValue);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove all non-digit characters
    const numericValue = inputValue.replace(/\D/g, '');

    // Format the numeric value with commas
    const formattedValue = Number(numericValue).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });

    setRawAmount(numericValue);
    setStudentAmountInput(formattedValue);
  };

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
                      <span className="font-semibold text-gray-700">Disapproved Time:</span>
                      <span className="text-gray-700 ml-2">{formatTimestamp(submissionDataInfo.disapprovedAt)}</span>
                    </div>
                    {/* <span className={`${color} font-semibold cursor-not-allowed`}>{message}</span> */}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* INSTRUCTOR SIDE */}
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
                  <label className="block text-gray-700">Disapprovement Time:</label>
                  <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.disapprovedAt ? formatTimestamp(selectedViewClearance.disapprovedAt) : ''} readOnly/>
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-700">Disapprovement Reason:</label>
                  <textarea 
                    className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" 
                    value={selectedViewClearance?.disapproveReason} 
                    readOnly 
                    rows={2}
                  />
                </div>

                {selectedViewClearance?.requirementFiles && selectedViewClearance.requirementFiles.length > 0 && (
                  <div className="space-y-1 mt-4">
                    <label className="block text-gray-700">Requirement:</label>
                    {selectedViewClearance.requirementFiles.map((file, index) => (
                      <div key={index} className="mt-2">
                        <p className="w-full p-2 border border-gray-300 rounded cursor-not-allowed">{file.requirement}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-1">
                <label className="block text-gray-700">Attach Files:</label>
                <input 
                  type="file" 
                  multiple 
                  onChange={(event) => handleFileChange(event, 0)} 
                  className="w-full p-2 border border-gray-300 rounded"
                />

                {/* Display file previews */}
                {filePreviews[0] && filePreviews[0].length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-gray-700">File Previews:</p>
                    <div className="flex flex-wrap gap-2">
                      {filePreviews[0].map((previewUrl, i) => (
                        <div key={i} className="mt-2 border border-gray-300 rounded overflow-hidden">
                          <img 
                            src={previewUrl} 
                            alt={`Preview ${i + 1}`} 
                            className="w-full p-2 border border-gray-300 rounded" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center space-x-5">
                <div className="flex justify-center space-x-5 mt-5">
                  <button type="submit" onClick={handleResubmit} className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 w-32 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z" />
                        </svg>
                        Submitt...
                      </span>
                    ) : (
                      'Re-Submit'
                    )}
                  </button>
                  <button type="button" onClick={closeModal} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-300 w-32">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SSG ADVISER */}
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
                  <label className="block text-gray-700">Disapprovement Time:</label>
                  <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.disapprovedAt ? formatTimestamp(selectedViewClearance.disapprovedAt) : ''} readOnly/>
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-700">Disapprovement Reason:</label>
                  <textarea className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" 
                    value={selectedViewClearance?.disapproveReason} 
                    readOnly 
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-700">Purpose:</label>
                  <textarea className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" 
                    value={selectedViewClearance?.purpose} 
                    readOnly 
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-700">Amount:</label>
                  <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.amount} readOnly/>
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-700">QR Code (Scan this to pay)</label>
                  {selectedViewClearance?.qrCodeURL && (
                    <img
                      src={selectedViewClearance.qrCodeURL}
                      alt="Student Reciept"
                      className="w-full p-2 border border-gray-300 rounded"
                      style={{ maxHeight: '5000px', objectFit: 'contain' }}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-left">
                    <label htmlFor="studentGcashNumber" className="block text-gray-700 mt-2">GCASH Number</label>
                    <input type="text" id="studentGcashNumber" className="w-full p-2 border border-gray-300 rounded" value={studentGcashNumber} onChange={handleGcashNumber} placeholder="Enter you GCash Number" required />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Enter Amount</label>
                  <input className="w-full p-2 border border-gray-300 rounded" onChange={handleAmountChange}
                    type="text" value={`₱ ${studentAmountInput}`} placeholder="Enter Amount here" required
                  />
                </div>

                  
                <div className="space-y-1">
                  <label className="block text-gray-700">Attach Files:</label>
                  <input 
                    type="file" 
                    multiple 
                    onChange={(event) => handleFileChange(event, 0)} 
                    className="w-full p-2 border border-gray-300 rounded"
                  />

                  {/* Display file previews */}
                  {filePreviews[0] && filePreviews[0].length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-gray-700">File Previews:</p>
                      <div className="flex flex-wrap gap-2">
                        {filePreviews[0].map((previewUrl, i) => (
                          <div key={i} className="mt-2 border border-gray-300 rounded overflow-hidden">
                            <img 
                              src={previewUrl} 
                              alt={`Preview ${i + 1}`} 
                              className="w-full p-2 border border-gray-300 rounded" 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              <div className="flex justify-center space-x-5">
                <div className="flex justify-center space-x-5 mt-5">
                  <button type="submit" onClick={handleResubmit} className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 w-32 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z" />
                        </svg>
                        Submitt...
                      </span>
                    ) : (
                      'Re-Submit'
                    )}
                  </button>
                  <button type="button" onClick={closeModal} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-300 w-32">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PTCA TREASURER */}
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
                  <label className="block text-gray-700">Disapprovement Time:</label>
                  <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.disapprovedAt ? formatTimestamp(selectedViewClearance.disapprovedAt) : ''} readOnly/>
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-700">Disapprovement Reason:</label>
                  <textarea className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" 
                    value={selectedViewClearance?.disapproveReason} 
                    readOnly 
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-700">Purpose:</label>
                  <textarea className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" 
                    value={selectedViewClearance?.purpose} 
                    readOnly 
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-700">Amount:</label>
                  <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.amount} readOnly/>
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-700">QR Code (Scan this to pay)</label>
                  {selectedViewClearance?.qrCodeURL && (
                    <img
                      src={selectedViewClearance.qrCodeURL}
                      alt="Student Reciept"
                      className="w-full p-2 border border-gray-300 rounded"
                      style={{ maxHeight: '5000px', objectFit: 'contain' }}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-left">
                    <label htmlFor="studentGcashNumber" className="block text-gray-700 mt-2">GCASH Number</label>
                    <input type="text" id="studentGcashNumber" className="w-full p-2 border border-gray-300 rounded" value={studentGcashNumber} onChange={handleGcashNumber} placeholder="Enter you GCash Number" required />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Enter Amount</label>
                  <input className="w-full p-2 border border-gray-300 rounded" onChange={handleAmountChange}
                    type="text" value={`₱ ${studentAmountInput}`} placeholder="Enter Amount here" required
                  />
                </div>

                
                <div className="space-y-1">
                  <label className="block text-gray-700">Attach Files:</label>
                  <input 
                    type="file" 
                    multiple 
                    onChange={(event) => handleFileChange(event, 0)} 
                    className="w-full p-2 border border-gray-300 rounded"
                  />

                  {/* Display file previews */}
                  {filePreviews[0] && filePreviews[0].length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-gray-700">File Previews:</p>
                      <div className="flex flex-wrap gap-2">
                        {filePreviews[0].map((previewUrl, i) => (
                          <div key={i} className="mt-2 border border-gray-300 rounded overflow-hidden">
                            <img 
                              src={previewUrl} 
                              alt={`Preview ${i + 1}`} 
                              className="w-full p-2 border border-gray-300 rounded" 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              <div className="flex justify-center space-x-5">
                <div className="flex justify-center space-x-5 mt-5">
                  <button type="submit" onClick={handleResubmit} className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 w-32 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z" />
                        </svg>
                        Submitt...
                      </span>
                    ) : (
                      'Re-Submit'
                    )}
                  </button>
                  <button type="button" onClick={closeModal} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-300 w-32">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEAN SIDE */}
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
                  <label className="block text-gray-700">Disapprovement Time:</label>
                  <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.disapprovedAt ? formatTimestamp(selectedViewClearance.disapprovedAt) : ''} readOnly/>
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-700">Disapprovement Reason:</label>
                  <textarea className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" 
                    value={selectedViewClearance?.disapproveReason} 
                    readOnly 
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-700">Purpose:</label>
                  <textarea className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" 
                    value={selectedViewClearance?.purpose} 
                    readOnly 
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-700">Amount:</label>
                  <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedViewClearance?.amount} readOnly/>
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-700">QR Code (Scan this to pay)</label>
                  {selectedViewClearance?.qrCodeURL && (
                    <img
                      src={selectedViewClearance.qrCodeURL}
                      alt="Student Reciept"
                      className="w-full p-2 border border-gray-300 rounded"
                      style={{ maxHeight: '5000px', objectFit: 'contain' }}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-left">
                    <label htmlFor="studentGcashNumber" className="block text-gray-700 mt-2">GCASH Number</label>
                    <input type="text" id="studentGcashNumber" className="w-full p-2 border border-gray-300 rounded" value={studentGcashNumber} onChange={handleGcashNumber} placeholder="Enter you GCash Number" required />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Enter Amount</label>
                  <input className="w-full p-2 border border-gray-300 rounded" onChange={handleAmountChange}
                    type="text" value={`₱ ${studentAmountInput}`} placeholder="Enter Amount here" required
                  />
                </div>

                
                <div className="space-y-1">
                  <label className="block text-gray-700">Attach Files:</label>
                  <input 
                    type="file" 
                    multiple 
                    onChange={(event) => handleFileChange(event, 0)} 
                    className="w-full p-2 border border-gray-300 rounded"
                  />

                  {/* Display file previews */}
                  {filePreviews[0] && filePreviews[0].length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-gray-700">File Previews:</p>
                      <div className="flex flex-wrap gap-2">
                        {filePreviews[0].map((previewUrl, i) => (
                          <div key={i} className="mt-2 border border-gray-300 rounded overflow-hidden">
                            <img 
                              src={previewUrl} 
                              alt={`Preview ${i + 1}`} 
                              className="w-full p-2 border border-gray-300 rounded" 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              <div className="flex justify-center space-x-5">
                <div className="flex justify-center space-x-5 mt-5">
                  <button type="submit" onClick={handleResubmit} className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 w-32 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z" />
                        </svg>
                        Submitt...
                      </span>
                    ) : (
                      'Re-Submit'
                    )}
                  </button>
                  <button type="button" onClick={closeModal} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-300 w-32">
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

export default DisapprovedStatus;