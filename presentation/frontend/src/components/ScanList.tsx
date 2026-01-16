export function ScanList({
    scans,
    onSelect
}: {
    scans: any[];
    onSelect: (id: string) => void;
}) {
    return (
        <div>
        <h3>Scans</h3>
        <ul>
            {scans.map(scan => (
            <li key={scan.scan_id}>
                <button onClick={() => onSelect(scan.scan_id)}>
                {scan.scan_id.slice(0, 8)} — {scan.status}
                </button>
            </li>
            ))}
        </ul>
        </div>
    );
}
