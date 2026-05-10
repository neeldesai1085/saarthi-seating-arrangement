import { useState } from 'react';
import { useAppStore } from '../../services/useAppStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const Rooms = () => {
  const { rooms, addRoom, removeRoom, isLoading } = useAppStore();
  const [formData, setFormData] = useState({ roomName: '', rows: 5, columns: 4, benchCapacity: 2 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRoom(formData);
    setFormData({ roomName: '', rows: 5, columns: 4, benchCapacity: 2 });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
      
      <Card title="Add New Room">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
            <input required type="text" className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 p-2 border" 
                   value={formData.roomName} onChange={e => setFormData({...formData, roomName: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rows</label>
            <input required type="number" min="1" className="w-full border-gray-300 rounded-md shadow-sm p-2 border" 
                   value={formData.rows} onChange={e => setFormData({...formData, rows: Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
            <input required type="number" min="1" className="w-full border-gray-300 rounded-md shadow-sm p-2 border" 
                   value={formData.columns} onChange={e => setFormData({...formData, columns: Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity/Bench</label>
            <select className="w-full border-gray-300 rounded-md shadow-sm p-2 border" 
                    value={formData.benchCapacity} onChange={e => setFormData({...formData, benchCapacity: Number(e.target.value)})}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
          <Button type="submit" isLoading={isLoading}>Add Room</Button>
        </form>
      </Card>

      <Card title="Existing Rooms">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Seats</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rooms.map(room => (
                <tr key={room.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.roomName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.rows} rows × {room.columns} cols ({room.benchCapacity}/bench)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.totalSeats}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => removeRoom(room.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No rooms configured.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Rooms;
