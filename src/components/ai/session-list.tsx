import { type ComponentProps, useEffect, useState } from "react";
import { Trash } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
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
          <ScrollArea className="max-h-80">
            <Table>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow
                    key={session.sessionId}
                    className="w-full cursor-pointer"
                    onClick={() => {
                      onSelectSession?.(session.sessionId);
                      setOpen(false);
                    }}
                  >
                    <TableCell className="flex w-full justify-between">
                      <div className="w-72 truncate text-xs">
                        {session.firstMessage ?? "-"}
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent size="sm">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              세션을 삭제하시겠습니까?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              삭제된 세션은 복구할 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              취소
                            </AlertDialogCancel>
                            <AlertDialogAction
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                ipc.client.ai
                                  .deleteSession({
                                    path,
                                    sessionId: session.sessionId,
                                  })
                                  .then(() => {
                                    setSessions((prev) =>
                                      prev.filter(
                                        (s) =>
                                          s.sessionId !== session.sessionId,
                                      ),
                                    );
                                  });
                              }}
                            >
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
