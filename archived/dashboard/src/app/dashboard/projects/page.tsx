import { VideoList } from "@dashboard/features/videos";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-2xl font-bold capitalize">projects</h1>
      <VideoList />
    </div>
  );
}
