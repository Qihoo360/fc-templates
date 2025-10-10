import SQTab from '@/views/dashboard/components/sq-tab/index.vue'
import SQText from '@/views/dashboard/components/sq-text/index.vue'
import SQView from '@/views/dashboard/components/sq-view/index.vue'
import SQEmpty from '@/views/dashboard/components/sq-empty/index.vue'

const COMPONENT_LIST = [
  {
    id: 1001,
    component: 'SQView',
    name: 'new-view',
    propValue: '&nbsp;',
    icon: 'icon_graphical',
    innerType: 'bar',
    locked: false,
    editing: false,
    x: 1,
    y: 1,
    sizeX: 36,
    sizeY: 14,
    style: {},
  },
  {
    id: 1002,
    component: 'SQTab',
    name: 'new-tabs',
    locked: false,
    collisionActive: false,
    moveInActive: false,
    moveOutActive: false,
    activeTabName: null,
    propValue: [
      {
        name: 'tab',
        title: 'new_tab',
        componentData: [],
        closable: true,
      },
    ],
    canvasActive: false,
    editing: false,
    x: 1,
    y: 1,
    sizeX: 36,
    sizeY: 14,
    style: {},
  },
  {
    id: 1003,
    component: 'SQText',
    name: 'new text',
    locked: false,
    propValue: null,
    editing: false,
    x: 1,
    y: 1,
    sizeX: 36,
    sizeY: 14,
    style: {},
  },
]

export function findNewComponentFromList(component: string) {
  return COMPONENT_LIST.find((item) => item.component === component) || null
}

export const componentsMap = {
  SQTab: SQTab,
  SQText: SQText,
  SQView: SQView,
}

export function findComponent(key = 'SQEmpty') {
  // @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
  return componentsMap[key] ? componentsMap[key] : SQEmpty
}

export default COMPONENT_LIST
