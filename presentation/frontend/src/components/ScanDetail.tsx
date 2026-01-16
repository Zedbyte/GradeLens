export function ScanDetail({ scan }: { scan: any }) {
    if (!scan) return <div>Select a scan</div>;

    return (
        <div>
        <h3>Scan Detail</h3>

        <p><b>ID:</b> {scan.scan_id}</p>
        <p><b>Status:</b> {scan.status}</p>
        <p><b>Confidence:</b> {scan.confidence ?? "N/A"}</p>

        <h4>Logs</h4>
        <pre>{JSON.stringify(scan.logs ?? [], null, 2)}</pre>

        <h4>Results</h4>
        <pre>{JSON.stringify(scan.results ?? {}, null, 2)}</pre>
        </div>
    );
}
