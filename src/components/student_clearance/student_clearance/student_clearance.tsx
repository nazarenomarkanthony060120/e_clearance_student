'use client'

import React, { useState } from 'react';

type ClearanceStatus = 'Approved' | 'Disapproved' | 'None' | 'Pending';

interface Requirement {
  text: string;
  attachments: File[];
}

interface Clearance {
  instructorID: string;
  fullName: string;
  department: string;
  course: string;
  requirements: Requirement[];
  signature: string;
  disapprovalReason: string;
  status: ClearanceStatus;
}

function StudentClearanceView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClearance, setSelectedClearance] = useState<Clearance | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [clearances, setClearances] = useState<Clearance[]>([
    {
      instructorID: '87654321',
      fullName: 'Angelica Duhaybansa',
      department: 'COE',
      course: 'BSCE',
      requirements: [
        { text: 'Submit your notes in math', attachments: [] },
        { text: 'Submit your notes', attachments: [] }
      ],
      signature: 'poncesj',
      disapprovalReason: 'Wrong Attachment',
      status: 'Disapproved' as ClearanceStatus
    },
    {
      instructorID: '87654322',
      fullName: 'James C. Rapooo',
      department: 'COTE',
      course: 'BSCE',
      requirements: [
        { text: 'Submit your notes in Algorithm', attachments: [] },
        { text: 'Submit your code in fetching name', attachments: [] }
      ],
      signature: 'rapoooo',
      disapprovalReason: 'Wrong Attachment',
      status: 'None' as ClearanceStatus
    },
    {
      instructorID: '87654322123',
      fullName: 'Bryan C. Libante',
      department: 'COTE',
      course: 'BSIT',
      requirements: [
        { text: 'Submit your notes in TVL notebook', attachments: [] },
        { text: 'Submit your notes in Software Eng.', attachments: [] }
      ],
      signature: 'libante',
      disapprovalReason: 'Wrong Attachment',
      status: 'Approved' as ClearanceStatus
    },
    {
      instructorID: '87654322133',
      fullName: 'Marvie B. Ijurpe',
      department: 'COTE',
      course: 'BSCE',
      requirements: [
        { text: 'Submit your notes in PPE', attachments: [] },
        { text: 'Submit your notebook', attachments: [] }
      ],
      signature: 'Ijurpe',
      disapprovalReason: 'Wrong Attachment',
      status: 'Pending' as ClearanceStatus
    }
  ]);

  const clearanceStatus = {
    approvedStatus: 'Approved' as ClearanceStatus,
    disapprovedStatus: 'Disapproved' as ClearanceStatus,
    noneStatus: 'None' as ClearanceStatus,
    pendingStatus: 'Pending' as ClearanceStatus
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, requirementIndex: number) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClearance) return;

    const updatedRequirements = [...selectedClearance.requirements];
    updatedRequirements[requirementIndex].attachments.push(file);

    setSelectedClearance(prev => prev ? { ...prev, requirements: updatedRequirements } : null);
  };

  const clickModal = (clearance: Clearance) => {
    setSelectedClearance(clearance);
    setIsModalOpen(true);
    setErrorMessage(null);
    setSubmissionMessage(null);
  };

  const allAttachmentsProvided = (): boolean => {
    if (!selectedClearance) return false;
    return selectedClearance.requirements.every(requirement => requirement.attachments.length > 0);
  };

  const handleSubmit = () => {
    if (!allAttachmentsProvided()) {
      setErrorMessage('All attachments are required before submitting.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      console.log('Submitting clearance...');

      if (selectedClearance) {
        setClearances(prevClearances =>
          prevClearances.map(clearance =>
            clearance.instructorID === selectedClearance.instructorID
              ? { ...clearance, status: clearanceStatus.pendingStatus, requirements: selectedClearance.requirements }
              : clearance
          )
        );

        setSelectedClearance(prev => prev ? { ...prev, status: clearanceStatus.pendingStatus } : null);
        console.log('Status updated to Pending:', selectedClearance);
      }

      setSubmissionMessage('Submitted successfully.');
      setErrorMessage(null);
      setIsLoading(false);

      setIsModalOpen(false);
    }, 3000); 
  };

  const handleReSubmit = () => {
    if (selectedClearance) {
      setClearances(prevClearances =>
        prevClearances.map(clearance =>
          clearance.instructorID === selectedClearance.instructorID
            ? { ...clearance, status: clearanceStatus.pendingStatus }
            : clearance
        )
      );

      setSelectedClearance(prev => prev ? { ...prev, status: clearanceStatus.pendingStatus } : null);
      setSubmissionMessage('Re-submitted successfully.');
      setErrorMessage(null);
      setIsModalOpen(false);
    }
  };

  const renderAttachments = (attachments: File[]) => {
    return attachments.map((attachment, index) => (
      <div key={index} className="mt-2">
        <img 
          src={URL.createObjectURL(attachment)} 
          alt={`Attachment ${index + 1}`} 
          className="max-w-full h-auto cursor-pointer rounded-md shadow-sm" 
          onClick={() => window.open(URL.createObjectURL(attachment), '_blank')}
        />
      </div>
    ));
  };

  const renderModalButtons = () => {
    if (!selectedClearance) return null;

    const { status } = selectedClearance;

    return (
      <div className="flex justify-center space-x-4 mt-4">
        <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Close</button>
        {status === clearanceStatus.noneStatus && (
          <button
            onClick={handleSubmit}
            className={`px-6 py-2 ${allAttachmentsProvided() ? 'bg-green-600' : 'bg-gray-400'} text-white rounded-lg ${allAttachmentsProvided() ? 'hover:bg-green-700' : 'cursor-not-allowed'} transition`}
            disabled={!allAttachmentsProvided() || isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mr-3 inline-block" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'Submit'
            )}
          </button>
        )}
        {status === clearanceStatus.disapprovedStatus && (
          <button
            onClick={handleSubmit}
            className={`px-10 py-2 ${allAttachmentsProvided() ? 'bg-green-500' : 'bg-gray-400'} text-white rounded ${allAttachmentsProvided() ? 'hover:bg-green-700' : 'cursor-not-allowed'}`}
            disabled={!allAttachmentsProvided() || isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'Re-submit'
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-gray-800">
      <section className="px-8 py-12">
        <div className="container mx-auto text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600">Student Clearance</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clearances.map((clearance, index) => (
            <div key={index} className="relative bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Status:</h2>
                <p className={`text-lg font-medium ${getStatusColor(clearance.status)}`}>{clearance.status}</p>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-700">Instructor Name:</span>
                    <span className="ml-2 text-gray-600">{clearance.fullName}</span>
                  </div>
                  <button onClick={() => clickModal(clearance)} className="text-blue-600 hover:underline font-semibold">View</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      {isModalOpen && selectedClearance && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-[32rem] max-h-[80%] overflow-y-auto">
            <h2 className="text-2xl mb-6 text-center font-semibold">Clearance Information</h2>
            <div className="mb-6">
              <p className="text-lg font-medium"><strong>Instructor Name:</strong> {selectedClearance.fullName}</p>
              <p className="text-lg font-medium"><strong>Department:</strong> {selectedClearance.department}</p>
              <p className="text-lg font-medium"><strong>Course:</strong> {selectedClearance.course}</p>
              {selectedClearance.status === clearanceStatus.approvedStatus && (
                <p className="text-lg font-medium"><strong>Signature:</strong> {selectedClearance.signature}</p>
              )}
            </div>
            {selectedClearance.status !== clearanceStatus.approvedStatus && selectedClearance.requirements.map((requirement, index) => (
              <div key={index} className="mb-6">
                <p className="text-lg font-medium"><strong>Requirement {index + 1}:</strong> {requirement.text}</p>
                {selectedClearance.status === clearanceStatus.disapprovedStatus && (
                  <p className="text-red-500 text-sm">Disapproval Reason: {selectedClearance.disapprovalReason}</p>
                )}
                {renderAttachments(requirement.attachments)}
                {selectedClearance.status !== clearanceStatus.pendingStatus && (
                  <input 
                    type="file" 
                    id={`attachment-${index}`} 
                    name={`attachment-${index}`} 
                    className="mt-2 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition"
                    onChange={(e) => handleFileChange(e, index)}
                  />
                )}
              </div>
            ))}
            {renderModalButtons()}
            {errorMessage && <p className="text-red-500 text-center mt-4">{errorMessage}</p>}
            {submissionMessage && <p className="text-green-500 text-center mt-4">{submissionMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentClearanceView;
