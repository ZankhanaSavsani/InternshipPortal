import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { PlusCircle, FileText, Clipboard } from 'lucide-react';

const AddWeeklyReportPage = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="h-screen from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card 
        className="w-full max-w-md shadow-2xl transition-all duration-300 border-2 border-blue-200 hover:border-blue-400"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-8 text-center">
          <p className="mb-6 text-gray-600 text-lg">
            Capture your weekly progress and insights
          </p>
          <Button 
            onClick={() => navigate('/student/WeeklyReportForm')}
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200 py-3 text-base flex items-center justify-center gap-2 group"
          >
            <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Create New Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddWeeklyReportPage;