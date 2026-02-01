import {
  FileTree as FileTreeRoot,
  FileTreeFile,
  FileTreeFolder,
  type FileTreeProps as FileTreeRootProps,
} from "@/components/ai-elements/file-tree";

export interface TreeItem {
  name: string;
  children?: TreeItem[];
}

interface FileTreeProps {
  tree: TreeItem[];
  selectedPath?: string;
  onSelectFile?: (relativePath: string) => void;
}

export function FileTree({ tree, selectedPath, onSelectFile }: FileTreeProps) {
  return (
    <FileTreeRoot
      selectedPath={selectedPath}
      className="h-full border-none"
      onSelect={onSelectFile as FileTreeRootProps["onSelect"]}
    >
      {tree.map((item) => (
        <TreeNode key={item.name} item={item} parentPath="" />
      ))}
    </FileTreeRoot>
  );
}

function TreeNode({
  item,
  parentPath,
}: {
  item: TreeItem;
  parentPath: string;
}) {
  const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;

  if (!item.children) {
    return <FileTreeFile path={currentPath} name={item.name} />;
  }

  return (
    <FileTreeFolder path={currentPath} name={item.name}>
      {item.children.map((child) => (
        <TreeNode key={child.name} item={child} parentPath={currentPath} />
      ))}
    </FileTreeFolder>
  );
}
