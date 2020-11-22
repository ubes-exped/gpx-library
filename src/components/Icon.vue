<template>
  <i
    class="material-icons"
    :class="{ inline, large, placeholder }"
    v-on="$listeners"
  >{{ generated }}<slot /></i>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component
export default class Icon extends Vue {
  @Prop([Boolean]) inline!: boolean;

  @Prop([Boolean]) large!: boolean;

  @Prop([Boolean]) placeholder!: boolean;

  get generated(): string {
    if (this.placeholder) return "crop_square";
    return "";
  }
}
</script>

<style lang="scss">
.material-icons {
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
}
</style>
