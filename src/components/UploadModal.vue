<script lang="ts">
import {
  Component, Vue,
} from "vue-property-decorator";
import ModalWindow from "./ModalWindow.vue";

@Component({ components: { ModalWindow } })
export default class Upload extends Vue {
  close() {
    this.$router.go(-1);
  }
}
</script>

<template>
  <ModalWindow
    title="Upload new walk"
    @close="close"
  >
    <p>Use the following form to upload a new route.</p>
    <p>After the upload has been completed, it will be processed in about a minute.</p>
    <p>
      If it doesn’t show up, check if a build has been triggered
      <a
        href="https://github.com/ubes-exped/routes.ubes.co.uk/actions/workflows/compile.yml"
        target="_blank"
      >in GitHub</a>.
    </p>
    <hr>
    <p>
      To make changes to an existing route, upload the same route with new metadata.
      For any other operations (deleting, changing the path of a route), please modify the data
      <a
        href="https://github.com/ubes-exped/routes.ubes.co.uk"
        target="_blank"
      >in GitHub</a>
      directly.
    </p>
    <form
      action="/upload.php"
      method="post"
      enctype="multipart/form-data"
      required
    >
      <p>
        <input
          type="file"
          accept=".gpx,application/gpx+xml"
          name="gpxfile"
        >
      </p>
      <p>
        <input
          type="submit"
          value="Upload"
        >
      </p>
    </form>
  </ModalWindow>
</template>
