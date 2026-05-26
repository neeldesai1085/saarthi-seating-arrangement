import { useEffect, useMemo } from 'react';
import { useAppStore } from '../../services/useAppStore';
import { exportPDF } from '../../pdf/generator';
import { exportInvigilatorPDF } from '../../pdf/invigilatorGenerator';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { SeatingPlan } from '../../engine/types';

/** Build a lookup: "row-col-side" → { enrollmentNo, subjectCode } */
const buildGridMap = (plan: SeatingPlan) => {
    const map = new Map<string, { enrollmentNo: string; subjectCode: string }>();
    for (const seat of plan.seats) {
        if (seat.student) {
            map.set(`${seat.row}-${seat.column}-${seat.side}`, {
                enrollmentNo: seat.student.enrollmentNo,
                subjectCode: seat.student.subjectCode,
            });
        }
    }
    return map;
};

const RoomGrid = ({ plan }: { plan: SeatingPlan }) => {
    const gridMap = useMemo(() => buildGridMap(plan), [plan]);

    let maxRow = 0, maxCol = 0;
    for (const s of plan.seats) {
        if (s.row > maxRow) maxRow = s.row;
        if (s.column > maxCol) maxCol = s.column;
    }

    if (maxRow === 0 || maxCol === 0) return <p className="text-sm text-gray-400">No seats allocated.</p>;

    return (
        <div className="overflow-x-auto">
            <table className="border-collapse text-xs w-full">
                <thead>
                    <tr>
                        <th className="border px-2 py-1 bg-gray-100 text-gray-500">Row</th>
                        {Array.from({ length: maxCol }, (_, c) => (
                            <th key={c} colSpan={2} className="border px-2 py-1 bg-gray-100 text-gray-500 text-center">
                                Bench {c + 1}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: maxRow }, (_, rIdx) => {
                        const r = rIdx + 1;
                        return (
                            <tr key={r}>
                                <td className="border px-2 py-1 bg-gray-50 text-gray-400 font-mono text-center">{r}</td>
                                {Array.from({ length: maxCol }, (_, cIdx) => {
                                    const c = cIdx + 1;
                                    const left = gridMap.get(`${r}-${c}-LEFT`);
                                    const right = gridMap.get(`${r}-${c}-RIGHT`);
                                    return (
                                        <>
                                            <td key={`${c}-L`} className={`border px-2 py-1 text-center font-mono ${
                                                left ? 'bg-blue-50 text-blue-800' : 'bg-white text-gray-300'
                                            }`} title={left?.subjectCode ?? ''}>
                                                {left?.enrollmentNo ?? ''}
                                            </td>
                                            <td key={`${c}-R`} className={`border px-2 py-1 text-center font-mono ${
                                                right ? 'bg-green-50 text-green-800' : 'bg-white text-gray-300'
                                            }`} title={right?.subjectCode ?? ''}>
                                                {right?.enrollmentNo ?? ''}
                                            </td>
                                        </>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const Preview = () => {
    const { 
        generatePlan, seatingPlans, error, isLoading,
        invigilators, invigilatorPlans, unallocatedInvigilators, generateInvigilatorPlan 
    } = useAppStore();

    useEffect(() => {
        if (seatingPlans.length === 0) {
            generatePlan();
        }
        if (invigilatorPlans.length === 0 && invigilators.length > 0) {
            generateInvigilatorPlan();
        }
    }, []);

    const handleExport = () => exportPDF(seatingPlans);
    const handleInvigilatorExport = () => exportInvigilatorPDF(invigilatorPlans);

    if (error) {
        return <div className="text-red-500 p-4 font-medium">Error: {error}</div>;
    }

    if (seatingPlans.length === 0) {
        return <div className="text-gray-500 p-4">No seating plan generated yet. Upload data first.</div>;
    }

    return (
        <div className="space-y-12">
            {/* Seating Plans Section */}
            <section className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Seating Preview</h1>
                    <Button onClick={handleExport} isLoading={isLoading}>Export Seating PDF</Button>
                </div>

                {seatingPlans.map(plan => (
                    <Card key={plan.roomId} title={plan.roomName} className="mb-6">
                        <div className="p-3 bg-gray-50 mb-3 rounded border flex gap-4 text-sm">
                            <span><strong>Seats:</strong> {plan.seats.length}</span>
                            <span><strong>Subjects:</strong> {new Set(plan.seats.map(s => s.student?.subjectCode).filter(Boolean)).size}</span>
                        </div>

                        <RoomGrid plan={plan} />

                        {plan.unallocatedStudents && plan.unallocatedStudents.length > 0 && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                Warning: {plan.unallocatedStudents.length} students could not be allocated.
                            </div>
                        )}
                    </Card>
                ))}
            </section>

            {/* Invigilators Section */}
            {invigilators.length > 0 && (
                <section className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Invigilator Assignments</h2>
                        <Button onClick={handleInvigilatorExport} isLoading={isLoading} variant="secondary">Export Invigilator PDF</Button>
                    </div>

                    {invigilatorPlans.length > 0 && invigilatorPlans[0].invigilators.length < 3 && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm font-medium">
                            Warning: There are not enough invigilators to assign at least 3 per room. The system has done its best to distribute them equally.
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {invigilatorPlans.map(plan => (
                            <Card key={plan.roomId} title={plan.roomName}>
                                {plan.invigilators.length > 0 ? (
                                    <ul className="divide-y text-sm">
                                        {plan.invigilators.map(inv => (
                                            <li key={inv.id} className="py-2">{inv.name}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-400 py-2">No invigilators assigned.</p>
                                )}
                            </Card>
                        ))}
                    </div>

                    {unallocatedInvigilators.length > 0 && (
                        <Card title="Unassigned Invigilators" className="border-red-200 bg-red-50">
                            <p className="text-sm text-red-600 mb-2">These invigilators were not assigned because all rooms have reached the maximum of 4.</p>
                            <ul className="list-disc pl-5 text-sm text-red-700">
                                {unallocatedInvigilators.map(inv => (
                                    <li key={inv.id}>{inv.name}</li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </section>
            )}
        </div>
    );
};

export default Preview;
