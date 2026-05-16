---
name: hyperframes-platform-delivery
description: Hyperframes 教學影片多平台交付規格。用於同一支影片需要輸出 YouTube 橫式 16:9、IG Reels / Threads / Shorts 直式 9:16、縮圖、平台 caption/description、render 命名、發布前驗證與本機影片 worktree 管理時。取代 Claude Videos / Remotion 版多平台管線，所有影片來源以 Hyperframes HTML composition 為準。
---

# Hyperframes Platform Delivery

用 Hyperframes 製作要跨 YouTube、Instagram、Threads、Shorts 發布的教學影片時使用。

## 核心原則

- Hyperframes HTML 是影片來源，不使用 Remotion composition。
- 個人影片專案放在本機 `video/*` 分支與 `.worktrees/<name>/`，不推遠端。
- 影片工作目錄建議放 `videos/<video-name>/`，但 `videos/` 應被 `.gitignore` 忽略。
- 素材、旁白、截圖、waveform cache、render 產物都不提交。
- 只把共用 framework、skills、docs、scripts 類規則提交到 `main`。

## 尺寸與輸出

每支正式教學片至少規劃三個交付面：

| 用途                       |        尺寸 | 檔名建議                                    | 備註                         |
| -------------------------- | ----------: | ------------------------------------------- | ---------------------------- |
| YouTube 橫式               | `1920x1080` | `output/<video-name>.mp4`                   | 長片、章節、完整 description |
| IG / Threads / Shorts 直式 | `1080x1920` | `output/<video-name>-reel.mp4`              | 直式安全區、字幕較大         |
| YouTube 縮圖               |  `1280x720` | `output/<video-name>-thumbnail-youtube.jpg` | JPG/PNG，小於 2MB            |
| IG / Threads 封面          | `1080x1920` | `output/<video-name>-cover-reel.jpg`        | IG API cover 建議 JPG        |

若時間不足，先做 `1080x1920` 直式版本；要正式上 YouTube 時再補 `1920x1080` 與 `1280x720` 縮圖。

## Hyperframes Composition 結構

建議每支影片目錄：

```text
videos/<video-name>/
  index.html                 # 主要版本，通常先做 9:16
  horizontal.html            # 可選，YouTube 16:9
  thumbnail-youtube.html     # 可選，1280x720 縮圖 composition
  cover-reel.html            # 可選，1080x1920 封面 composition
  assets/                    # 本機素材，gitignored
  output/                    # 本機 render，gitignored
```

HTML 必須符合 Hyperframes 規則：

- 根 composition 有 `data-composition-id`、`data-start`、`data-duration`、`data-width`、`data-height`。
- 所有 timed media clip 有 `class="clip"`、`data-start`、`data-duration`、`data-track-index`。
- 影片的音訊要拆成獨立 `<audio>`，不要依賴 `<video>` 播聲音。
- GSAP timeline 必須 `paused: true`，並註冊到 `window.__timelines["<composition-id>"]`。
- 多場景要用轉場或明確 fade，不要裸跳切。

## 直式 9:16 規則

直式平台包含 IG Reels、Threads inline video、YouTube Shorts。

- Composition 尺寸：`1080x1920`。
- 主要文字避開上下 UI 安全區：頂部約 `120px`、底部約 `220px` 保守處理。
- 字幕建議放底部安全區上方，字級約 `34px-48px`。
- 截圖或 UI demo 不要貼滿整個畫面；用 card/device frame 包起來，保留標題與字幕空間。
- 同一段旁白只呈現一個主要操作，避免直式畫面過密。
- 如果要上 Shorts，長度控制在 3 分鐘內；標題或 description 可含 `#Shorts`。

## 橫式 16:9 規則

YouTube 長片使用。

- Composition 尺寸：`1920x1080`。
- 左右分欄通常比垂直堆疊更好：左側講解/步驟，右側畫面/截圖。
- 字幕字級約 `30px-38px`，避免擋住 UI 操作重點。
- Description 必須準備影片章節，第一個章節從 `0:00` 開始。
- 若同時做直式與橫式，不要硬把同一份 9:16 layout scale 到 16:9；另寫 `horizontal.html` 或用 CSS 針對尺寸分流。

## 縮圖與封面

YouTube thumbnail：

- 尺寸：`1280x720`。
- 格式：JPG 或 PNG，小於 2MB。
- 文字 3-7 個中文詞為主，不要塞完整句子。
- 必須一眼看出主題，例如「Instagram API」「自動發文」「Token」。
- 用 `thumbnail-youtube.html` 做成 Hyperframes still-like composition，再 render / screenshot 成圖。

IG / Threads / Reel cover：

- 尺寸：`1080x1920`。
- 格式：JPG 優先，IG API cover 不要用 PNG。
- 主標題放中上區，避開底部 UI。
- 可以跟直式影片第一幕同設計語言，但不要直接截影片中間模糊畫面。

## Render 與驗證流程

每次新增或修改 HTML composition 後：

```bash
npx hyperframes lint videos/<video-name>
npx hyperframes validate videos/<video-name>
```

建議再跑：

```bash
npx hyperframes inspect videos/<video-name>
```

Render 命令範例：

```bash
npx hyperframes render videos/<video-name> --output videos/<video-name>/output/<video-name>-reel.mp4
npx hyperframes render videos/<video-name> --entry horizontal.html --output videos/<video-name>/output/<video-name>.mp4
```

若 CLI 版本不支援 `--entry`，改在對應資料夾內暫時以目標 HTML 作為 `index.html`，或分成兩個子目錄。

發布前至少確認：

- `lint` 沒有 error。
- `validate` 沒有 console error，WCAG contrast 沒有重大警告。
- 直式版字幕沒有被平台 UI 可能遮住。
- 截圖、音訊、cover 路徑在 render 環境可讀。
- mp4 為 H.264 / yuv420p；若 IG 或 Threads API 報 processing unknown，先用 ffmpeg 重新轉碼。

## 平台文案

YouTube：

- Title 上限 100 字元。
- Description 上限 5000 字元。
- 避免 `<` 與 `>`；shell redirect 不要直接寫 `>>`，可改成說明文字或 Unicode 替代。
- Description 放完整章節與相關連結。

Instagram：

- Reels 影片：9:16，`1080x1920`，3 秒到 15 分鐘。
- Caption 前 125 字要放主題關鍵字。
- Hashtag 最多 5 個；第 5 個可保留固定 branded tag。
- API cover 用 JPG。

Threads：

- 主貼文優先純文字加 9:16 inline video。
- 避免在主貼文與第一則回覆放外連結。
- 如果要補連結，等主貼文互動穩定後再回覆。

Shorts：

- 使用 9:16 mp4。
- 長度不超過 3 分鐘。
- Title 或 description 可加 `#Shorts`。

## 本機分支規則

個人影片不要推遠端：

```bash
git worktree add .worktrees/<video-name> -b video/<video-name> main
cd .worktrees/<video-name>
```

只推 `main` 的共用改動；`video/*` 分支和 `videos/` 內容留本機。
