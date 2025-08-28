// Project directory component types
export interface ProjectItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'document' | 'canvas';
  children?: ProjectItem[];
  parentId?: string;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectDirectoryProps {
  items: ProjectItem[];
  onItemSelect: (item: ProjectItem) => void;
  onItemCreate: (type: 'folder' | 'file', parentId?: string) => void;
  onItemDelete: (itemId: string) => void;
  onItemRename: (itemId: string, newName: string) => void;
}
