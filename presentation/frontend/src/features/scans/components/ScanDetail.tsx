import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export function ScanDetail({ scan }: { scan: any }) {
  if (!scan) {
    return (
      <Card className="flex-1">
        <CardContent className="py-10 text-center text-muted-foreground">
          Select a scan to view details
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Scan Detail
          <Badge variant={scan.status === "completed" ? "default" : "secondary"}>
            {scan.status}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-sm">
          <p><span className="font-medium">ID:</span> {scan.scan_id}</p>
          <p><span className="font-medium">Confidence:</span> {scan.confidence ?? "N/A"}</p>
        </div>

        <div>
          <h4 className="mb-1 font-semibold">Logs</h4>
          <ScrollArea className="h-40 rounded-md border bg-muted p-2">
            <pre className="text-xs">
              {JSON.stringify(scan.logs ?? [], null, 2)}
            </pre>
          </ScrollArea>
        </div>

        <div>
          <h4 className="mb-1 font-semibold">Results</h4>
          <ScrollArea className="h-40 rounded-md border bg-muted p-2">
            <pre className="text-xs">
              {JSON.stringify(scan.results ?? {}, null, 2)}
            </pre>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
