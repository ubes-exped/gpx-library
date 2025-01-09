<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import MaterialIcon from './MaterialIcon.vue';

const model = defineModel<string | null>({ required: true });

const { allTags = [] } = defineProps<{ allTags?: string[] }>();

const unique = (strings: string[]) => [...new Set(strings)];

const uniquePreservingLast = (strings: string[], preserve: number) =>
  unique(strings.slice(0, -preserve || Infinity)).concat(strings.slice(-preserve || Infinity));

const editingLastInput = ref(false);

const datalistId = crypto.randomUUID();

const cleanStrings = (strings: string[]) =>
  uniquePreservingLast(
    strings.map((string) => string.trim()),
    +editingLastInput.value,
  ).filter(Boolean);

const keywords = computed({
  get: () => model.value?.trim().split(/\s*,\s*/) ?? [],
  set: (rawKeywords) => {
    const trimmed = cleanStrings(rawKeywords);
    if (trimmed.length) {
      model.value = trimmed.join(', ');
    } else {
      model.value = null;
    }
  },
});

const suggestions = computed(() => allTags.filter((tag) => !keywords.value.includes(tag)));

const keywordTablets = computed(() =>
  editingLastInput.value ? keywords.value.slice(0, -1) : keywords.value,
);

const addEntry = () => {
  editingLastInput.value = false;
  keywords.value = cleanStrings(keywords.value);
};

const newInput = computed<string>({
  get: () => (editingLastInput.value ? (keywords.value.at(-1) ?? '') : ''),
  set: (val) => {
    const closedEnd = /,\s*$/.test(val);
    const allVals = val
      .trim()
      .split(/\s*,\s*/)
      .filter(Boolean);
    if (allVals.length) {
      if (editingLastInput.value) {
        keywords.value = keywords.value.toSpliced(-1, 1, ...allVals);
      } else {
        editingLastInput.value = true;
        keywords.value = keywords.value.concat(allVals);
      }
      if (closedEnd) {
        // This must be asynchronous to allow for the model to be updated
        void nextTick(addEntry);
      }
    } else {
      if (editingLastInput.value) {
        keywords.value = keywords.value.toSpliced(-1, 1);
        editingLastInput.value = false;
      } else {
        // do nothing: if we are not editing the last input and there is no input, nothing needs to be changed.
      }
    }
  },
});

const inputRef = ref<HTMLInputElement>();

const deleteIndex = (i: number) => {
  keywords.value = keywords.value.toSpliced(i, 1);
};

const backspace = (event: KeyboardEvent) => {
  if (!newInput.value) {
    editingLastInput.value = true;
    event.preventDefault();
  }
};

const enter = (event: KeyboardEvent) => {
  if (newInput.value) {
    addEntry();
    event.preventDefault();
  }
};

const comma = (event: KeyboardEvent) => {
  if (event.key !== ',') {
    return;
  }
  if (inputRef.value?.selectionStart === 0) {
    event.preventDefault();
  }
};

const isNewKeyword = (word: string) => !allTags.includes(word);
</script>

<template>
  <div :class="$style.keywordField">
    <div :class="$style.keywords">
      <div
        v-for="(keyword, i) of keywordTablets"
        :key="keyword"
        :class="[$style.keyword, isNewKeyword(keyword) && $style.warn]"
      >
        {{ keyword }}<span :class="$style.hiddenComma">, </span>
        <MaterialIcon inline @click="deleteIndex(i)">close</MaterialIcon>
      </div>
    </div>
    <input
      ref="inputRef"
      type="text"
      @keydown.backspace="backspace($event)"
      @keydown.enter="enter($event)"
      @keydown="comma($event)"
      v-model="newInput"
      :list="datalistId"
    />
    <datalist :id="datalistId">
      <option v-for="suggestion in suggestions" :key="suggestion">{{ suggestion }}</option>
    </datalist>
  </div>
</template>

<style lang="scss" module>
@use '@/styles/tablet';

.keywordField {
  display: flex;
  flex-direction: column;
}

.keywords {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  font-size: max(0.8em, 12px);
}

.keyword {
  @include tablet.full;
}

.keyword.warn {
  background-color: var(--background-warn);
}

.hiddenComma {
  display: inline-block;
  width: 0;
  height: 0;
  overflow: hidden;
}
</style>
