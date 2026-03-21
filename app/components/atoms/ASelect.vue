<template>
  <HListbox v-model="modelValue" v-slot="{ open }" as="div">
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
        class="relative flex items-center justify-between w-full cursor-pointer rounded-8 py-12 px-16 transition-all duration-200 bg-linear-to-b from-[#3a4255] to-[#1e232d] border border-black/60 ring-1 ring-inset ring-white/10 shadow-[0_4px_6px_rgba(0,0,0,0.4)] hover:from-[#434c62] focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      >
        <span class="block truncate text-slate-400 text-10 uppercase font-bold mb-4" v-if="label">
          {{ label }}
        </span>
        <span class="block truncate text-white font-medium">
          {{ modelValue?.name || placeholder }}
        </span>
        <IconArrow class="w-20 h-20 text-slate-500 transition-transform ui-open:rotate-180" />
      </HListboxButton>

      <HListboxOptions
        class="z-50 max-h-240 rounded-8 overflow-hidden bg-[#1a1f2e] backdrop-blur-24 border border-white/10 shadow-2xl focus:outline-none w-full"
      >
        <HListboxOption
          v-slot="{ active, selected }"
          v-for="item in options"
          :key="item.id"
          :value="item"
          as="template"
        >
          <div
            class="relative cursor-pointer flex justify-between items-center py-12 px-16 transition-all duration-150 border-b border-white/5 last:border-0 ui-active:bg-cyan-500/15 ui-active:shadow-[inset_0_0_12px_rgba(6,182,212,0.1)] text-slate-400 ui-active:text-white ui-selected:text-cyan-400"
          >
            <div class="text-15">
              {{ item.name }}
            </div>

            <div
              v-if="selected"
              class="flex items-center justify-center text-cyan-400 w-20 min-w-20 h-20"
            >
              <div class="w-6 h-6 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            </div>

            <div
              v-if="active"
              class="absolute left-0 w-4 h-2/3 bg-cyan-500 rounded-r-full shadow-[0_0_8px_#06b6d4]"
            />
          </div>
        </HListboxOption>
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
