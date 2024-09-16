import React from 'react';
import DisapprovedClearanceBoxResultPresentation from '../DisapprovedClearanceBoxResultContainer/DisapprovedClearanceBoxResult.presentational';
import { Props } from '@/api/student_disapproved_clearance/api';

const DisapprovedClearancePresentational: React.FC<Props> = ({ data, fetched }) => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 text-gray-800">
      <section className="container mx-auto px-4 mt-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 ml-8">
          {data && <DisapprovedClearanceBoxResultPresentation data={data} fetched={fetched} />}
        </div>
      </section>
    </div>
  );
};

export default DisapprovedClearancePresentational;
