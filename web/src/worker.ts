import 'regenerator-runtime/runtime'
import 'core-js/stable'

import { WorkerChannel } from './channel'
import { download } from './cases/download'
import { upload } from './cases/upload'

const channelModule = {
  name: () => 'some name',
  download: (args: any) => download(args.baseURL)(args),
  // 同理修改 upload 方法（假设 upload.ts 有类似调整）
  upload: (args: any) => upload(args.baseURL)(args),
}

export type ChannelModule = typeof channelModule

const channel = new WorkerChannel(channelModule)
