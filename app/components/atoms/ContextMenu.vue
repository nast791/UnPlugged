<template>
  <ContextMenuRoot>
    <ContextMenuTrigger>
      <slot />
    </ContextMenuTrigger>

    <ContextMenuContent
      class="bg-gray-900 rounded-8 shadow-xl text-16 min-w-200 overflow-hidden z-1000"
    >
      <ContextMenuItem class="p-16 hover:bg-slate-700 cursor-pointer"
        >Сыграть карту</ContextMenuItem
      >
      <ContextMenuItem class="p-16 hover:bg-slate-700 cursor-pointer">Сбросить</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenuRoot>
</template>
<script setup></script>
