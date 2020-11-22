<template>
  <i class="material-icons" :class="{ inline }"><slot /></i>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component
export default class Icon extends Vue {
  @Prop([Boolean]) inline!: boolean;
}
</script>

<style scoped>
.inline {
  vertical-align: middle;
}
</style>