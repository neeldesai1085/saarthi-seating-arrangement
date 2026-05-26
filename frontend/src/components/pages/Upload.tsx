import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../services/useAppStore';
import { parseExcelFile, parseInvigilatorFile } from '../../engine/parser';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';

const Upload = () => {
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [invigilatorFile, setInvigilatorFile] = useState<File | null>(null);
  const [studentErrors, setStudentErrors] = useState<any[]>([]);
  const [invigilatorErrors, setInvigilatorErrors] = useState<any[]>([]);
  
  const { setStudents, setInvigilators } = useAppStore();
  const navigate = useNavigate();

  const handleProcess = async () => {
    if (!studentFile && !invigilatorFile) {
      alert("Please choose at least one file to process.");
      return;
    }
    try {
      let sSuccess = false;
      let iSuccess = false;

      if (studentFile) {
          const result = await parseExcelFile(studentFile);
          setStudentErrors(result.errors);
          if (result.students.length > 0) {
            setStudents(result.students);
            if (result.errors.length === 0) sSuccess = true;
          }
      } else {
          sSuccess = true;
      }

      if (invigilatorFile) {
          const result = await parseInvigilatorFile(invigilatorFile);
          setInvigilatorErrors(result.errors);
          if (result.invigilators.length > 0) {
            setInvigilators(result.invigilators);
            if (result.errors.length === 0) iSuccess = true;
          }
      } else {
          iSuccess = true;
      }

      if ((studentFile && sSuccess) || (invigilatorFile && iSuccess)) {
          navigate('/preview');
      }
    } catch (err) {
      alert("Failed to parse file. Please ensure it's a valid Excel/CSV.");
    }
  };

  const FileDropzone = ({ file, setFile, title }: { file: File | null, setFile: (f: File | null) => void, title: string }) => (
      <div className="relative group flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50 rounded-xl p-8 transition-all cursor-pointer">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={e => setFile(e.target.files?.[0] || null)} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
          {file ? (
            <div className="flex flex-col items-center text-primary-600">
              <FileSpreadsheet className="w-12 h-12 mb-3" />
              <p className="text-md font-semibold">{file.name}</p>
              <p className="text-xs text-primary-400 mt-1">Click or drag here to change file</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500 group-hover:text-primary-500">
              <UploadCloud className="w-12 h-12 mb-3" />
              <p className="text-md font-medium text-gray-900 mb-1">{title}</p>
              <p className="text-xs">Excel/CSV</p>
            </div>
          )}
      </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Upload Data</h1>
      
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">1. Student Data</h3>
                <FileDropzone file={studentFile} setFile={setStudentFile} title="Upload Students" />
            </div>
            <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">2. Invigilator Data (Optional)</h3>
                <FileDropzone file={invigilatorFile} setFile={setInvigilatorFile} title="Upload Invigilators" />
            </div>
        </div>
        
        <div className="mt-8 flex justify-center">
          <Button onClick={handleProcess} size="lg" className="w-full md:w-auto px-12" disabled={!studentFile && !invigilatorFile}>
            Process Files
          </Button>
        </div>
      </Card>

      {studentErrors.length > 0 && (
        <Card title="Student Validation Errors" className="border-red-200">
          <ul className="text-sm text-red-600 list-disc pl-5">
            {studentErrors.slice(0, 10).map((err, i) => (
              <li key={i}>Row {err.row}: Invalid data format</li>
            ))}
            {studentErrors.length > 10 && <li>...and {studentErrors.length - 10} more errors</li>}
          </ul>
        </Card>
      )}

      {invigilatorErrors.length > 0 && (
        <Card title="Invigilator Validation Errors" className="border-red-200">
          <ul className="text-sm text-red-600 list-disc pl-5">
            {invigilatorErrors.slice(0, 10).map((err, i) => (
              <li key={i}>Row {err.row}: Invalid data format</li>
            ))}
            {invigilatorErrors.length > 10 && <li>...and {invigilatorErrors.length - 10} more errors</li>}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default Upload;
