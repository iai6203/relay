import { type ComponentProps, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { ipc } from "@/ipc/manager";

interface Session {
  sessionId: string;
  firstMessage: string | null;
}

type SessionListProps = ComponentProps<typeof Button> & {
  path: string;
  onSelectSession?: (sessionId: string) => void;
};

export function SessionList({
  path,
  onSelectSession,
  ...buttonProps
}: SessionListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    ipc.client.ai
      .getSessions({ path })
      .then(setSessions)
      .catch(() => setSessions([]));
  }, [open, path]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button {...buttonProps} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sessions</DialogTitle>
        </DialogHeader>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-xs">No sessions found.</p>
        ) : (
          <Table>
            <TableBody>
              {sessions.map((session) => (
                <TableRow
                  key={session.sessionId}
                  className="cursor-pointer"
                  onClick={() => {
                    onSelectSession?.(session.sessionId);
                    setOpen(false);
                  }}
                >
                  <TableCell className="max-w-0 truncate text-xs">
                    {session.firstMessage ?? "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
