export interface SQTreeNode {
  id: string | number
  pid: string | number
  name: string
  leaf?: boolean
  weight: number
  type: string
  node_type: string
  children?: SQTreeNode[]
}

export interface SQTreeRequest {
  treeFlag?: string
  leaf?: boolean
  weight?: number
  sortType?: string
  resourceTable?: string
}
