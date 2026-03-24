<template>
  <div>
    <SelectRoot v-model="modelValue">
      <SelectTrigger :class="styles.trigger()" class="group">
        <div class="flex flex-col items-start gap-2">
          <slot name="header" />
          <SelectValue :placeholder="placeholder">
            {{ selectedName }}
          </SelectValue>
        </div>

        <SelectIcon>
          <IconArrow
            class="w-20 h-20 text-slate-500 transition-transform group-data-[state=open]:rotate-180"
          />
        </SelectIcon>
      </SelectTrigger>

      <SelectContent
        :class="styles.content()"
        position="popper"
        :side-offset="4"
        :avoid-collisions="true"
      >
        <SelectViewport :class="styles.viewport()">
          <OverlayScrollbars
            element="div"
            defer
            :options="{ scrollbars: { autoHide: 'scroll', theme: 'os-theme-light' } }"
            class="max-h-172"
          >
            <SelectItem
              v-for="item in options"
              :key="item.id"
              :value="String(item.id)"
              :disabled="item.disabled"
              class="group"
              :class="styles.item()"
            >
              <slot name="option" :item="item">
                <SelectItemText>{{ item.name }}</SelectItemText>
              </slot>

              <SelectItemIndicator :class="styles.indicator()" v-if="!item.disabled">
                <div class="w-6 h-6 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              </SelectItemIndicator>

              <div
                class="hidden group-hover:block"
                :class="styles.activeBar()"
                v-if="!item.disabled"
              />

              <span
                v-if="item.disabled"
                class="text-12 uppercase tracking-tighter text-slate-500 font-bold"
              >
                Выбран
              </span>
            </SelectItem>
          </OverlayScrollbars>
        </SelectViewport>
      </SelectContent>
    </SelectRoot>
  </div>
</template>

<script setup>
import IconArrow from '~/svg/arrow-down-24.svg';

const { options, placeholder } = defineProps({
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Выберите...' },
});

const selectStyles = tv({
  slots: {
    trigger:
      'relative flex items-center justify-between w-full cursor-pointer rounded-8 h-56 min-h-56 px-16 transition-all duration-200 bg-linear-to-b from-[#3a4255] to-[#1e232d] border border-black/60 ring-1 ring-inset ring-white/10 shadow-[0_4px_6px_rgba(0,0,0,0.4)] hover:from-[#434c62] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white flex-shrink-0',
    content:
      'z-50 rounded-8 overflow-hidden bg-[#1a1f2e] backdrop-blur-24 border border-white/10 shadow-2xl w-[var(--radix-select-trigger-width)]',
    viewport: 'w-full',
    item: 'relative text-18 cursor-pointer flex justify-between items-center py-12 px-16 transition-all duration-150 border-b border-white/5 last:border-0 hover:bg-cyan-500/15 hover:text-white hover:outline-none text-slate-400 data-[state=checked]:text-cyan-400 data-disabled:cursor-default data-disabled:opacity-40 data-disabled:grayscale-[0.8] min-h-56',
    indicator: 'flex items-center justify-center text-cyan-400 w-20 min-w-20 h-20',
    activeBar: 'absolute left-0 w-4 h-2/3 bg-cyan-500 rounded-r-full shadow-[0_0_8px_#06b6d4]',
  },
});
const styles = selectStyles();
const modelValue = defineModel();

const selectedName = computed(() => {
  const item = options.find(i => String(i.id) === String(modelValue.value));
  return item ? item.name : placeholder;
});
</script>
