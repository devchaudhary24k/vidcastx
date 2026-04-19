import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Clock, Eye, FileVideo, Globe } from "lucide-react";

import { Badge } from "@vidcastx/ui/components/badge";
import { Button } from "@vidcastx/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@vidcastx/ui/components/card";
import { Separator } from "@vidcastx/ui/components/separator";

export const Route = createFileRoute("/_protected/dashboard/videos/$videoId")({
  component: VideoPage,
});

function VideoPage() {
  const { videoId } = Route.useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" render={<Link to="/dashboard/projects" />}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <span className="text-muted-foreground font-mono text-xs">{videoId}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="bg-muted relative aspect-video w-full overflow-hidden">
            <div className="from-muted to-muted-foreground/10 absolute inset-0 flex items-center justify-center bg-gradient-to-br">
              <FileVideo className="text-muted-foreground h-12 w-12" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Untitled Video</h1>
            <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="secondary">ready</Badge>
              <span className="inline-flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Public
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Uploaded just now
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                0:00
              </span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">No description provided.</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <Metric label="Views" value="0" />
              <Metric label="Watch time" value="0h" />
              <Metric label="Avg. duration" value="0:00" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Status" value="ready" />
              <Separator />
              <Row label="Visibility" value="Public" />
              <Separator />
              <Row label="Resolution" value="—" />
              <Separator />
              <Row label="Aspect ratio" value="—" />
              <Separator />
              <Row label="Duration" value="—" />
              <Separator />
              <Row label="Created" value="—" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline">
                <Eye className="h-4 w-4" />
                View public page
              </Button>
              <Button variant="outline">Edit metadata</Button>
              <Button variant="outline">Download source</Button>
              <Button variant="destructive">Move to trash</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-muted-foreground text-xs tracking-wider uppercase">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
