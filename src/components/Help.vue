<template>
  <div class="help-wrapper" @click.self="close">
    <div class="help-window">
      <h1>
        <Icon inline class="back" @click="close">arrow_back</Icon>
        <span>UBES Walks Library</span>
        <Icon inline placeholder />
      </h1>
      <div class="help-scroller">
        <p>
          This is a project made by the University of Bristol Expeditions
          Society during the November lockdown of 2020. It is designed to
          encourage keen walkers to discover new walks in and around Bristol,
          even for those new to the city. When doing these walks, please
          remember to obey all relevant measures to stop the spread of
          coronavirus, so we can get back to running our normal trips as soon as
          possible!
        </p>

        <h2>How it works</h2>
        <p>
          Use the sidebar to view a list of routes, all supplied by keen
          UBESters. There are controls at the top to sort and filter the list.
        </p>
        <p>
          Click on a route to view more information about it, including the
          option to download a GPX file and view the elevation graph. On a
          computer, when you hover over the elevation graph, a marker will
          appear on the relevant part of the map.
        </p>
        <h2>Get in touch</h2>
        <p>
          If you have any feedback on the site, please do let us know! If you’re
          a society member, send us a message on Discord, otherwise we would be
          happy to hear from you by <a :href="mailto">email</a>.
        </p>
        <h2 class="legal" @click="scrollToBottom" ref="legalHeader">
          Legal notice
        </h2>
        <p>Publisher:</p>
        <blockquote>
          <b>University of Bristol Expeditions Society</b>,<br />
          Bristol SU, Richmond Building,<br />
          105 Queens Road,<br />
          Bristol BS8 1LN,<br />
          United Kingdom
        </blockquote>
        <p>
          Contact: <a :href="mailto">{{ email }}</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import router from "@/router";
import { Component, Emit, Prop, Ref, Vue } from "vue-property-decorator";
import Icon from "./Icon.vue";

@Component({ components: { Icon } })
export default class Help extends Vue {
  @Ref() legalHeader!: HTMLElement;

  close() {
    this.$router.go(-1);
  }

  readonly email = "walks@ubes.co.uk";
  get mailto() {
    return `mailto:${this.email}`;
  }

  scrollToBottom(event: MouseEvent) {
    this.legalHeader.scrollIntoView({ behavior: "smooth" });
  }
}
</script>

<style lang="scss">
.help-wrapper {
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

.help-window {
  width: 30em;
  max-height: 80vh;
  background: var(--background);
  padding: 0.5em;
  border-radius: 1em;
  border: 1px solid var(--background-strong);
  display: flex;
  flex-direction: column;
  margin: 2em;

  .help-scroller {
    overflow-y: auto;
    height: 100%;
    padding: 0 0.5em;
  }

  h1 {
    display: flex;
    justify-content: space-between;
    text-align: center;
  }

  .legal {
    position: sticky;
    bottom: 0;
    background-color: var(--background);
    padding-top: 0.16em;
    margin-top: 0.67em;
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
