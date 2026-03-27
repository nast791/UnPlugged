<template>
  <!-- <TooltipProvider :delay-duration="delay"> -->
    <TooltipRoot :delay-duration="delay">
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>

      <TooltipPortal>
        <TooltipContent
          :side="side"
          :side-offset="8"
          class="z-100 select-none rounded-8 bg-zinc-900 px-12 py-8 text-12 leading-none text-white shadow-xl outline-none border border-white/10 animate-in fade-in zoom-in duration-150"
        >
          <div class="flex flex-col gap-4">
            <span class="font-medium uppercase tracking-tight">{{ content }}</span>
          </div>

          <TooltipArrow class="fill-zinc-900 stroke-white/10" :width="10" :height="5" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  <!-- </TooltipProvider> -->
</template>
<script setup>
defineProps({
  content: { type: String, required: true },
  side: { type: String, default: 'top' }, // 'top', 'bottom', 'left', 'right'
  delay: { type: Number, default: 200 },
});
</script>
