from typing import List, Optional, Dict, TypeVar, Protocol, Any
from pydantic import BaseModel


class ITreeNode(Protocol):
    id: Optional[str]
    pid: Optional[str]
    children: List['ITreeNode']

T = TypeVar('T', bound=ITreeNode)

def build_tree_generic(nodes: List[T], root_pid: Any = None) -> List[T]:
    node_dict: Dict[str, T] = {node.id: node for node in nodes if node.id is not None}
    tree: List[T] = []

    for node in nodes:
        if node.pid == root_pid:
            tree.append(node)
        elif node.pid in node_dict:
            node_dict[node.pid].children.append(node)

    return tree