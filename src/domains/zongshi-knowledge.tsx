import { Bind, Empty, Page, Panel } from "./shared"
import type { PageConfig } from "./shared"

/** 格物·宗师域 · 格物之阁（知识库 / 文档检索 / 问答试验台 · 9 端点） */
export function Knowledge({ page }: { page: PageConfig }) {
  return (
    <Page page={page}>
      <div className="segmented">
        <button className="selected">知识库管理</button>
        <button>文档与检索</button>
        <button>问答试验台</button>
      </div>
      <div className="kb-layout">
        <Panel title="知识库" binding="GET /v1/knowledge-bases">
          <Empty owner="zongshi" text="知识库尚无内容，请上传第一份文档" />
        </Panel>
        <Panel title="检索试验" binding="POST /v1/rag/search">
          <div className="dropzone">
            拖入文档或 <button>选择文件</button>
            <small>POST /v1/documents/upload</small>
          </div>
        </Panel>
      </div>
    </Page>
  )
}
