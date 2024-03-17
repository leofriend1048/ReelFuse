import React from 'react';
import { DatePicker } from './datepicker';
import AdNameBuilderComponent from './adnamebuilder';

interface AdNameBuilderProps {
  selectedDate?: Date; // Make sure to mark it as optional if it can be undefined
}

const AdNameBuilder: React.FC<AdNameBuilderProps> = ({ selectedDate }) => {
  // Your component logic here
  return (
    <div>
      {/* Your component JSX here */}
    </div>
  );
};

export default AdNameBuilder;
