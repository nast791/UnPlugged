<template>
  <HListbox
    v-model="modelValue"
    v-slot="{ open }"
    as="div"
    :by="'id'"
    :key="modelValue?.id || 'empty'"
  >
    <Float
      placement="bottom"
      :show="open"
      :offset="4"
      flip
      teleport
      adaptive-width
      floating-as="div"
    >
      <HListboxButton
        class="relative flex items-center justify-between w-full cursor-pointer rounded-8 h-56 px-16 transition-all duration-200 bg-linear-to-b from-[#3a4255] to-[#1e232d] border border-black/60 ring-1 ring-inset ring-white/10 shadow-[0_4px_6px_rgba(0,0,0,0.4)] hover:from-[#434c62] focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      >
        <div class="flex flex-col items-start gap-2">
          <slot name="header" />
          <span class="block truncate text-white font-medium">
            {{ modelValue?.name || placeholder }}
          </span>
        </div>

        <IconArrow class="w-20 h-20 text-slate-500 transition-transform ui-open:rotate-180" />
      </HListboxButton>

      <HListboxOptions
        class="z-50 rounded-8 overflow-hidden bg-[#1a1f2e] backdrop-blur-24 border border-white/10 shadow-2xl focus:outline-none w-full"
      >
        <OverlayScrollbars
          element="div"
          defer
          :options="{
            scrollbars: { autoHide: 'scroll', theme: 'os-theme-light' },
          }"
          class="os-scroll max-h-172"
        >
          <HListboxOption
            v-slot="{ active, selected, disabled }"
            v-for="item in options"
            :key="item.id"
            :disabled="item.disabled"
            :value="item"
            as="template"
          >
            <div
              class="relative text-18 cursor-pointer flex justify-between items-center py-12 px-16 transition-all duration-150 border-b border-white/5 last:border-0 ui-active:bg-cyan-500/15 ui-active:shadow-[inset_0_0_12px_rgba(6,182,212,0.1)] text-slate-400 ui-active:text-white ui-selected:text-cyan-400 ui-disabled:cursor-default ui-disabled:opacity-40 ui-disabled:grayscale-[0.8] min-h-56"
            >
              <slot name="option" :item="item" :active="active" :selected="selected">
                {{ item.name }}
              </slot>

              <div
                v-if="selected && !disabled"
                class="flex items-center justify-center text-cyan-400 w-20 min-w-20 h-20"
              >
                <div class="w-6 h-6 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              </div>

              <span
                v-if="disabled"
                class="text-12 uppercase tracking-tighter text-slate-500 font-bold"
              >
                Выбран
              </span>

              <div
                v-if="active && !disabled"
                class="absolute left-0 w-4 h-2/3 bg-cyan-500 rounded-r-full shadow-[0_0_8px_#06b6d4]"
              />
            </div>
          </HListboxOption>
        </OverlayScrollbars>
      </HListboxOptions>
    </Float>
  </HListbox>
</template>
<script setup>
import IconArrow from '~/svg/arrow-down-24.svg';
import { Float } from '@headlessui-float/vue';

defineProps({
  options: { type: Array, default: () => [], required: true },
  placeholder: { type: String, default: '' },
  label: { type: String, default: '' },
});

const modelValue = defineModel();
</script>
