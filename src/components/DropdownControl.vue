<script lang="ts">
export interface DropdownOption {
  value: string;
  label: string;
}
</script>

<script setup lang="ts">
import MaterialIcon from './MaterialIcon.vue';

const model = defineModel<string>();

const { options = [] } = defineProps<{
  options: readonly DropdownOption[];
  blankValue?: string;
  blankLabel?: string;
  clearButton?: boolean;
}>();
</script>

<template>
  <div :class="$style.dropdown">
    <select v-model="model">
      <option v-if="blankLabel" :value="blankValue">
        {{ blankLabel }}
      </option>
      <option v-if="blankLabel" disabled />
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
      <slot />
    </select>
    <MaterialIcon
      v-if="clearButton && model !== blankValue"
      inline
      large
      @click="model = blankValue"
    >
      close
    </MaterialIcon>
    <MaterialIcon v-else :class="$style.downArrow" inline large> expand_more </MaterialIcon>
  </div>
</template>

<style lang="scss" module>
@use '@/styles/tablet';

.dropdown {
  display: inline-flex;
  margin: 1ex;
  @include tablet.colours;
  max-width: min-content;
  min-width: 3em;

  // Hack to prevent zooming on iOS when entering dropdown
  @media (hover: none) {
    font-size: 18px;
  }

  > select {
    flex-shrink: 1;
    min-width: 0;
    padding-inline-start: 1ex;
    margin-inline-end: -1.5em;
    padding-inline-end: 1.5em;
    border: none;
    appearance: none;
    background-color: transparent;
    font: inherit;
    color: inherit;
    font-size: 0.9em;
    text-overflow: ellipsis;

    &:focus {
      outline: none;
    }
  }

  .downArrow {
    pointer-events: none;
  }
}
</style>
