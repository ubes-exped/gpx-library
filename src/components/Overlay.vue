<script lang="ts">
import {
  Component, Vue, Emit, Prop,
} from "vue-property-decorator";
import Icon from "./Icon.vue";

@Component({ components: { Icon } })
export default class Overlay extends Vue {
  @Emit() close() {
  }

  @Prop({ required: true }) title!: string;
}
</script>

<template>
  <div
    class="wrapper"
    @click.self="close"
  >
    <div class="window">
      <h1>
        <Icon
          inline
          class="back"
          @click="close"
        >
          arrow_back
        </Icon>
        <span>{{ title }}</span>
        <Icon
          inline
          placeholder
        />
      </h1>
      <div class="scroller">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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

h1 {
  display: flex;
  justify-content: space-between;
  text-align: center;
}
</style>
