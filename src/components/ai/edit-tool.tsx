import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DiffList, type Line } from "@/components/ui/github-inline-diff";
import { cn } from "@/utils/tailwind";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  PencilIcon,
  XCircleIcon,
} from "lucide-react";
import { useMemo } from "react";

type ToolState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-error"
  | "output-denied";

export type EditToolPermission = {
  requestId: string;
  toolUseId: string;
  decisionReason?: string;
  decision?: "allow" | "deny";
};

export type EditToolProps = {
  toolName: string;
  state: ToolState;
  input: Record<string, unknown>;
  output?: string | null;
  isError?: boolean;
  className?: string;
  permission?: EditToolPermission;
  onPermissionResponse?: (
    requestId: string,
    toolUseId: string,
    decision: "allow" | "deny",
    message?: string,
  ) => void;
};

const statusConfig: Record<
  ToolState,
  { label: string; icon: React.ReactNode }
> = {
  "input-streaming": {
    label: "Pending",
    icon: <ClockIcon className="size-3.5" />,
  },
  "input-available": {
    label: "Running",
    icon: <ClockIcon className="size-3.5 animate-pulse" />,
  },
  "approval-requested": {
    label: "Awaiting Approval",
    icon: <ClockIcon className="size-3.5 text-yellow-600" />,
  },
  "approval-responded": {
    label: "Responded",
    icon: <CheckCircleIcon className="size-3.5 text-blue-600" />,
  },
  "output-available": {
    label: "Completed",
    icon: <CheckCircleIcon className="size-3.5 text-green-600" />,
  },
  "output-error": {
    label: "Error",
    icon: <XCircleIcon className="size-3.5 text-red-600" />,
  },
  "output-denied": {
    label: "Denied",
    icon: <XCircleIcon className="size-3.5 text-orange-600" />,
  },
};

function buildDiffLines(oldStr: string, newStr: string): Line[] {
  const oldLines = oldStr.split("\n");
  const newLines = newStr.split("\n");
  const lines: Line[] = [];

  lines.push({
    kind: "hunk",
    content: `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
  });

  for (let i = 0; i < oldLines.length; i++) {
    lines.push({ kind: "del", old: i + 1, new: null, content: oldLines[i] });
  }

  for (let i = 0; i < newLines.length; i++) {
    lines.push({ kind: "add", old: null, new: i + 1, content: newLines[i] });
  }

  return lines;
}

export function EditTool({
  toolName,
  state,
  input,
  output,
  isError,
  className,
  permission,
  onPermissionResponse,
}: EditToolProps) {
  const { label, icon } = statusConfig[state];

  const filePath =
    typeof input.file_path === "string" ? input.file_path : "unknown";
  const oldString =
    typeof input.old_string === "string" ? input.old_string : "";
  const newString =
    typeof input.new_string === "string" ? input.new_string : "";

  const fileName = filePath.split("/").pop() ?? filePath;

  const diff = useMemo(
    () => buildDiffLines(oldString, newString),
    [oldString, newString],
  );

  const hasOutput = output != null;
  const isAwaitingApproval = state === "approval-requested" && permission;
  const isApproved = permission?.decision === "allow";
  const isDenied = permission?.decision === "deny";

  return (
    <div className={cn("not-prose mb-4 w-full rounded-md border", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b p-3">
        <PencilIcon className="text-muted-foreground size-4" />
        <span className="text-sm font-medium">{toolName}</span>
        <Badge className="gap-1 rounded-full text-xs" variant="secondary">
          {icon}
          {label}
        </Badge>
      </div>

      {/* File path */}
      <div className="bg-muted/30 border-b p-3">
        <code className="text-muted-foreground text-xs">{filePath}</code>
      </div>

      {/* Diff view */}
      <div className="overflow-auto">
        <DiffList diff={diff} fileName={fileName} />
      </div>

      {/* Permission: awaiting approval */}
      {isAwaitingApproval && (
        <div className="border-t p-3">
          {permission.decisionReason && (
            <p className="text-muted-foreground mb-2 text-xs">
              {permission.decisionReason}
            </p>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-sm"
              onClick={() =>
                onPermissionResponse?.(
                  permission.requestId,
                  permission.toolUseId,
                  "deny",
                  "User denied permission",
                )
              }
            >
              Deny
            </Button>
            <Button
              size="sm"
              className="h-8 px-3 text-sm"
              onClick={() =>
                onPermissionResponse?.(
                  permission.requestId,
                  permission.toolUseId,
                  "allow",
                )
              }
            >
              Allow
            </Button>
          </div>
        </div>
      )}

      {/* Permission: resolved */}
      {(isApproved || isDenied) && (
        <div className="border-t p-3">
          <span
            className={cn(
              "text-sm font-medium",
              isApproved && "text-green-600",
              isDenied && "text-red-600",
            )}
          >
            {isApproved ? "Approved" : "Denied"}
          </span>
        </div>
      )}

      {/* Output */}
      {hasOutput && (
        <Collapsible>
          <CollapsibleTrigger className="group hover:bg-muted/50 flex w-full items-center justify-between border-t px-3 py-2">
            <span
              className={cn(
                "text-xs font-medium",
                isError ? "text-red-600" : "text-muted-foreground",
              )}
            >
              {isError ? "Error" : "Result"}
            </span>
            <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div
              className={cn(
                "max-h-80 overflow-auto border-t",
                isError ? "bg-destructive/10" : "bg-muted/20",
              )}
            >
              <pre className="p-3 text-xs break-all whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
