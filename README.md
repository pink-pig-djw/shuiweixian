# 水位线

现代农村悬疑恐怖文字冒险。基于提供的「水位线-Windows免安装」游戏制作 Windows 独立应用与 Android App，保留原剧情、画面、音效、字体和存档系统。应用图标使用提供的图片，仅按平台要求缩放、补边。

## 下载与使用

在 [Releases](https://github.com/pink-pig-djw/shuiweixian/releases) 下载：

- **Windows 安装版**：`Windows-Setup.exe`，安装时可创建桌面快捷方式。
- **Windows 免安装版**：`Windows-Portable.exe`，双击运行，无需浏览器或 Node.js。
- **Android 预览版**：`Shuiweixian-Android-Preview.apk`，支持 Android 8.0 及以上，需要已更新的 Android System WebView。下载后允许用于下载的应用安装此 APK。
- `Android-Unsigned.apk` 是供开发者自行签名的正式构建，**不能直接安装**。

Windows 包尚未使用商业代码签名证书，系统可能提示未知发布者。Android 预览版使用调试签名，适合安装体验；不同 CI 构建的调试密钥可能不同，不保证覆盖升级。长期分发请使用自行保管的固定签名密钥。iOS 不包含在这一版本中。

## 游戏操作与存档

- 点击推进；长按隐藏界面；下滑回退；上滑打开记录。
- 电脑：空格/回车推进，Ctrl 快进，↑ 回退，A 自动，L 记录，H 隐藏，F5/F9 快存/快读，F11 切换全屏。
- 安卓返回键优先关闭弹窗或打开游戏菜单，在标题画面再次返回可确认退出。
- 最小化、切入后台或关闭时保存进度，停止自动推进并暂停声音。重新打开后选择「继续」。

所有剧情、字体和声音均可离线运行。Android 无网络权限；桌面版阻止外部网络请求。进度保存在设备本地，不会上传或跨设备同步。Windows 安装版和免安装版共用 `%APPDATA%/Shuiweixian` 中的存档；原浏览器版的存档不会自动迁移。Android 清除应用数据或卸载会删除存档。

## 本地开发

需要 Node.js 24 与 npm：

```sh
npm ci
npm test
npm start
npm run test:desktop
npm run build:win -- --publish never
```

Windows 构建结果在 `dist/`。图标修改后执行 `npm run icons`。后台适配的可编辑源文件是 `web/native-lifecycle.js`，修改后运行 `node scripts/prepare.cjs`，将其嵌入游戏引擎作用域。网页预览：`npm run serve`，访问 `http://127.0.0.1:4173`。

Android 使用 JDK 17、Android SDK 35 和 Gradle 8.11.1。可用 Android Studio 打开 `android/`，或在配置好 `ANDROID_HOME` 的终端执行：

```sh
cd android
gradle :app:assembleDebug :app:assembleRelease :app:lintDebug
```

`debug` 的应用 ID 为 `com.pinkpigdjw.shuiweixian.preview`，`release` 为 `com.pinkpigdjw.shuiweixian`。正式版 APK 需使用 Android SDK 的 `apksigner` 配合自己的密钥签名；不要把密钥、密码或 `local.properties` 提交到仓库。

## 自动构建

推送到 `main` 或手动运行 [Build apps](https://github.com/pink-pig-djw/shuiweixian/actions/workflows/build.yml)，会构建 Windows 与 Android 安装文件并运行检查。推送 `v*` 标签后，构建通过的文件会自动上传到 Releases。Windows 构建有原生 Electron 启动、保存和恢复测试；手机尺寸截图只能验证布局，不能替代安卓真机测试。

## 目录

| 路径 | 内容 |
| --- | --- |
| `web/` | 完整游戏与离线字体 |
| `desktop/` | Electron Windows 应用 |
| `android/` | Android WebView 应用 |
| `assets/` | 用户提供的图标原图及桌面图标 |
| `scripts/` | 图标生成、预览、适配与测试 |
| `.github/workflows/` | 自动构建及发布 |

封装遵循 [Electron 安全建议](https://www.electronjs.org/docs/latest/tutorial/security)，Android 通过 [WebViewAssetLoader](https://developer.android.com/reference/androidx/webkit/WebViewAssetLoader) 读取包内资源。游戏与图标素材的权利归其原权利人；本仓库不额外授予这些素材的使用许可。
