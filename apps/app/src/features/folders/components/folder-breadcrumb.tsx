import { Fragment } from "react";
import { Link } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@vidcastx/ui/components/breadcrumb";

import type { FolderAncestor } from "../types";

interface FolderBreadcrumbProps {
  ancestors: FolderAncestor[];
  rootLabel?: string;
}

export function FolderBreadcrumb({ ancestors, rootLabel = "All folders" }: FolderBreadcrumbProps) {
  const atRoot = ancestors.length === 0;
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {atRoot ? (
            <BreadcrumbPage>{rootLabel}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link to="/dashboard/projects" className="hover:text-foreground" />}>
              {rootLabel}
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {ancestors.map((crumb, i) => {
          const isLast = i === ancestors.length - 1;
          return (
            <Fragment key={crumb.id}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={
                      <Link
                        to="/dashboard/projects/f/$folderId"
                        params={{ folderId: crumb.id }}
                        className="hover:text-foreground"
                      />
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
