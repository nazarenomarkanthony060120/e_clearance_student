'use client'

const StudentInformation = () => {
  // Static student information
  const studentInfo = {
    studentID: '12345678',
    fullName: 'Bryan James C. Libante',
    email: 'test@gmail.com',
    department: 'COTE',
    course: 'BSED',
    year: '2nd Year',
    semester: '1st'
  };

  return (
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md border">
        <h1 className="text-3xl font-bold text-orange-600 mb-6 text-center">Student Information</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              <span className="font-semibold text-gray-700 w-32">Student ID:</span>
              <span className="text-gray-600">{studentInfo.studentID}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold text-gray-700 w-32">Full Name:</span>
              <span className="text-gray-600">{studentInfo.fullName}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold text-gray-700 w-32">Course:</span>
              <span className="text-gray-600">{studentInfo.course}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold text-gray-700 w-32">Semester:</span>
              <span className="text-gray-600">{studentInfo.semester}</span>
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              <span className="font-semibold text-gray-700 w-32">Email:</span>
              <span className="text-gray-600">{studentInfo.email}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold text-gray-700 w-32">Department:</span>
              <span className="text-gray-600">{studentInfo.department}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold text-gray-700 w-32">Year:</span>
              <span className="text-gray-600">{studentInfo.year}</span>
            </div>
          </div>
        </div>
      </div>
  );
};

export default StudentInformation;
