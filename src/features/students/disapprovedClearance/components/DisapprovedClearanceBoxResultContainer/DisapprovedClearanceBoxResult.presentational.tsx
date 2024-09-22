import { Props } from "@/api/student_disapproved_clearance/api";
import { DisapprovedClearanceDialogInfoPresentational } from "../DisapprovedClearanceDialogInfo/DisapprovedClearanceDialogInfo.presentational";
  
const DisapprovedClearanceBoxResultPresentation = ({ data, fetched }: Props) => {
    return (
        <>
            {
                // setClearanceFetch ? 
                data.map((clearance, index) => (
                    clearance.status == 'Disapproved' && 
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
                                <DisapprovedClearanceDialogInfoPresentational docId={clearance.docId} fetched={fetched} />
                            </div>
                        </div>
                    </div>
                )) 
                // : 
                // <div className='text-center text-red-500 font-bold'>
                //     <p>No clearance to has been disapproved</p>
                // </div>
            }
        </>
            
      );
}

export default DisapprovedClearanceBoxResultPresentation;
