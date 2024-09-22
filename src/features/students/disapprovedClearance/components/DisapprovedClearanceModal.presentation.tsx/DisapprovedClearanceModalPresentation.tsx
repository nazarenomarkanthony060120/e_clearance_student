import { Clearance, ClearanceData, updateClearance } from "@/api/student_disapproved_clearance/api"
import { useState } from "react"
import { toast } from "react-toastify"

interface ModalProps {
    clearanceData: ClearanceData
    onClose: () => void
    fetched: Boolean
}

const sx = {
    width: '100%',      
    padding: '0.5rem',    
    border: '1px solid #D1D5DB', 
    borderRadius: '0.25rem', 
}

export const DisapprovedClearanceModalPresentation = ({ clearanceData, onClose, fetched }: ModalProps) => {
    const { clearanceId, creatorId, disapproveReason, gcashNumber, receiptURL, amount, status, studentID, studentName, userId } = clearanceData

    const [editableStudentID, setEditableStudentID] = useState(studentID)
    const [editableStudentName, setEditableStudentName] = useState(studentName)
    const [editableGCashNumber, setEditableGCashNumber] = useState(gcashNumber)
    const [editableAmount, setEditableAmount] =  useState(amount)
    const [editableDisapproveReason, setEditableDisapproveReason] = useState(disapproveReason)
    const [receiptPreview, setReceiptPreview] = useState<string | null>(receiptURL)
    const [receipt, setReceipt] = useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false) 

    const handleReceiptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0]
            setReceipt(file)
            setReceiptPreview(URL.createObjectURL(file))
        }
    }

    const handleCloseModal = () => {
        onClose() 
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
          const updatedData: Partial<ClearanceData> = {
            studentID: editableStudentID,
            studentName: editableStudentName,
            gcashNumber: editableGCashNumber,
            amount: editableAmount,
          }
      
          await updateClearance(clearanceId, updatedData, receipt || undefined) 
      
          toast.success('Clearance data updated successfully', {
            theme: 'colored',
          })
      
          onClose() 
        } catch (error) {
          toast.error('Error updating clearance data', {
            theme: 'colored',
          })
          console.error('Error updating clearance data:', error)
        } finally {
          setIsSubmitting(false)
          fetched = !fetched
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-[25rem] max-h-[80%] overflow-y-auto relative">
                <h2 className="text-2xl mb-6 text-center font-semibold">Clearance Status</h2>
                <div className="space-y-2">
                    <div className="space-y-1">
                        <label className="block text-gray-700">Student ID</label>
                        <input
                            style={sx}
                            type="text"
                            value={editableStudentID}
                            onChange={(e) => setEditableStudentID(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-gray-700">Student Name</label>
                        <input
                            style={sx}
                            type="text"
                            value={editableStudentName}
                            onChange={(e) => setEditableStudentName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-gray-700">Amount</label>
                        <input
                            style={sx}
                            type="number"
                            value={`₱ ${editableAmount.toLocaleString()}`}
                            onChange={(e) => setEditableAmount(parseInt(e.target.value))}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-gray-700">GCASH Number</label>
                        <input
                            style={sx}
                            type="text"
                            value={editableGCashNumber}
                            onChange={(e) => setEditableGCashNumber(e.target.value)}
                        />
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
                    
                    {disapproveReason && (
                        <div className="space-y-1">
                            <label className="block text-gray-700">Disapproved Message</label>
                            <textarea
                                className="h-32 resize-none overflow-y-auto"
                                style={sx}
                                value={editableDisapproveReason}
                                onChange={(e) => setEditableDisapproveReason(e.target.value)}
                                readOnly
                            /> 
                        </div>
                    )}

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
        </div>
    )
}