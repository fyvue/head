import type { App, Ref } from "vue";
import { UnwrapRef } from "vue";
import { generateUUID } from "./helpers";
import { El, ElProperty } from "./element";

const __fyHeadCount__ = "fyhead:count";

// Inspired by @vueuse/head
export type MaybeRef<T> = T | Ref<T>;

export interface FyHeadObject {
  title?: MaybeRef<string | undefined>;
  metas?: MaybeRef<
    {
      name?: string;
      property?: string;
      content: string;
    }[]
  >;
  links?: MaybeRef<
    {
      rel: string;
      href: string;
      key?: string;
      hreflang?: string;
    }[]
  >;
  scripts?: MaybeRef<
    {
      src: string;
      id: string;
      nonce?: string;
      async?: boolean;
      crossorigin?: string;
    }[]
  >;
}
export type FyHeadObjectPlain = UnwrapRef<FyHeadObject>;

export class FyHead {
  elements: Map<string, El>;

  constructor() {
    this.elements = new Map<string, El>();
  }
  static createHead() {
    const head = new FyHead();
    return head;
  }
  install(app: App) {
    if (app.config.globalProperties) {
      app.config.globalProperties.$fyhead = this;
      app.provide("fyhead", this);
    }
  }
  headToElements(_headTags: FyHeadObjectPlain) {
    if (!_headTags) return;
    const els: El[] = [];
    for (const key of Object.keys(_headTags) as Array<
      keyof FyHeadObjectPlain
    >) {
      if (key == "title") {
        const title = _headTags[key];
        if (title) els.push(FyHead.createTitle(title));
      } else if (key == "links") {
        const links = _headTags[key];
        if (links)
          links.forEach((link) => {
            els.push(
              FyHead.createLink(link.rel, link.href, link.key, link.hreflang),
            );
          });
      } else if (key == "metas") {
        const metas = _headTags[key];
        if (metas)
          metas.forEach((meta) => {
            if (meta.property)
              els.push(
                FyHead.createMeta(meta.property, meta.content, "property"),
              );
            else if (meta.name)
              els.push(FyHead.createMeta(meta.name, meta.content, "name"));
          });
      } else if (key == "scripts") {
        const scripts = _headTags[key];
        if (scripts)
          scripts.forEach((script) => {
            els.push(
              FyHead.createScript(
                script.src,
                script.id,
                script.nonce,
                script.async,
                script.crossorigin,
              ),
            );
          });
      }
    }
    this.addElements(els);
    return els;
  }
  removeHeadElements(els: El[]) {
    for (const el of this.elements.values()) {
      if (els.find((item) => item.uuid === el.uuid))
        this.elements.delete(el.key);
    }
  }
  addElements(els: El[]) {
    els.forEach((el) => {
      this.elements.set(el.key, el);
    });
  }
  static createTitle(title: string) {
    return new El("title", [], "title", title);
  }
  static createScript(
    src: string,
    key?: string,
    nonce?: string,
    async: boolean = false,
    crossorigin?: string,
  ) {
    if (!key) key = generateUUID();
    const properties = [new ElProperty("id", key), new ElProperty("src", src)];
    if (async) properties.push(new ElProperty("async"));
    if (nonce) properties.push(new ElProperty("nonce", nonce));
    if (crossorigin)
      properties.push(new ElProperty("crossorigin", crossorigin));
    return new El("script", properties, key);
  }
  static createLink(
    rel: string,
    href: string,
    key: string | undefined = undefined,
    hreflang?: string,
  ) {
    if (!key) key = generateUUID();
    const propreties = [
      new ElProperty("rel", rel),
      new ElProperty("href", href),
    ];
    if (hreflang) propreties.push(new ElProperty("hreflang", hreflang));
    return new El("link", propreties, key);
  }
  static createMeta(
    value: string,
    content: string,
    type: "name" | "property" = "property",
  ) {
    const key = value + "-" + type;
    return new El(
      "meta",
      [
        new ElProperty(type, value),
        new ElProperty("content", content.replaceAll('"', "&quot;")), // Do this better
      ],
      key,
    );
  }
  renderHeadToString() {
    let headTags = "";
    for (const el of this.elements.values()) {
      headTags += `${el.toString()}\n`;
    }
    headTags += `<meta name="fyhead:count" content="${this.elements.size.toString()}">\n`;
    const htmlAttrs = "";
    const bodyAttrs = "";
    const bodyTags = "";
    return {
      headTags,
      htmlAttrs,
      bodyAttrs,
      bodyTags,
    };
  }
  updateDOM() {
    const newElements: Element[] = [];
    const oldElements: Element[] = [];
    if (document && document.head) {
      let headCountEl = document.querySelector(
        `meta[name="${__fyHeadCount__}"]`,
      );
      const headCount = headCountEl
        ? Number(headCountEl.getAttribute("content"))
        : 0;

      if (headCountEl) {
        for (
          let i = 0, j = headCountEl.previousElementSibling;
          i < headCount;
          i++
        ) {
          if (j) {
            oldElements.push(j);
          }
          j = j ? j.previousElementSibling : null;
        }
      }
      if (!headCountEl) headCountEl = document.createElement("meta");
      headCountEl.setAttribute("name", __fyHeadCount__);
      headCountEl.setAttribute("content", "0");
      document.head.append(headCountEl);
      for (const el of this.elements.values()) {
        if (el.tag === "title") {
          if (el.content) {
            document.title = el.content;
          }
        } else {
          const elDom = el.toDom(document);
          newElements.push(elDom);
        }
      }
      newElements.forEach((n) => {
        document.head.insertBefore(n, headCountEl);
      });
      oldElements.forEach((n) => {
        n.remove();
      });

      headCountEl.setAttribute("content", newElements.length.toString());
    }

    return newElements;
  }
}
