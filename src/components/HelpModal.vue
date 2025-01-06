<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ModalWindow from './ModalWindow.vue';

const legalHeader = ref<HTMLElement>();

const router = useRouter();

const mainSite = 'https://www.ubes.co.uk/';
const email = 'walks@ubes.co.uk';
const mailto = `mailto:${email}`;

const scrollToBottom = () => {
  legalHeader.value?.scrollIntoView({ behavior: 'smooth' });
};
const close = () => {
  router.go(-1);
};
</script>

<template>
  <ModalWindow title="UBES Walks Library" @close="close">
    <p>
      This is a project made by the
      <a :href="mainSite">University of Bristol Expeditions Society</a>
      during the November lockdown of 2020. It is designed to encourage keen walkers to discover new
      walks in and around Bristol, even for those new to the city. When doing these walks, please
      remember to obey all relevant measures to stop the spread of coronavirus, so we can get back
      to running our normal trips as soon as possible!
    </p>

    <h2>How it works</h2>
    <p>
      Use the sidebar to view a list of routes, all supplied by keen UBESters. There are controls at
      the top to sort and filter the list.
    </p>
    <p>
      Click on a route to view more information about it, including the option to download a GPX
      file and view the elevation graph. On a computer, when you hover over the elevation graph, a
      marker will appear on the relevant part of the map.
    </p>
    <h2>Get in touch</h2>
    <p>
      If you have any feedback on the site, please do let us know! If you’re a society member, send
      us a message on WhatsApp, otherwise we would be happy to hear from you by
      <a :href="mailto">email</a>.
    </p>
    <h2 ref="legalHeader" :class="$style.legal" @click="scrollToBottom">Legal notice</h2>
    <p>Publisher:</p>
    <blockquote :class="$style.preLine">
      <b>University of Bristol Expeditions Society</b>, Bristol SU, Richmond Building, 105 Queens
      Road, Bristol BS8 1LN, United Kingdom
    </blockquote>
    <p>
      Contact: <a :href="mailto">{{ email }}</a>
    </p>
  </ModalWindow>
</template>
<style lang="scss" module>
.legal {
  position: sticky;
  bottom: 0;
  background-color: var(--background);
  padding-top: 0.16em;
  margin-top: 0.67em;
}

.preLine {
  white-space: pre-line;
}
</style>
