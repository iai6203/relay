import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  FileCodeIcon,
  HistoryIcon,
  MessageCircleIcon,
  PlusIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";

import type { ToolPart } from "@/components/ai-elements/tool";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputHeader,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from "@/components/ai-elements/confirmation";
import { FileTree } from "@/components/ai/file-tree";
import { CodeViewer, type CodeSelection } from "@/components/ai/code-viewer";
import { SessionList } from "@/components/ai/session-list";
import { BashTool } from "@/components/ai/bash-tool";
import { EditTool } from "@/components/ai/edit-tool";
import { useFileExplorer } from "@/hooks/use-file-explorer";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { ToolCallStatus } from "@/ipc/chat/types";
import { ImageViewer } from "@/components/ai/image-viewer";
import { Badge } from "@/components/ui/badge";

function mapStatusToToolState(status: ToolCallStatus): ToolPart["state"] {
  switch (status) {
    case "running":
      return "input-available";
    case "completed":
      return "output-available";
    case "error":
      return "output-error";
    case "approval-requested":
      return "approval-requested";
    case "denied":
      return "output-denied";
  }
}

const searchSchema = z.object({
  path: z.string(),
});

function ProjectViewPage() {
  const { path } = Route.useSearch();

  const {
    tree,
    selectedFile,
    fileContent,
    imageData,
    refreshTree,
    refreshSelectedFile,
    handleSelectFile,
  } = useFileExplorer(path);

  const {
    status,
    messages,
    autoApprove,
    setAutoApprove,
    loadSession,
    resetSession,
    handlePermissionResponse,
    submit,
  } = useChat({
    path,
    onToolResult: () => {
      refreshTree();
      refreshSelectedFile();
    },
  });

  const [codeSelections, setCodeSelections] = useState<CodeSelection[]>([]);

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (!message.text.trim()) return;

      let prompt = message.text;
      if (codeSelections.length > 0) {
        const references = codeSelections
          .map((sel) => {
            const lineInfo =
              sel.startLine === sel.endLine
                ? `${sel.startLine}`
                : `${sel.startLine}-${sel.endLine}`;
            return `- @${sel.filePath}#L${lineInfo}`;
          })
          .join("\n");
        prompt = `${references}\n\n${message.text}`;
        setCodeSelections([]);
      }

      await submit(prompt);
    },
    [codeSelections, submit],
  );

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full w-full">
      {/* FileTree */}
      <ResizablePanel defaultSize={20} minSize={20} maxSize={40}>
        <div className="h-full overflow-auto">
          <FileTree
            tree={tree}
            selectedPath={selectedFile}
            onSelectFile={handleSelectFile}
          />
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* CodeViewer / ImageViewer */}
      <ResizablePanel defaultSize={60} minSize={20}>
        <div className="h-full min-h-0 overflow-hidden">
          {selectedFile && imageData ? (
            <div className="flex h-full items-center justify-center overflow-auto">
              <ImageViewer imageData={imageData} selectedFile={selectedFile} />
            </div>
          ) : selectedFile && fileContent != null ? (
            <CodeViewer
              filePath={selectedFile}
              content={fileContent}
              onSelectionChange={(selection) => {
                if (selection) {
                  setCodeSelections((prev) => [...prev, selection]);
                }
              }}
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              Select a file to view
            </div>
          )}
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* ChatUI */}
      <ResizablePanel defaultSize={20} minSize={20} maxSize={40}>
        <div className="flex h-full min-h-0 flex-col py-2 pr-4 pl-4">
          {/* Header */}
          <div className="flex justify-end gap-2 py-2">
            <Button
              variant="outline"
              size="sm"
              disabled={status !== "ready"}
              onClick={resetSession}
            >
              <PlusIcon />
              New Chat
            </Button>
            <SessionList
              path={path}
              variant="outline"
              size="sm"
              disabled={status !== "ready"}
              onSelectSession={loadSession}
            >
              <HistoryIcon />
              Sessions
            </SessionList>
          </div>

          <Conversation>
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<MessageCircleIcon className="size-8" />}
                  title="No messages yet"
                  description="Type a message below to start a conversation."
                />
              ) : (
                messages.map((msg) => (
                  <Message key={msg.id} from={msg.role}>
                    <MessageContent className="whitespace-pre-wrap">
                      {msg.role === "user" ? (
                        msg.content
                      ) : (
                        <>
                          {msg.blocks.map((block, i) => {
                            if (block.type === "text") {
                              return (
                                <MessageResponse key={i}>
                                  {block.text}
                                </MessageResponse>
                              );
                            }

                            if (block.type === "tool_call") {
                              if (block.toolName === "Bash") {
                                return (
                                  <BashTool
                                    key={block.toolUseId}
                                    toolName={block.toolName}
                                    state={mapStatusToToolState(block.status)}
                                    input={block.input}
                                    output={block.output}
                                    isError={block.isError}
                                  />
                                );
                              }

                              if (block.toolName === "Edit") {
                                const permBlock = msg.blocks.find(
                                  (b) =>
                                    b.type === "permission_request" &&
                                    b.toolUseId === block.toolUseId,
                                );

                                const permission =
                                  permBlock?.type === "permission_request"
                                    ? {
                                        requestId: permBlock.requestId,
                                        toolUseId: permBlock.toolUseId,
                                        decisionReason:
                                          permBlock.decisionReason,
                                        decision: permBlock.decision,
                                      }
                                    : undefined;

                                return (
                                  <EditTool
                                    key={block.toolUseId}
                                    toolName={block.toolName}
                                    state={mapStatusToToolState(block.status)}
                                    input={block.input}
                                    output={block.output}
                                    isError={block.isError}
                                    permission={permission}
                                    onPermissionResponse={
                                      handlePermissionResponse
                                    }
                                  />
                                );
                              }

                              return (
                                <Tool key={block.toolUseId}>
                                  <ToolHeader
                                    title={block.toolName}
                                    type="dynamic-tool"
                                    state={mapStatusToToolState(block.status)}
                                    toolName={block.toolName}
                                  />
                                  <ToolContent>
                                    <ToolInput input={block.input} />
                                    {block.output != null && (
                                      <ToolOutput
                                        output={block.output}
                                        errorText={
                                          block.isError
                                            ? block.output
                                            : undefined
                                        }
                                      />
                                    )}
                                  </ToolContent>
                                </Tool>
                              );
                            }

                            if (block.type === "permission_request") {
                              if (block.toolName === "Edit") {
                                return null;
                              }
                              const permState =
                                block.decision == null
                                  ? "approval-requested"
                                  : "approval-responded";

                              const approval =
                                block.decision == null
                                  ? { id: block.requestId }
                                  : {
                                      id: block.requestId,
                                      approved: block.decision === "allow",
                                    };

                              return (
                                <Confirmation
                                  key={block.requestId}
                                  approval={approval}
                                  state={permState as ToolPart["state"]}
                                >
                                  <ConfirmationTitle>
                                    <span className="font-semibold">
                                      {block.toolName}
                                    </span>
                                    {block.decisionReason &&
                                      ` — ${block.decisionReason}`}
                                  </ConfirmationTitle>

                                  <ConfirmationRequest>
                                    <ToolInput input={block.input} />
                                    <ConfirmationActions>
                                      <ConfirmationAction
                                        variant="outline"
                                        onClick={() =>
                                          handlePermissionResponse(
                                            block.requestId,
                                            block.toolUseId,
                                            "deny",
                                            "User denied permission",
                                          )
                                        }
                                      >
                                        Deny
                                      </ConfirmationAction>
                                      <ConfirmationAction
                                        onClick={() =>
                                          handlePermissionResponse(
                                            block.requestId,
                                            block.toolUseId,
                                            "allow",
                                          )
                                        }
                                      >
                                        Allow
                                      </ConfirmationAction>
                                    </ConfirmationActions>
                                  </ConfirmationRequest>

                                  <ConfirmationAccepted>
                                    <span className="text-green-600">
                                      Approved
                                    </span>
                                  </ConfirmationAccepted>

                                  <ConfirmationRejected>
                                    <span className="text-red-600">Denied</span>
                                  </ConfirmationRejected>
                                </Confirmation>
                              );
                            }

                            return null;
                          })}
                        </>
                      )}
                    </MessageContent>
                  </Message>
                ))
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="mx-auto w-full">
            <PromptInput onSubmit={handleSubmit}>
              {codeSelections.length > 0 && (
                <PromptInputHeader>
                  {codeSelections.map((sel, index) => (
                    <Badge
                      key={`${sel.filePath}-${sel.startLine}-${index}`}
                      variant="outline"
                    >
                      <FileCodeIcon className="text-muted-foreground size-3.5" />
                      <span className="text-foreground font-mono">
                        {sel.filePath.split("/").pop()}:
                        {sel.startLine === sel.endLine
                          ? sel.startLine
                          : `${sel.startLine}-${sel.endLine}`}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCodeSelections((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                        className="text-muted-foreground hover:text-foreground ml-1"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </PromptInputHeader>
              )}
              <PromptInputTextarea placeholder="Message" />
              <PromptInputFooter>
                <PromptInputTools>
                  <div className="flex items-center gap-1.5">
                    <Switch
                      id="auto-approve"
                      size="sm"
                      checked={autoApprove}
                      onCheckedChange={setAutoApprove}
                    />
                    <Label
                      htmlFor="auto-approve"
                      className="text-muted-foreground flex cursor-pointer items-center gap-1 text-xs"
                    >
                      <ShieldCheckIcon className="size-3.5" />
                      Auto-approve
                    </Label>
                  </div>
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger />
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                </PromptInputTools>
                <PromptInputSubmit status={status} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export const Route = createFileRoute("/projects/view")({
  validateSearch: searchSchema,
  component: ProjectViewPage,
});
