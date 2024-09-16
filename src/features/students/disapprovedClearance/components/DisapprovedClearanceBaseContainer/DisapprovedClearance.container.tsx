'use client';

import React, { useEffect, useState } from 'react';
import DisapprovedClearancePresentational from './DisapprovedClearance.presentational';
import { ClearanceStatus, CreatedClearance, fetchDisapprovedClearances } from '@/api/student_disapproved_clearance/api';

const DisapprovedClearanceContainer: React.FC = () => {
  const [disapprovedClearances, setDisapprovedClearances] = useState<CreatedClearance[]>([]);
  const [fetched, setFetched] = useState(false)
  useEffect(() => {
    const fetchClearances = async () => {
      if (fetched) return

      try {
        const clearances: CreatedClearance[] = await fetchDisapprovedClearances();
        setDisapprovedClearances(clearances);
        setFetched(!fetched)
      } catch (error) {
        console.error('Error fetching disapproved clearances:', error);
      }
    };

    fetchClearances();
  }, []);

  return <DisapprovedClearancePresentational data={disapprovedClearances} fetched={fetched} />;
};

export default DisapprovedClearanceContainer;
