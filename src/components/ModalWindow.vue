<script setup lang="ts">
import MaterialIcon from './MaterialIcon.vue';

defineProps<{ title: string }>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <div :class="$style.wrapper" @click.self="emit('close')">
    <div :class="$style.window">
      <h1>
        <MaterialIcon inline :class="$style.back" @click="emit('close')"> arrow_back </MaterialIcon>
        <span>{{ title }}</span>
        <MaterialIcon inline placeholder />
      </h1>
      <div :class="$style.scroller">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  background-color: var(--overlay-color);
}

.back {
  cursor: pointer;
}

.window {
  width: 30em;
  max-height: 80vh;
  background: var(--background);
  padding: 0.5em;
  border-radius: 1em;
  border: 1px solid var(--background-strong);
  display: flex;
  flex-direction: column;
  margin: 2em;

  h1 {
    display: flex;
    justify-content: space-between;
    text-align: center;
  }

  .scroller {
    overflow-y: auto;
    height: 100%;
    padding: 0 0.5em;
  }

  @media screen and (max-width: 450px) {
    margin: 0;
    width: 100vw;
    height: 100%;
    max-height: unset;
    border-radius: 0;
    border: none;
  }
}
</style>
