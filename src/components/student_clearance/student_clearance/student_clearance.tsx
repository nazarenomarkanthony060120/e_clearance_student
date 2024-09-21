'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, addDoc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore, storage } from '@/lib/firebase'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

type ClearanceStatus = 'Approved' | 'Disapproved' | 'None' | 'Pending';

interface Clearance {
  docId: string; // Document ID from the clearances collection
  role: string;
  fullName: string;
  amount: number;
  purpose: string;
  status: ClearanceStatus;
  qrCodeURL?: string; // Add this field
  isSubmitted?: boolean; // Track if the clearance has been submitted
  signature: string
}

function StudentClearanceView() {
  const [clearances, setClearances] = useState<Clearance[]>([]);
  const [selectedClearance, setSelectedClearance] = useState<Clearance | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentID, setStudentID] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [idError, setIdError] = useState('');

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

  const formatStudentID = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Add a hyphen after the first 6 digits only
    const formatted = digits.length > 6 ? `${digits.slice(0, 6)}-${digits.slice(6)}` : digits;
    return formatted;
  };

  const handleStudentIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatStudentID(e.target.value);
    setStudentID(formattedValue);
  };

  const capitalizeFullName = (name: string) => {
    return name.replace(/\b\w/g, char => char.toUpperCase());
  };

  useEffect(() => {
    const fetchClearances = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'clearances'));
        const fetchedClearances: Clearance[] = [];
       
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!data.isSubmitted) {  // Filter out submitted clearances
            fetchedClearances.push({
              docId: doc.id,
              role: data.role,
              fullName: data.roleName,
              amount: data.amount,
              purpose: data.purpose,
              status: 'None',
              qrCodeURL: data.qrCodeURL, // Fetch the QR code URL
              isSubmitted: data.isSubmitted,
              signature: data.signature
            });
          }
        });

        setClearances(fetchedClearances);
      } catch (error) {
        console.error('Error fetching clearances:', error);
      }
    };

    const fetchUserDetails = async () => {
      try {
        const auth = getAuth();
        const uid = auth.currentUser?.uid;
        if (uid) {
          const userDocRef = doc(firestore, 'users', uid); // Create a document reference
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setStudentName(userData?.fullName || ''); // Default to an empty string if fullName is undefined
            setStudentID(userData?.studentID || '');   // Default to an empty string if studentID is undefined
          }
        } else {
          console.error('No user is currently signed in.');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchClearances();
    fetchUserDetails();
  }, []);

  const handleViewClick = (clearance: Clearance) => {
    setSelectedClearance(clearance);
  };

  const handleCloseModal = () => {
    setSelectedClearance(null);
    setReceipt(null);
    setReceiptPreview(null);
    setNameError('');
    setIdError('');
  };

  const handleReceiptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setReceipt(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || !receipt || !studentName || !studentID || !gcashNumber) return;
  
    setIsSubmitting(true);
    setNameError('');
    setIdError('');
  
    try {
      // Fetch the registered user details
      const auth = getAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) {
        console.error('No user is currently signed in.');
        return;
      }
  
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      const userData = userDoc.data();
  
      // Validate student name and ID
      if (studentName !== userData?.fullName) {
        setNameError('Student Name does not match');
        setIsSubmitting(false);
        return;
      }
      if (studentID !== userData?.studentID) {
        setIdError('Incorrect Student ID');
        setIsSubmitting(false);
        return;
      }
  
      // Upload receipt image
      const receiptRef = ref(storage, `Student Receipts/${Date.now()}_${receipt.name}`);
      await uploadBytes(receiptRef, receipt);
      const receiptURL = await getDownloadURL(receiptRef);
  
      // Fetch the clearance document to get creatorId
      if (!selectedClearance) {
        console.error('No clearance selected.');
        return;
      }
      
      const clearanceDoc = await getDoc(doc(firestore, 'clearances', selectedClearance.docId));
      const clearanceData = clearanceDoc.data();
      
      // Add data to Firestore
      await addDoc(collection(firestore, 'studentSubmissions'), {
        studentName,
        studentID,
        gcashNumber,
        receiptURL,
        status: 'Pending',
        clearanceId: selectedClearance.docId, // Use the docId to link the submission
        userId: uid, // Store the current user's UID
        signature: selectedClearance.signature,
        creatorId: clearanceData?.userId, // Fetch and store the creatorId from the clearance document
      });
  
      // Update the specific clearance document to mark it as submitted
      const clearanceDocRef = doc(firestore, 'clearances', selectedClearance?.docId!);
      await updateDoc(clearanceDocRef, {
        isSubmitted: true,
      });
  
      // Remove the submitted clearance from the display using docId
      setClearances((prevClearances) =>
        prevClearances.filter((clearance) => clearance.docId !== selectedClearance?.docId)
      );
  
      alert('Submission successful!');
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 text-gray-800">
      <section className="container mx-auto px-4 mt-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 ml-8">
          {clearances.map((clearance, index) => (
            <div key={index} className="relative bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">{clearance.role}</h2>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-600">{clearance.fullName}</span>
                  </div>
                  <button 
                    onClick={() => handleViewClick(clearance)} className="text-blue-600 hover:underline font-semibold">View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedClearance && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-[25rem] max-h-[80%] overflow-y-auto relative">
            <h2 className="text-2xl mb-6 text-center font-semibold">Submit Clearance</h2>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="block text-gray-700">Role</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedClearance.role} readOnly/>
              </div>

              <div className="space-y-1">
                <label className="block text-gray-700">Full Name</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedClearance.fullName} readOnly/>
              </div>

              <div className="space-y-2">
                <label className="block text-gray-700">Amount</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={`₱ ${selectedClearance.amount.toLocaleString()}`} readOnly/>
              </div>

              <div className="space-y-2">
                <label className="block text-gray-700">Purpose</label>
                <input className="w-full p-2 border border-gray-300 rounded cursor-not-allowed" type="text" value={selectedClearance.purpose} readOnly/>
              </div>
      
              {selectedClearance.qrCodeURL && (
                 <div className="space-y-1">
                 <span className="block text-gray-700">QR Code:</span>
                 <img  src={selectedClearance.qrCodeURL} alt="QR Code" className="w-full p-2 border border-gray-300 rounded" />
               </div>
              )}

              <div className="space-y-2">
                <div className="text-left">
                  <h1 className="text-red-400 text-center mt-10">**STUDENT SUBMIT FORM**</h1>
                  <label htmlFor="studentName" className="block text-gray-700 font-medium mt-5">Student Name</label>
                  <input type="text" id="studentName" className={`w-full p-2 border ${nameError ? 'border-red-500' : 'border-gray-300'} rounded`} value={studentName} onChange={(e) => setStudentName(capitalizeFullName(e.target.value))} placeholder="Enter your Full Name" />
                  {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-left">
                  <label htmlFor="studentID" className="block text-gray-700 font-medium">Student ID</label>
                  <input type="text" id="studentID" className={`w-full p-2 border ${idError ? 'border-red-500' : 'border-gray-300'} rounded`} value={studentID} onChange={handleStudentIDChange} placeholder="Enter your Student ID" />
                  {idError && <p className="text-red-500 text-sm mt-1">{idError}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-left">
                  <label htmlFor="gcashNumber" className="block text-gray-700 font-medium">GCash Number</label>
                  <input type="text" id="gcashNumber" className="w-full p-2 border border-gray-300 rounded" maxLength={11} value={gcashNumber} onChange={(e) => setGcashNumber(e.target.value)} placeholder="Enter your Gcash Number"/>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="receipt" className="block text-gray-700 font-medium">Upload Receipt</label>
                <input type="file" id="receipt" className="w-full p-2 border border-gray-300 rounded" onChange={handleReceiptChange} />
                {receiptPreview && (
                  <div className="mt-4">
                    <img src={receiptPreview} alt="Receipt Preview" className="max-w-full h-auto rounded" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center space-x-7">
                <button onClick={handleSubmit} disabled={isSubmitting}
                  className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 mt-7 w-32 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
                <button onClick={handleCloseModal} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-300 mt-7 w-32">Close</button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentClearanceView;
