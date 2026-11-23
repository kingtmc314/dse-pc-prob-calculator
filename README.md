# DSE 數學 · 互動推導學習器

繁體中文／英文 React + TypeScript 教學網站，讓學生由生活情境理解排列、組合及概率的推導，而不只是得到答案。

正式網站：https://kingtmc314.github.io/dse-pc-prob-calculator/

## 學習功能

- **動畫教室**：五種固定小規模示範，包括位置排列、重複次序合併為組合、相鄰捆綁、先選後排及插空。動畫從暫停開始，支援逐步操作、播放／暫停、重播和速度設定，尊重 reduced-motion 偏好。數字標示清楚，不假裝動畫使用計算器的實際輸入。
- **DSE 練習室**：四種原創 HKDSE 風格題型，有隨機參數變式。包含策略單選與理由、提示、嚴格答案核對、逐步解答及常見錯誤。進度按題型計算，可用時只儲存在目前瀏覽器。
- **排列與組合工作室**：保留辦公室、學校、茶餐廳及家庭四個故事，以及五步精靈。相鄰／不相鄰與首尾限制可共同計數；「至少／至多／恰好」共同限制取交集後分類相加。
- **自由算式**：明顯的頂層入口，支援 n!、nPr、nCr 混合乘積及選填分母。使用 BigInt 精確計算並顯示約分分數。
- **概率工具**：完整的故事題、組合／排列／混合模型預設、自訂分子分母、逐項數學推導、樣本空間一致性提醒，以及保留的 Bayes SVG 樹狀圖。
- **公式手冊**：包含階乘、排列與組合關係、捆綁、插空與概率公式。所有公式經 KaTeX 以 displaystyle 顯示。

## 課程與題目標示

練習題為原創，**並非考評局歷屆真題或官方評分參考**。標示的分數只供自學。

教育局課程指引第 15、16 單元包括相異物件不重複的排列／組合、相鄰限制及相關概率。圓形排列與 Bayes 不屬必修部分要求；本網站保留兩者作延伸學習。

參考：
- [教育局數學課程及評估指引](https://www.edb.gov.hk/attachment/en/curriculum-development/kla/ma/curr/CA_2017_e.pdf)
- [考評局 HKDSE 數學資料](https://www.hkeaa.edu.hk/en/hkdse/assessment/subject_information/category_a_subjects/math/)

## 開發與測試

使用 Node.js 22 及 pnpm 10。

```bash
pnpm install --frozen-lockfile
pnpm dev --host 0.0.0.0
pnpm test
pnpm lint
pnpm build
```

`tests/math-regression.mjs` 驗證精確算式、複合條件（以實際排列枚舉核對）、題目變式和完整字串答案解析。計數答案須精確相等；概率分數亦須精確，小數容許符合已標示的四位小數精度。

精靈總物件數限制為 1–18，以維持 JS number 的安全整數範圍。自由算式每項 n 為 0–20，最多 40 個乘積項，完整整數／分數結果以 BigInt 處理。概率小數顯示為近似四位小數；自訂算式的數值範圍檢查不能代替使用者對模型的數學判斷。

## 部署

推送 `main` 後，`.github/workflows/deploy.yml` 自動執行建置及 GitHub Pages 部署；測試與 lint 可於本地執行。Vite base 保持 `/dse-pc-prob-calculator/`；學習頁採用 hash 導航，支援重新整理及瀏覽器上一頁／下一頁。

本正式專案獨立於舊 `series-calculator-students` 專案，不能把新功能寫回舊專案。
