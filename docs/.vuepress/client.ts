import { defineClientConfig } from "@vuepress/client";
import RightSideBar from "./components/RightSideBar.vue";

export default defineClientConfig({
  enhance({ app, router, siteData }) {
    // app.component("RightSideBar", RightSideBar);
  },
  setup() {},
  // rootComponents: [RightSideBar],
});
