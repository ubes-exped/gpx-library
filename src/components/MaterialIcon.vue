<script setup lang="ts">
import { computed } from 'vue';
import { useHead } from '@unhead/vue';

const { placeholder } = defineProps<{
  inline?: boolean;
  large?: boolean;
  placeholder?: boolean;
  bottom?: boolean;
}>();

const generated = computed(() => (placeholder ? 'crop_square' : ''));

useHead({
  link: [
    {
      href: 'https://fonts.googleapis.com/icon?family=Material+Icons',
      rel: 'stylesheet',
    },
  ],
});
</script>
<template>
  <i
    :class="[
      'material-icons',
      $style.materialIcons,
      inline && $style.inline,
      large && $style.large,
      placeholder && $style.placeholder,
      bottom && $style.bottom,
    ]"
    v-bind="$attrs"
    >{{ generated }}<slot
  /></i>
</template>

<style lang="scss" module>
.materialIcons {
  user-select: none;
  width: 1em;

  &.inline {
    vertical-align: middle;
    align-self: center;
    font-size: 1em;
  }
  &.large {
    font-size: 1.5em;
  }
  &.placeholder {
    visibility: hidden;
  }
  &.bottom {
    vertical-align: bottom;
  }
}
</style>
