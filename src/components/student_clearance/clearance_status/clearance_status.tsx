  'use client';

  import React, { useState } from 'react';
  import { collection, getDocs, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { firestore, storage } from '@/lib/firebase';
  import { getAuth } from 'firebase/auth';

  type ClearanceStatus = 'Approved' | 'Disapproved' | 'None' | 'Pending';

  interface Clearance {
    id: string;
    teacherName: string;
    teacherDepartment: string;
    selectedDepartment: string;
    selectedCourse: string;
    selectedLevel: string;
    scheduleDate: string;
    requirements: string[];
    teacherUID: string;
    ClearanceUID: string;
  }

  function StudentClearanceView() {
    const [clearances, setClearances] = useState<Clearance[]>([]);
    const [userDepartment, setUserDepartment] = useState<string | null>(null);
    const [userCourse, setUserCourse] = useState<string | null>(null);
    const [userLevel, setUserLevel] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [errorCondition, setErrorCondition] = useState<string | null>(null);

    const [fetchAttempts, setFetchAttempts] = useState(0);
    const [noMoreData, setNoMoreData] = useState<boolean>(false);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [selectedClearance, setSelectedClearance] = useState<Clearance | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [studentName, setStudentName] = useState<string>('');
    const [studentID, setStudentID] = useState<string>('');

    const [studentNameInput, setStudentNameInput] = useState<string>('');
    const [studentIDInput, setStudentIDInput] = useState<string>('');

    const [uploadedFiles, setUploadedFiles] = useState<{ [key: number]: File[] }>({});
    const [filePreviews, setFilePreviews] = useState<{ [key: number]: string[] }>({});

    const handleStudentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const regex = /^[A-Za-z\s]*$/;
      if (regex.test(inputValue)) {
        const capitalizedValue = inputValue
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          setStudentNameInput(capitalizedValue);
      }
    };

    const handleStudentIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/[^0-9]/g, '');
      let formattedValue = inputValue;
      if (inputValue.length > 6) {
        formattedValue = `${inputValue.slice(0, 6)}-${inputValue.slice(6, 10000)}`;
      }

      setStudentIDInput(formattedValue);
    };
    

    const MAX_ATTEMPTS = 3; // Limit of fetching attempts

    const auth = getAuth();
    const user = auth.currentUser;
    const uid = user ? user.uid : null;

    const fetchUserData = async (uid: string) => {
      if (!uid) {
        setError("User is not logged in.");
        return;
      }

      try {
        const userSnapshot = await getDocs(collection(firestore, 'users'));
        const userDoc = userSnapshot.docs.find(doc => doc.id === uid);
        console.log("Fetching user data for UID:", uid);
        
        if (userDoc) {
          const { studentID, fullName, selectedDepartment, selectedCourse, selectedLevel } = userDoc.data();
          setStudentName(fullName);
          setStudentID(studentID);
          setUserDepartment(selectedDepartment);
          setUserCourse(selectedCourse);
          setUserLevel(selectedLevel);

          fetchClearances(selectedDepartment, selectedCourse, selectedLevel); 
        } else {
          setError('User not found.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Error fetching user data. Please try again later.');
      }
    };

    const fetchClearances = async (selectedDepartment: string, selectedCourse: string, selectedLevel: string) => {
      if (fetchAttempts >= MAX_ATTEMPTS || noMoreData) return;

      try {
        const clearancesSnapshot = await getDocs(collection(firestore, 'clearances'));
        const clearancesList = clearancesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Clearance[];

        if (clearancesList.length > 0) {
          // Filter clearances by user's department and course
          const filteredClearances = clearancesList.filter(clearance =>
            clearance.selectedDepartment === selectedDepartment && 
            clearance.selectedCourse === selectedCourse &&
            clearance.selectedLevel === selectedLevel
          );

          setClearances(filteredClearances);
          setError(null);
          setNoMoreData(true);
        } else {
          setFetchAttempts(prev => prev + 1);
          if (fetchAttempts < MAX_ATTEMPTS) {
            fetchClearances(selectedDepartment, selectedCourse, selectedLevel);
          } else {
            setError('No available clearance yet.');
          }
        }
      } catch (error) {
        console.error('Error fetching clearances:', error);
        setFetchAttempts(prev => prev + 1);
        if (fetchAttempts < MAX_ATTEMPTS) {
          fetchClearances(selectedDepartment, selectedCourse, selectedLevel);
        } else {
          setError('Error fetching data. Please try again later.');
        }
      }
    };

    // Fetch user data immediately on component initialization
    if (uid && studentName === '') {
      fetchUserData(uid);
    }

    const clearanceStatus = {
      approvedStatus: 'Approved' as ClearanceStatus,
      disapprovedStatus: 'Disapproved' as ClearanceStatus,
      noneStatus: 'None' as ClearanceStatus,
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

    const openModal = (clearance: Clearance) => {
      setSelectedClearance(clearance);
      setModalVisible(true);
    };

    const closeModal = () => {
      setModalVisible(false);
      setSelectedClearance(null);
      setUploadedFiles({});
      setError(null);
      setErrorCondition(null);
      setFilePreviews({});
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { 
      e.preventDefault();
      setIsLoading(true); 
      setError(null);
      setErrorCondition(null);
  
      try {
          if (!selectedClearance) {
              setError("No clearance selected.");
              setIsLoading(false);
              return;
          }
  
          // Check if the inputted student name matches the stored student name
          if (studentNameInput !== studentName || studentIDInput !== studentID) {
              setErrorCondition("Student Name or Student ID doesn't exist.");
              setIsLoading(false);
              return;
          }
  
          // Prepare to store receipt URLs along with the corresponding requirement names
          const requirementFiles: { requirement: string, urls: string[] }[] = [];
  
          // Check if there are uploaded files
          const hasUploadedFiles = Object.keys(uploadedFiles).length > 0;
  
          // If there are no uploaded files, save "No" in requirementFiles
          if (!hasUploadedFiles) {
              requirementFiles.push({ requirement: "No", urls: [] });
          } else {
              // If there are uploaded files, process each requirement
              for (const [index, files] of Object.entries(uploadedFiles)) {
                  const requirementName = selectedClearance.requirements[Number(index)] || "No";
                  const uploadedURLs: string[] = [];
  
                  for (const file of files) {
                      const receiptRef = ref(storage, `StudentRequirementsFiles/${Date.now()}_${file.name}`);
                      await uploadBytes(receiptRef, file);
                      const receiptURL = await getDownloadURL(receiptRef);
                      uploadedURLs.push(receiptURL);
                  }
  
                  requirementFiles.push({ requirement: requirementName, urls: uploadedURLs });
              }
          }
  
          console.log('Requirement files before submission:', requirementFiles);
  
          const teacherUID = selectedClearance?.teacherUID;
          const ClearanceUID  = selectedClearance?.ClearanceUID;
  
          const submissionsDocs = await addDoc(collection(firestore, 'studentSubmissions'), {
              studentName,
              studentID,
              userDepartment,
              userCourse,
              userLevel,
              status: 'Pending',
              studentUID: uid,
              teacherUID,
              ClearanceUID,
              submittedAt: serverTimestamp(),
              requirementFiles,
          });

          await setDoc(submissionsDocs, { submissionsUID: submissionsDocs.id }, { merge: true });
  
          console.log('Uploaded files and requirements submitted:', requirementFiles);
          closeModal();
      } catch (error) {
          console.error("Error during submission:", error);
          setError("Error during submission. Please try again.");
      } finally {
          setIsLoading(false);
      }
    };
  
    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const files = Array.from(e.target.files || []);
      setUploadedFiles(prevState => ({ ...prevState, [index]: files }));

      // Generate file previews
      const filePreviews = files.map(file => URL.createObjectURL(file));
      setFilePreviews(prevState => ({ ...prevState, [index]: filePreviews }));
    };

    return (
      <div className="min-h-screen flex flex-col items-center bg-gray-100 text-gray-800">
        <section className="container mx-auto px-4 mt-10">
          {error && (
            <div className="flex justify-center items-center">
              <div className='text-center text-red-500 italic'>
                <p>{error}</p>
              </div>
            </div>
          )}  
          {clearances.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 ml-8">
              {clearances.map((clearance) => (
                <div key={clearance.id} className="relative bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                  <span className="font-semibold text-gray-700 text-xl">Status:</span>                    
                    <span className={`ml-2 ${getStatusColor(clearanceStatus.noneStatus)} text-xl`}>
                      {clearanceStatus.noneStatus}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700">{clearance.teacherDepartment} NAME :</span>
                        <span className="text-gray-700 ml-2">{clearance.teacherName}</span>
                      </div>
                      <button
                        className="text-blue-600 hover:underline font-semibold"
                        onClick={() => openModal(clearance)}
                      >
                        View
                      </button>
                    </div>
                    <div className="mt-2">
                      <span className="font-semibold text-gray-700">Due Date:</span>
                      <span className="text-gray-700 ml-2">{clearance.scheduleDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !error && (
              <div className="flex justify-center items-center">
                <div className='text-center text-red-500 italic'>
                  <p>No clearance to view yet</p>
                </div>
              </div>
            )
          )}
        </section>

        {/* Modal */}
        {modalVisible && selectedClearance && selectedClearance.teacherDepartment === 'INSTRUCTOR' && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-[25rem] max-h-[80%] overflow-y-auto relative">
              <h2 className="text-2xl mb-6 text-center font-semibold">Submit Clearance</h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="block text-gray-700">Role</label>
                    <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedClearance.teacherDepartment} readOnly/>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-gray-700">Name</label>
                    <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedClearance.teacherName} readOnly/>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-gray-700">Clearance Deadline</label>
                    <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedClearance.scheduleDate} readOnly/>
                  </div>

                  <div className="space-y-2">
                    <div className="text-left">
                      <h1 className="text-red-400 text-center mt-10">**STUDENT SUBMIT FORM**</h1>
                      <label htmlFor="studentName" className="block text-gray-700 font-medium mt-5">Student Name</label>
                      <input type="text" id="studentName" className="w-full p-2 border border-gray-300 rounded" value={studentNameInput} onChange={handleStudentNameChange} placeholder="Enter your Full Name" required/>
                      {errorCondition && (
                        <p className="text-red-500 text-sm mt-1">{errorCondition}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-left">
                      <label htmlFor="studentID" className="block text-gray-700 font-medium mt-2">Student ID</label>
                        <input type="text" id="studentID" className="w-full p-2 border border-gray-300 rounded" value={studentIDInput} onChange={handleStudentIDChange} placeholder="Enter your Student ID" required />
                        {errorCondition && (
                          <p className="text-red-500 text-sm mt-1">{errorCondition}</p>
                        )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-left">
                      <label className="block text-red-400 italic mt-8">REQUIREMENTS:</label>
                      
                      {/* Null check for selectedClearance */}
                      {selectedClearance ? (
                        (!selectedClearance.requirements || selectedClearance.requirements.length === 0 || selectedClearance.requirements.includes("No")) ? (
                          <div className="text-center text-green-500 italic">
                            <p className="mt-5">No requirements are required.</p>
                          </div>
                        ) : (
                          selectedClearance.requirements.map((requirement, index) => (
                            <div key={index} className="flex flex-col mb-4">
                              <label className="font-semibold text-gray-600">{requirement || 'No'}:</label>
                              <input 
                                type="file" 
                                onChange={(e) => handleFilesChange(e, index)} 
                                className="mt-1 mb-2 border border-gray-300 rounded-md p-2"
                                multiple 
                                required
                              />
                              {filePreviews[index] && filePreviews[index].map((preview, idx) => (
                                <div key={idx} className="mt-4">
                                  <img src={preview} alt={`Preview ${idx}`} className="max-w-full h-auto rounded" />
                                </div>
                              ))}
                            </div>
                          ))
                        )
                      ) : (
                        <div>Loading...</div> // Handle the null case, e.g., show a loading message
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center space-x-5">
                    <div className="flex justify-center space-x-5 mt-5">
                      <button type="submit" className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 w-32 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                          'Submit'
                        )}
                      </button>
                      <button type="button" onClick={closeModal} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-300 w-32">
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  export default StudentClearanceView;
