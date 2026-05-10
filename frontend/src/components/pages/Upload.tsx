import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../services/useAppStore';
import { parseExcelFile } from '../../engine/parser';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const { setStudents } = useAppStore();
  const navigate = useNavigate();

  const handleProcess = async () => {
    if (!file) {
      alert("Please choose a file first by clicking the upload area.");
      return;
    }
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
        <div className="relative group flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50 rounded-xl p-12 transition-all cursor-pointer">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={e => setFile(e.target.files?.[0] || null)} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
          
          {file ? (
            <div className="flex flex-col items-center text-primary-600">
              <FileSpreadsheet className="w-16 h-16 mb-4" />
              <p className="text-lg font-semibold">{file.name}</p>
              <p className="text-sm text-primary-400 mt-1">Click or drag here to change file</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500 group-hover:text-primary-500">
              <UploadCloud className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-1">Click to select a file</p>
              <p className="text-sm">or drag and drop your Excel/CSV here</p>
            </div>
          )}
        </div>
        
        <div className="mt-8 flex justify-center">
          <Button onClick={handleProcess} size="lg" className="w-full md:w-auto px-12" disabled={!file}>
            Process File
          </Button>
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
