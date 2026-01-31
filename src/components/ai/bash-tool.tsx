import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/utils/tailwind";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  TerminalIcon,
  XCircleIcon,
} from "lucide-react";
type ToolState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-error"
  | "output-denied";

export type BashToolProps = {
  toolName: string;
  state: ToolState;
  input: Record<string, unknown>;
  output?: string | null;
  isError?: boolean;
  className?: string;
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

export function BashTool({
  toolName,
  state,
  input,
  output,
  isError,
  className,
}: BashToolProps) {
  const { label, icon } = statusConfig[state];
  const command =
    typeof input.command === "string" ? input.command : JSON.stringify(input);
  const hasOutput = output != null;

  return (
    <div className={cn("not-prose mb-4 w-full rounded-md border", className)}>
      {/* Header - 항상 보임 */}
      <div className="flex items-center gap-2 border-b p-3">
        <TerminalIcon className="text-muted-foreground size-4" />
        <span className="text-sm font-medium">{toolName}</span>
        <Badge className="gap-1 rounded-full text-xs" variant="secondary">
          {icon}
          {label}
        </Badge>
      </div>

      {/* Command Input - 항상 보임 */}
      <div className="bg-muted/30 p-3">
        <code className="text-sm break-all">{command}</code>
      </div>

      {/* Output - 접었다 폈다 */}
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
