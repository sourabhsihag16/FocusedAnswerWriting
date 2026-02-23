# Daily questions from Google Spreadsheet

## 1. Use the sample file

- Open **`sample-daily-questions.csv`** (in this folder).
- Copy its contents or upload it to Google Sheets.

## 2. Column format

| Column    | Description                    | Example        |
|----------|--------------------------------|----------------|
| **Date** | Date for that day (YYYY-MM-DD) | 2025-02-24     |
| **Question 1** | First question text for the day | Your question… |
| **Question 2** | Second question text for the day | Your question… |

- Keep the **header row** (Date, Question 1, Question 2).
- Use **one row per day**. Dates can be in any order, but the app looks up the row whose date equals **today**.
- Add new rows for future days; the app will show the row that matches today’s date.

## 3. Publish as CSV and get the URL

1. In Google Sheets: **File → Share → Publish to web**.
2. Choose the sheet (or “Entire document”) and **CSV** as the format.
3. Click **Publish** and copy the link.

   Or build the URL yourself:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0
   ```
   (Find `YOUR_SHEET_ID` in the sheet’s URL; `gid=0` is usually the first sheet.)

4. Set in your backend env:
   ```bash
   QUESTIONS_CSV_URL="<paste the CSV URL here>"
   ```

## 4. Adding new entries

- Add a new row with:
  - **Date**: e.g. `2025-03-10`
  - **Question 1**: full question text
  - **Question 2**: full question text
- Save. The published CSV URL does not change; the app fetches fresh data when users load today’s questions.

## 5. Tips

- Use **YYYY-MM-DD** for dates (e.g. 2025-03-15). The app also tries formats like `M/D/YYYY` and `DD-MM-YYYY`.
- Avoid commas inside a cell, or wrap the cell content in double quotes so CSV parsing stays correct.
- If today’s date has no row, the API will return an error; add a row for today to fix it.
