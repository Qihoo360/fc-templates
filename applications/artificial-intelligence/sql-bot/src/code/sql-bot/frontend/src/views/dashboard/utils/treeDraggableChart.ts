import { cloneDeep } from 'lodash-es'
import { dashboardApi } from '@/api/dashboard.ts'
const treeDraggableChart = (state: any, key: any, type: any) => {
  let dragNodeParentId = ''
  let dragNodeId = ''
  let dragNodeIndex = 0

  let rawData: any[] = []

  const dfsTreeNode = (arr: any, parentId: any) => {
    arr.forEach((element: any, index: any) => {
      if (element.id === dragNodeId) {
        dragNodeIndex = index
        dragNodeParentId = parentId
      }
      if (element.children?.length) {
        dfsTreeNode(element.children, element.id)
      }
    })
  }

  const dfsTreeNodeSaveLevel = (arr: any[], idArr: any) => {
    arr.forEach((element: any) => {
      const index = idArr.findIndex((ele: any) => {
        return ele === element.id
      })
      if (index !== -1) {
        idArr.splice(index, 1)
      }
      if (element.children?.length && idArr.length === 2) {
        dfsTreeNodeSaveLevel(element.children, idArr)
      }
    })
  }

  const dfsTreeNodeBack = (arr: any, parentId: any, params: any) => {
    arr.forEach((element: any) => {
      if (element.id === params.id) {
        params.pid = parentId
      }
      if (element.children?.length) {
        dfsTreeNodeBack(element.children, element.id, params)
      }
    })
  }

  const dfsTreeNodeReset = (arr: any, node: any) => {
    arr.forEach((element: any) => {
      if (element.id === dragNodeParentId) {
        element.children.splice(dragNodeIndex, 0, node)
      }
      if (element.children?.length) {
        dfsTreeNodeReset(element.children, node)
      }
    })
  }

  const dfsTreeNodeDel = (arr: any, node: any) => {
    arr.forEach((element: any, index: any) => {
      if (element.id === node.id) {
        arr.splice(index, 1)
      }
      if (element.children?.length) {
        dfsTreeNodeDel(element.children, node)
      }
    })
  }

  const handleDragStart = (node: any) => {
    dragNodeId = node.data.id
    rawData = cloneDeep(state[key])
    dfsTreeNode(state[key], '0')
  }

  const allowDrop = (dropNode: any) => {
    return !dropNode.data?.leaf
  }

  const handleDrop = async (draggingNode: any, dropNode: any, dropType: any) => {
    const params = {
      id: draggingNode.data?.id,
      name: draggingNode.data?.name,
      nodeType: draggingNode.data?.leaf ? 'leaf' : 'folder',
      pid: '0',
      opt: 'move',
      type,
    }
    if (dropType !== 'inner') {
      const idArr = [params.id, dropNode.data?.id]
      dfsTreeNodeSaveLevel(rawData, idArr)
      if (idArr.length === 0) {
        dfsTreeNodeDel(state[key], draggingNode.data)
        setTimeout(() => {
          if (dragNodeParentId === '0') {
            state[key].splice(dragNodeIndex, 0, draggingNode.data)
          } else {
            dfsTreeNodeReset(state[key], draggingNode.data)
          }
        }, 0)
        return
      }
    }

    try {
      await dashboardApi.check_name(params)
    } catch (error) {
      console.error(error)
    }
    // @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
    delete params.opt

    if (dropType === 'inner') {
      params.pid = dropNode.data?.id
    } else {
      dfsTreeNodeBack(state[key], '0', params)
    }

    dashboardApi
      .move_resource(params)
      .then(() => {
        state.originResourceTree = cloneDeep(state[key])
      })
      .catch(() => {
        if (dragNodeParentId === '0') {
          state[key].splice(dragNodeIndex, 0, draggingNode.data)
          return
        }

        dfsTreeNodeReset(state[key], draggingNode.data)
      })
  }

  return {
    handleDrop,
    allowDrop,
    handleDragStart,
  }
}

export { treeDraggableChart }
