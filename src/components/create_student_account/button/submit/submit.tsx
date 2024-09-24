import React from 'react';

interface SubmitButtonProps {
  loading: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ loading }) => {
  return (
    <button
      type="submit"
      className="bg-green-700 hover:bg-green-500 w-full rounded-md p-2 text-white"
      
      disabled={loading}
    >
      {loading ? 'Creating...' : 'Create Account'}
    </button>
  );
};

export default SubmitButton;
