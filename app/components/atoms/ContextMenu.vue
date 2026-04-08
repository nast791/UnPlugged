<template>
  <ContextMenuRoot>
    <ContextMenuTrigger>
      <slot/>
    </ContextMenuTrigger>
    
    <ContextMenuContent class="bg-white p-8 rounded shadow-xl text-sm min-w-120">
      <ContextMenuItem class="p-8 hover:bg-slate-100 cursor-pointer">Сыграть карту</ContextMenuItem>
      <ContextMenuItem class="p-8 hover:bg-slate-100 cursor-pointer">Сбросить</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenuRoot>
</template>
<script setup>

</script>