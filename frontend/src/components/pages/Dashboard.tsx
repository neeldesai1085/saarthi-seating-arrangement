import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../services/useAppStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Users, DoorOpen, BookOpen } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { rooms, students } = useAppStore();

  const totalSeats = rooms.reduce((acc, room) => acc + room.totalSeats, 0);
  const uniqueSubjects = new Set(students.map(s => s.subjectCode)).size;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center p-6">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
            <DoorOpen size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Rooms</p>
            <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
            <p className="text-xs text-gray-400 mt-1">Capacity: {totalSeats} seats</p>
          </div>
        </Card>

        <Card className="flex items-center p-6">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Students</p>
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          </div>
        </Card>

        <Card className="flex items-center p-6">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg mr-4">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Subjects</p>
            <p className="text-2xl font-bold text-gray-900">{uniqueSubjects}</p>
          </div>
        </Card>
      </div>

      <div className="mt-8 flex gap-4">
        <Button onClick={() => navigate('/upload')}>1. Upload Data</Button>
        <Button onClick={() => navigate('/preview')} variant="secondary">2. Generate & Preview</Button>
      </div>
    </div>
  );
};

export default Dashboard;
