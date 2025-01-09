<script setup lang="ts">
import { useRouter } from 'vue-router';
import ModalWindow from './ModalWindow.vue';
import { reactive, ref } from 'vue';
import UploadField from './UploadField.vue';
import { VirtualNode } from '@/interfaces/VirtualNode';
import MaterialIcon from './MaterialIcon.vue';
import KeywordField from './KeywordField.vue';
import Walk, { type RawWalk } from '@/interfaces/Walk';
import { routesFile } from '@/config';

const { allTags = [], allAuthors } = defineProps<{
  allTags?: string[];
  allAuthors?: string[];
}>();

const emit = defineEmits<{ reloadWalks: [walks: Walk[]] }>();

const router = useRouter();

const close = () => {
  router.go(-1);
};

const errorMessage = ref<string>();

const fileInput = ref<HTMLInputElement>();

const parser = new DOMParser();

interface Metadata {
  readonly defaultName: string | null;
  name: string | null;
  desc: string | null;
  authorName: string | null;
  keywords: string | null;
  readonly save: () => Promise<void>;
}

const data = ref<Metadata>();
const loading = ref(false);

const MIME_XML = 'application/xml';

const selectFile = async () => {
  errorMessage.value = undefined;
  const files = fileInput.value?.files;
  if (!files?.length) {
    data.value = undefined;
    return;
  }

  const file = files[0];
  const fileName = file.name;
  const doc = parser.parseFromString(await file.text(), MIME_XML);
  const root = doc.documentElement;

  const defaultName = root.querySelector('name')?.textContent ?? null;

  const virtualRoot = VirtualNode.fromNode(root);

  const metadata = virtualRoot.child('metadata');
  const name = metadata.child('name');
  const desc = metadata.child('desc');
  const author = metadata.child('author');
  const authorName = author.child('name');
  const keywords = metadata.child('keywords');

  const save = async () => {
    errorMessage.value = undefined;

    loading.value = true;
    name.setValue(newData.name);
    desc.setValue(newData.desc);
    authorName.setValue(newData.authorName);
    keywords.setValue(newData.keywords);

    const body = root.outerHTML;

    const formData = new FormData();
    formData.append('gpxfile', new Blob([body], { type: MIME_XML }), fileName);

    const response = await fetch('/upload.php', { method: 'POST', body: formData });

    loading.value = false;
    if (response.status < 400) {
      close();
    } else {
      errorMessage.value = 'Error submitting file, please try again later';
    }
  };

  const newData = reactive<Metadata>({
    defaultName,
    name: name.getValue(),
    desc: desc.getValue(),
    authorName: authorName.getValue(),
    keywords: keywords.getValue(),
    save,
  });

  data.value = newData;
};

const reloadState = ref<'loading' | 'success' | 'failure'>();

const reload = async () => {
  if (reloadState.value === 'loading') return;
  reloadState.value = 'loading';
  try {
    const walksResponse = await fetch(routesFile);
    const rawWalks: RawWalk[] = await walksResponse.json();
    emit(
      'reloadWalks',
      rawWalks.map((walk) => new Walk(walk)),
    );
    reloadState.value = 'success';
  } catch (e: unknown) {
    console.error('Error fetching walks', e);
    reloadState.value = 'failure';
  }
};
</script>

<template>
  <ModalWindow title="Upload new walk" @close="close">
    <p>Use the following form to upload a new walk.</p>
    <p>After the upload has been completed, it will be processed in about a minute.</p>
    <p>
      If it still doesn’t show up, trigger a
      <a href="/" @click.prevent="reload" :class="reloadState === 'loading' && $style.disabled"
        >hard refresh</a
      >.
      <MaterialIcon v-if="reloadState === 'success'" inline bottom :class="$style.success">
        check_circle
      </MaterialIcon>
      <MaterialIcon v-else-if="reloadState === 'failure'" inline bottom :class="$style.error">
        error
      </MaterialIcon>
    </p>
    <p>
      You can also check if a build has been triggered
      <a href="https://github.com/ubes-exped/routes.ubes.co.uk/actions" target="_blank">in GitHub</a
      >.
    </p>
    <hr />
    <p>
      To make changes to an existing walk, upload the same walk with new metadata. For any other
      operations (deleting a walk or changing the path), please modify the data
      <a href="https://github.com/ubes-exped/routes.ubes.co.uk" target="_blank">in GitHub</a>
      directly.
    </p>
    <hr />
    <p>
      <input
        :class="$style.uploadInput"
        ref="fileInput"
        type="file"
        accept=".gpx,application/gpx+xml"
        @change="selectFile"
      />
    </p>
    <p v-if="errorMessage" :class="$style.errorMessage">
      <span>{{ errorMessage }}</span>
      <MaterialIcon :class="$style.closeError" inline @click="errorMessage = undefined">
        close
      </MaterialIcon>
    </p>
    <div v-if="data" :class="$style.uploadFields">
      <UploadField v-model="data.name" :fallback="data.defaultName ?? undefined">Name</UploadField>
      <UploadField v-model="data.desc">Description</UploadField>
      <UploadField v-model="data.authorName" :suggestions="allAuthors">Author</UploadField>
      <UploadField
        v-model="data.keywords"
        description="comma-separated keywords, used for filtering"
      >
        Keywords <MaterialIcon inline>info</MaterialIcon>
        <template #edit="{ class: className }">
          <KeywordField
            :class="[className]"
            v-model="data.keywords"
            :all-tags="allTags"
          ></KeywordField>
        </template>
      </UploadField>
    </div>
    <p>
      <button @click="data?.save()" :disabled="loading || !data">Save</button>
    </p>
  </ModalWindow>
</template>

<style lang="scss" module>
.uploadFields {
  padding-bottom: 1em;
}

.errorMessage {
  padding: 0.5em;
  border-radius: 0.5em;
  background-color: var(--background-error);
  display: flex;

  .closeError {
    margin-left: auto;
  }
}

.uploadInput {
  width: 100%;
}

.error {
  color: var(--color-error);
}

.success {
  color: var(--color-success);
}

a.disabled {
  color: var(--color-weak);
  cursor: default;
}
</style>
