<script setup lang="ts">
import { ref } from 'vue';
import MaterialIcon from './MaterialIcon.vue';

const model = defineModel<string | null>();

const originalValue = model.value;

const edit = ref(false);

const { fallback } = defineProps<{
  fallback?: string;
  description?: string;
  suggestions?: string[];
}>();

const datalistId = crypto.randomUUID();

const reset = () => {
  edit.value = false;
  model.value = originalValue;
};

const suggest = () => {
  edit.value = true;
  model.value = fallback;
};
</script>

<template>
  <div :class="$style.uploadField">
    <label :class="$style.label" :title="description"><slot />:</label>

    <slot name="edit" v-if="edit" :class="$style.value">
      <input
        type="text"
        :value="model"
        :title="description"
        :class="$style.value"
        :list="datalistId"
      />
      <datalist v-if="suggestions" :id="datalistId">
        <option v-for="suggestion in suggestions" :key="suggestion">{{ suggestion }}</option>
      </datalist>
    </slot>
    <div v-else :class="$style.value" :title="description">
      <span v-if="model != null">{{ model }}</span>
      <span v-else :class="$style.none">Not set</span>
    </div>

    <button v-if="!model && fallback" @click="suggest" :title="fallback">
      <MaterialIcon inline>lightbulb</MaterialIcon>
    </button>

    <button v-if="edit" @click="reset">
      <MaterialIcon inline>undo</MaterialIcon>
    </button>
    <button v-else @click="edit = true">
      <MaterialIcon inline>edit</MaterialIcon>
    </button>
  </div>
</template>

<style lang="scss" module>
.uploadField {
  display: flex;
  gap: 0.5em;

  button {
    align-self: flex-start;
  }

  .value {
    flex: 1;
  }
}

.none {
  font-style: italic;
  opacity: 0.75;
}

.label {
  font-weight: bold;
}
</style>
