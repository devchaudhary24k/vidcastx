import { Fragment, useMemo } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@vidcastx/ui/components/breadcrumb";

import type { Folder } from "../types/folder";

type Crumb = { id: string | null; name: string };

type FolderBreadcrumbProps = {
  folders: Folder[];
  currentFolderId: string | null;
  onNavigate: (folderId: string | null) => void;
  rootLabel?: string;
};

function buildCrumbs(folders: Folder[], currentId: string | null, rootLabel: string): Crumb[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const trail: Crumb[] = [];
  let cursor: string | null = currentId;
  while (cursor) {
    const folder = byId.get(cursor);
    if (!folder) break;
    trail.unshift({ id: folder.id, name: folder.name });
    cursor = folder.parentId;
  }
  return [{ id: null, name: rootLabel }, ...trail];
}

export function FolderBreadcrumb({
  folders,
  currentFolderId,
  onNavigate,
  rootLabel = "All folders",
}: FolderBreadcrumbProps) {
  const crumbs = useMemo(() => buildCrumbs(folders, currentFolderId, rootLabel), [folders, currentFolderId, rootLabel]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <Fragment key={crumb.id ?? "root"}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={
                      <button type="button" onClick={() => onNavigate(crumb.id)} className="hover:text-foreground" />
                    }
                  >
                    {crumb.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
