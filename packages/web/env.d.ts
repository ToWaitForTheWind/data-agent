/// <reference types="vite/client" />

import type { ChatBaseContent } from "tdesign-web-components/lib/chat-engine/type";

/** TDesign Chat 引擎允许通过 AIContentTypeOverrides 扩展流式内容类型（见该库 type.d.ts） */
declare global {
  interface AIContentTypeOverrides {
    chart: ChatBaseContent<"chart", { id: number } & Record<string, unknown>>;
  }
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
