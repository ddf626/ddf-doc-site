import { mdEnhancePlugin } from "vuepress-plugin-md-enhance";
import { searchPlugin } from "@vuepress/plugin-search";
import { hopeTheme } from "vuepress-theme-hope";
import { externalLinkIconPlugin } from "@vuepress/plugin-external-link-icon";
import sidebar from "./sidebar";
import navbar from "./navbar";

export default {
  lang: "zh-CN",
  title: "cxyddf",
  description: "cxyddf",
  theme: hopeTheme({
    author: "cxyddf",
    sidebar,
    navbar,
    repo: "ddf626/ddf-doc-site",
    repoLabel: "GitHub",
    repoDisplay: true,
    docsBranch: "master",
    docsDir: "/docs",
    contributors: false,
    logo: "/logo.png",
    plugins: {
      git: true,
      prismjs: {
        light: "ghcolors",
      },
      autoCatalog: {},
      mdEnhance: {
        // 使用 KaTeX 启用 TeX 支持
        katex: true,
        // 使用 mathjax 启用 TeX 支持
        mathjax: true,
        codetabs: true,
      },
      searchPro: true,
    },
    headerDepth: 6,
  }),
  headerDepth: 6,
  markdown: {
    header: {
      // 用到哪一级就提取哪一级
      levels: [2, 3, 4, 5, 6],
    },
  },
  plugins: [externalLinkIconPlugin({})],
};
