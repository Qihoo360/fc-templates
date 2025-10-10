<template>
  <el-tabs :class="['de-tabs', ...tabClassName]" :style="tabStyle" v-bind="$attrs">
    <slot></slot>
  </el-tabs>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  hideTitle: Boolean,
  /*Color can be a word, such as red; It can also be a color value*/
  //Font color
  fontColor: { type: String, default: '' },
  // Activate font color
  activeColor: { type: String, default: '' },
  //If the border color is none, there will be no border.
  // If it is none, the activated slide line of the Card type will also disappear
  borderColor: { type: String, default: '' },
  //Activate border color currently only for card types
  borderActiveColor: { type: String, default: '' },
  //The style type radioGroup is only valid for Card type,
  // and it must be given as borderColor borderActiveColor
  styleType: {
    type: String,
    default: '',
    validator: (val: string) => ['', 'radioGroup'].includes(val),
  },
})

const tabStyle = computed(() => [
  { '--de-font-color': props.fontColor },
  { '--de-active-color': props.activeColor },
  { '--de-border-color': props.borderColor },
  { '--de-border-active-color': props.borderActiveColor },
])
const tabClassName = computed(() =>
  props.styleType
    ? [props.styleType, props.fontColor && 'fontColor', props.activeColor && 'activeColor']
    : [
        props.fontColor && 'fontColor',
        props.activeColor && 'activeColor',
        noBorder.value ? 'noBorder' : props.borderColor && 'borderColor',
        props.borderActiveColor && 'borderActiveColor',
        props.hideTitle && 'no-header',
      ]
)

const noBorder = computed(() => props.borderColor === 'none')
</script>

<style lang="less">
.de-tabs {
  height: 100%;

  &.no-header {
    .ed-tabs__header {
      display: none;
    }
  }

  &.ed-tabs--card {
    > .ed-tabs__header {
      height: auto !important;
    }
  }

  &.fontColor {
    .ed-tabs__item {
      color: var(--de-font-color);

      &.is-active {
        color: var(--el-color-primary);
      }

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  &.activeColor {
    .ed-tabs__item {
      &.is-active {
        color: var(--de-active-color);
      }

      &:hover {
        color: var(--de-active-color);
      }
    }

    .ed-tabs__active-bar {
      height: 0px;
      background-color: var(--de-active-color);
    }
  }

  // Card style border
  &.noBorder.ed-tabs--card {
    > .ed-tabs__header {
      border-bottom: none;

      .ed-tabs__nav {
        border: none;
      }

      .ed-tabs__item {
        border-left: none;
      }

      .ed-tabs__item.is-active {
        border-bottom: none;
      }
    }
  }

  &.borderActiveColor.ed-tabs--card {
    > .ed-tabs__header .ed-tabs__item.is-active {
      border-bottom-color: var(--de-border-active-color);
    }
  }

  &.borderColor.ed-tabs--card {
    > .ed-tabs__header {
      border-bottom-color: var(--de-border-color);

      .ed-tabs__nav {
        border-color: var(--de-border-color);
      }

      .ed-tabs__item {
        border-left-color: var(--de-border-color);
      }
    }

    .ed-tabs__item {
      &.is-active {
        color: var(--de-active-color);
      }

      &:hover {
        color: var(--de-active-color);
      }
    }

    .ed-tabs__active-bar {
      height: 0px;
      background-color: var(--de-active-color);
    }
  }

  // A simple style border
  &.noBorder {
    .ed-tabs__nav-wrap::after {
      background: none;
    }
  }

  &.borderColor {
    .ed-tabs__nav-wrap::after {
      background: var(--de-border-color);
    }
  }

  // radioGroup type
  &.radioGroup.ed-tabs--card {
    > .ed-tabs__header {
      border-bottom: none;

      .ed-tabs__nav {
        border: none;
      }

      .ed-tabs__item {
        border: 1px solid var(--de-border-color);
        border-right: 0;

        &:first-child {
          border-left: 1px solid var(--de-border-color);
          border-radius: 4px 0 0 4px;
        }

        &:last-child {
          border-right: 1px solid var(--de-border-color);
          border-radius: 0 4px 4px 0;
        }

        &.is-active {
          border: 1px solid var(--de-border-active-color);

          & + .ed-tabs__item {
            border-left: 0;
          }
        }
      }
    }
  }
}
</style>
