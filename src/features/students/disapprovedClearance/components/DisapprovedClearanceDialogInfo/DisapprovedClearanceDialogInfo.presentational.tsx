import { Clearance, ClearanceData, fetchDisapprovedClearancesData } from "@/api/student_disapproved_clearance/api"
import { useState, useEffect } from "react"
import { DisapprovedClearanceModalPresentation } from "../DisapprovedClearanceModal.presentation.tsx/DisapprovedClearanceModalPresentation"

export const DisapprovedClearanceDialogInfoPresentational = ({ docId, fetched, setClearanceFetch }: Clearance) => {
    const [isModalVisible, setModalVisible] = useState(false)
    const [clearanceData, setClearanceData] = useState<ClearanceData | null>(null)

    const handleViewClick = async () => {
        try {
            const clearance = await fetchDisapprovedClearancesData(docId)
            if (clearance) {
                setClearanceData(clearance)
                setModalVisible(true)
                setClearanceFetch(true)
            }
        } catch (error) {
            console.error('Error fetching disapproved clearance data:', error)
            setClearanceFetch(false)  
        }
    }

    return (
        <>
        
            <button className="text-blue-600 hover:underline font-semibold" onClick={handleViewClick}>
                View
            </button>
            {
                isModalVisible && clearanceData && <DisapprovedClearanceModalPresentation clearanceData={clearanceData} fetched={fetched} onClose={() => setModalVisible(false)}/> 
            }
        </>
    )
}
