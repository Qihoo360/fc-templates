<template>
  <div class="flex flex-col h-full max-h-screen overflow-hidden">
    <div class="theme-card flex flex-col h-full min-h-[440px] max-h-full overflow-hidden">
      <div class="p-3 sm:p-4 space-y-3 sm:space-y-4 flex flex-col flex-1 min-h-0">
        <slot></slot>
      </div>
    </div>
  </div>
</template>