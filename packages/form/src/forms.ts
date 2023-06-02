import { FORMS_API_HOST, FORMS_ID } from './config';

// References:
// https://developers.google.com/sheets/api/reference/rest
// https://developers.google.com/sheets/api/guides/concepts#cell
// https://developers.google.com/sheets/api/guides/migration#delete_a_row
export async function formResponse(token: string) {
  const fullUrl = `https://sheets.googleapis.com/v4/spreadsheets/${'1pb_V0z6tmGJVI3A1s70JHpngcyrZsaF7qjuBCrL5xTA'}`;
  const url = new URL(fullUrl);
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const spreadsheet = await response.json();
  const sheetId = spreadsheet?.sheets[0]?.properties?.sheetId;

  // test deletion of a row in google sheets: WORKING!
  const response2 = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${'1pb_V0z6tmGJVI3A1s70JHpngcyrZsaF7qjuBCrL5xTA'}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: 1,
                endIndex: 2,
              },
            },
          },
        ],
      }),
    }
  );
  console.log(await response2.json());
}
