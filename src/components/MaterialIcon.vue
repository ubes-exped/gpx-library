<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component
export default class Icon extends Vue {
  @Prop([Boolean]) inline!: boolean;

  @Prop([Boolean]) large!: boolean;

  @Prop([Boolean]) placeholder!: boolean;

  @Prop([Boolean]) bottom!: boolean;

  get generated(): string {
    if (this.placeholder) return "crop_square";
    return "";
  }
}
</script>
