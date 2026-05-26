import { Card } from '../ui/Card';

const Help = () => {
    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Documentation & Help</h1>
                <p className="text-gray-600">A comprehensive guide on how to use the ExamSeat Automated Arrangement System.</p>
            </div>

            <Card title="1. Getting Started (How to Use)">
                <div className="space-y-4 text-sm text-gray-700">
                    <p>
                        This application fully automates exam seating arrangement while strictly ensuring that 
                        <strong> no two students taking the same exam sit on the same bench</strong>.
                    </p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li><strong>Manage Rooms:</strong> Navigate to the <em>Rooms</em> tab. Add the physical rooms available in your institution. The system automatically calculates total seats (Rows × Columns × 2 seats per bench).</li>
                        <li><strong>Prepare Student Data:</strong> Create an Excel/CSV file for students. The file <strong>must</strong> have columns named exactly <code>enrollment_no</code> and <code>subject_code</code>. Any other columns are safely ignored.</li>
                        <li><strong>Prepare Invigilator Data (Optional):</strong> Create an Excel/CSV file for invigilators. The column must be named exactly <code>invigilator_name</code>.</li>
                        <li><strong>Upload:</strong> Navigate to the <em>Upload Data</em> tab. Drop your files into their respective dropzones and click Process.</li>
                        <li><strong>Preview & Export:</strong> The <em>Seating Preview</em> tab instantly shows the generated arrangement. From here, you can directly export beautifully scaled PDFs for both seating layouts and invigilator duties.</li>
                    </ol>
                </div>
            </Card>

            <Card title="2. The Seating Allocation Algorithm (Deep Dive)">
                <div className="space-y-4 text-sm text-gray-700">
                    <p>The core engine uses a highly optimized <strong>Monte Carlo Multi-Start Hybrid Room-First Lane Allocator</strong>.</p>
                    
                    <h3 className="font-semibold text-gray-900 mt-4 mb-2">Hard Constraints:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Bench Atomicity:</strong> Two students taking the same subject can never sit on the same bench (Left and Right).</li>
                        <li><strong>Sequential Roll Order:</strong> Students within the same subject are seated in strict sequential enrollment order.</li>
                        <li><strong>Front-Loading:</strong> Rooms are filled column by column, front to back, ensuring no students are scattered far in the back if front rows are available.</li>
                    </ul>

                    <h3 className="font-semibold text-gray-900 mt-4 mb-2">How it Works:</h3>
                    <p>
                        The engine groups students by subject and sorts them sequentially. It then decides exactly how many rows each room needs to perfectly fit the students (front-loading). 
                        It iterates through every seat in a "Column-Major" fashion (Col 1 → Row 1 → Left, Right). 
                    </p>
                    <p>
                        When deciding who sits at a bench, it enforces constraints. If it is forced to pick between two subjects, it uses a random tie-breaker. If no valid subject exists that avoids matching the other side of the bench, the algorithm is forced to <strong>leave the seat empty</strong>.
                    </p>
                    
                    <h3 className="font-semibold text-gray-900 mt-4 mb-2">The Monte Carlo Optimizer:</h3>
                    <p>
                        Because the constraints are so strict, a single random pass might hit a "dead end" where a seat must be left blank. To solve this, the engine runs the entire allocation algorithm <strong>100 times</strong> silently in the background in less than 5 milliseconds. It tracks the exact number of blank spaces forced in each run, and returns only the absolute perfect layout with the highest packing density!
                    </p>
                </div>
            </Card>

            <Card title="3. The Invigilator Distribution Algorithm">
                <div className="space-y-4 text-sm text-gray-700">
                    <p>
                        The invigilator module handles assigning staff to rooms using a fair-share mathematical distribution.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Max 4, Min 3:</strong> The algorithm guarantees no room has more than 4 invigilators. It attempts to provide at least 3, but if there aren't enough uploaded, it will distribute them as best as possible and warn you.</li>
                        <li><strong>Equal Distribution:</strong> It calculates exactly how to divide staff evenly. For example, 14 invigilators across 3 rooms guarantees exactly <code>4, 4, 4</code> rather than randomly leaving one room empty. The remaining 2 are marked as unassigned.</li>
                        <li><strong>Heavy Randomization:</strong> The invigilator list is fully shuffled (Fisher-Yates) before every assignment, guaranteeing totally random staff placement every generation.</li>
                    </ul>
                </div>
            </Card>

            <Card title="4. Troubleshooting & FAQ">
                <div className="space-y-4 text-sm text-gray-700">
                    <div>
                        <strong className="text-gray-900 block mb-1">Q: My Excel file isn't parsing properly?</strong>
                        <p>A: Ensure your headers exactly match <code>enrollment_no</code> and <code>subject_code</code>. The system automatically trims accidental whitespace, but major typos will fail.</p>
                    </div>
                    <div>
                        <strong className="text-gray-900 block mb-1">Q: Why are there students left unallocated?</strong>
                        <p>A: This happens if you only have 1 subject remaining to allocate. The algorithm is mathematically forced to leave the other half of the bench empty to avoid breaking the "no same-subject bench" rule. To fix this, upload a more diverse mix of subjects to give the optimizer room to pair people up.</p>
                    </div>
                    <div>
                        <strong className="text-gray-900 block mb-1">Q: Why is the PDF font tiny?</strong>
                        <p>A: The PDF engine mathematically auto-scales the font to guarantee the longest enrollment number fits without wrapping. If it's tiny, it means your room has a massive number of columns (e.g. 15+), or a student has an unusually long enrollment string.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Help;
