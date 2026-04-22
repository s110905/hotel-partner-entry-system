# EXPORT_DATA

## 目的
- 把目前 demo 版存在瀏覽器 `localStorage` 的資料匯出成 `JSON`
- 讓這批資料之後可以保留、備份，並作為未來正式上線時的匯入來源

## 目前資料儲存位置
- 目前前端使用的 localStorage key：
  - `hotel-partner-entry-qr-demo`

## 什麼時候要匯出
- 你出國前先匯出一次
- 辦公室同事每次有重要更新後可再匯出一次
- 在清除瀏覽器資料、換電腦、換瀏覽器之前一定要先匯出

## 最簡單匯出方式

### 方法一：瀏覽器 Console 匯出
1. 在固定使用的那台電腦上，打開系統網站
2. 按 `F12` 開啟開發者工具
3. 切到 `Console`
4. 貼上下面這段：

```js
const key = 'hotel-partner-entry-qr-demo';
const raw = localStorage.getItem(key);
if (!raw) {
  console.log('找不到資料');
} else {
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hotel-partner-entry-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

5. 執行後會自動下載一個 `.json` 檔

## 備份檔案建議名稱
- `hotel-partner-entry-export-2026-04-13.json`
- 如果一天匯出多次，可加上時間：
  - `hotel-partner-entry-export-2026-04-13-1530.json`

## 建議備份位置
- 公司共用雲端資料夾
- OneDrive / Google Drive / 內部共享磁碟
- 不要只留在下載資料夾

## 匯出後怎麼確認成功
1. 找到剛下載的 `.json` 檔
2. 用記事本或 VS Code 打開
3. 應該會看到類似這樣的內容：

```json
[
  {
    "id": "...",
    "code": "...",
    "partnerName": "...",
    "totalQuota": 4,
    "usedQuota": 2,
    "remainingQuota": 2,
    "downloadCount": 1,
    "createdAt": "...",
    "expiresAt": "...",
    "disabled": false,
    "redemptions": []
  }
]
```

## 匯出資料包含什麼
- QR 編號
- 合作夥伴名稱
- 總可用人數
- 已使用人數
- 剩餘人數
- 下載次數
- 建立時間
- 到期時間
- 是否停用
- 核銷紀錄

## 之後正式上線時怎麼用
- 這份 JSON 之後可以作為匯入 `Supabase / PostgreSQL` 的原始資料
- 正式上線前，需要再做一次：
  - 欄位對應
  - 清洗資料
  - 匯入資料表

## 注意事項
- 這只是資料備份，不是正式資料庫
- 匯出後仍要避免清除瀏覽器資料，因為同事還在用目前這版
- 若換瀏覽器或換電腦，未匯出的資料可能會遺失

## 建議操作規則
1. 固定同一台電腦操作
2. 每次重要操作後定期匯出
3. 至少保留最近 3 份 JSON 備份
4. 命名要帶日期

## 給同事的簡短說法
```text
這版資料目前存在瀏覽器裡，不是正式資料庫。
如果要保留到之後正式上線，請定期把資料匯出成 JSON 備份。
```
