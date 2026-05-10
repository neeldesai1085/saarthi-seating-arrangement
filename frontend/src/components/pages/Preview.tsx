import { useEffect } from 'react';
import { useAppStore } from '../../services/useAppStore';
import { exportPDF } from '../../pdf/generator';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const Preview = () => {
  const { generatePlan, seatingPlans, error, isLoading } = useAppStore();

  useEffect(() => {
    if (seatingPlans.length === 0) {
      generatePlan();
    }
  }, []);

  const handleExport = () => {
    exportPDF(seatingPlans);
  };

  if (error) {
    return <div className="text-red-500 p-4 font-medium">Error: {error}</div>;
  }

  if (seatingPlans.length === 0) {
    return <div className="text-gray-500 p-4">No seating plan generated yet. Upload data first.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Seating Preview</h1>
        <Button onClick={handleExport} isLoading={isLoading}>Export PDF</Button>
      </div>

      {seatingPlans.map(plan => (
        <Card key={plan.roomId} title={plan.roomName} className="mb-6">
          <div className="p-4 bg-gray-50 mb-4 rounded border">
            <p className="text-sm font-medium">Allocated Seats: {plan.seats.length}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Location</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Side</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Enrollment No</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Subject</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {plan.seats.map((seat, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">R{seat.row} C{seat.column}</td>
                    <td className="px-4 py-2">{seat.side}</td>
                    <td className="px-4 py-2 font-mono">{seat.student?.enrollmentNo || '-'}</td>
                    <td className="px-4 py-2">{seat.student?.subjectCode || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {plan.unallocatedStudents && plan.unallocatedStudents.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              Warning: {plan.unallocatedStudents.length} students could not be allocated due to insufficient capacity.
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default Preview;
