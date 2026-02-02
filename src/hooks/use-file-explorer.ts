import { useCallback, useEffect, useRef, useState } from "react";

import type { TreeItem } from "@/components/ai/file-tree";
import {
  getMediaType,
  type ImageData,
  isImageFile,
} from "@/components/ai/image-viewer";
import { ipc } from "@/ipc/manager";

export function useFileExplorer(path: string) {
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>();
  const [fileContent, setFileContent] = useState<string>();
  const [imageData, setImageData] = useState<ImageData>();

  const selectedFileRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    selectedFileRef.current = selectedFile;
  }, [selectedFile]);

  const refreshTree = useCallback(async () => {
    try {
      const newTree = await ipc.client.fs.getFileTree({ path });
      setTree(newTree);
    } catch (error) {
      console.error(error);
    }
  }, [path]);

  const refreshSelectedFile = useCallback(async () => {
    const current = selectedFileRef.current;
    if (!current) return;
    try {
      const content = await ipc.client.fs.readFile({
        filePath: `${path}/${current}`,
      });
      setFileContent(content);
    } catch (error) {
      console.error(error);
      setFileContent(undefined);
    }
  }, [path]);

  useEffect(() => {
    ipc.client.fs.getFileTree({ path }).then(setTree).catch(console.error);
  }, [path]);

  const handleSelectFile = useCallback(
    async (relativePath: string) => {
      setSelectedFile(relativePath);
      setFileContent(undefined);
      setImageData(undefined);

      const filePath = `${path}/${relativePath}`;

      try {
        if (isImageFile(relativePath)) {
          const base64 = await ipc.client.fs.readFileAsBase64({ filePath });
          setImageData({
            base64,
            mediaType: getMediaType(relativePath),
          });
        } else {
          const content = await ipc.client.fs.readFile({ filePath });
          setFileContent(content);
        }
      } catch (error) {
        console.error(error);
      }
    },
    [path],
  );

  return {
    tree,
    selectedFile,
    fileContent,
    imageData,
    refreshTree,
    refreshSelectedFile,
    handleSelectFile,
  };
}
