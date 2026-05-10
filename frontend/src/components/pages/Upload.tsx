import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../services/useAppStore';
import { parseExcelFile } from '../../engine/parser';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const { setStudents } = useAppStore();
  const navigate = useNavigate();

  const handleProcess = async () => {
    if (!file) return;
    try {
      const result = await parseExcelFile(file);
      setErrors(result.errors);
      if (result.students.length > 0) {
        setStudents(result.students);
        if (result.errors.length === 0) {
          navigate('/preview');
        }
      }
    } catch (err) {
      alert("Failed to parse file. Please ensure it's a valid Excel/CSV.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Upload Student Data</h1>
      <Card>
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12">
          <input type="file" accept=".xlsx, .xls, .csv" onChange={e => setFile(e.target.files?.[0] || null)} className="mb-4" />
          <p className="text-sm text-gray-500 mb-6">Supported formats: .xlsx, .xls, .csv</p>
          <Button onClick={handleProcess} disabled={!file}>Process File</Button>
        </div>
      </Card>

      {errors.length > 0 && (
        <Card title="Validation Errors" className="border-red-200">
          <ul className="text-sm text-red-600 list-disc pl-5">
            {errors.slice(0, 10).map((err, i) => (
              <li key={i}>Row {err.row}: Invalid data format</li>
            ))}
            {errors.length > 10 && <li>...and {errors.length - 10} more errors</li>}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default Upload;
