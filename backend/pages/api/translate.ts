// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

type Identifier = {
  id: string;
  lang: string;
  url: string;
};

type Output = Identifier & {
  text: string;
  translatedText: string;
};

type AirtableResult = {
  records: any[];
};

const allowCors =
  (fn: (req: NextApiRequest, res: NextApiResponse) => void) =>
  async (req: NextApiRequest, res: NextApiResponse<Output>) => {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    // another common pattern
    // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,OPTIONS,PATCH,DELETE,POST,PUT"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }
    return await fn(req, res);
  };

async function getStoredTranslation({ url, id, lang }: Identifier) {
  let filterFormula = encodeURI(`AND(id="${id}",url="${url}")`);
  let res = await fetch(
    `https://api.airtable.com/v0/appE68bKx87nVgN8W/${lang}?filterByFormula=${filterFormula}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    }
  );
  let data = (await res.json()) as AirtableResult;
  console.log("Get from Airtable:", res.status, data);
  if (typeof data === "object" && data.records?.length > 0) {
    console.log("Found in Airtable:", data.records[0].fields.translatedText);
    return data.records[0].fields.translatedText;
  } else return null;
}

async function translate(text: string, lang: string) {
  let res = await fetch(
    `https://api-free.deepl.com/v2/translate?target_lang=${lang}&auth_key=${process.env.DEEPL_AUTH_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `text=${encodeURIComponent(text)}`,
    }
  );
  let data = (await res.json()) as any;
  if ("translations" in data) {
    let translatedText = data.translations[0].text;
    return translatedText;
  } else return null;
}

async function translateAndStoreText(
  { url, id, lang }: Identifier,
  text: string
) {
  let translatedText = await translate(text, lang);
  let res = await fetch(
    `https://api.airtable.com/v0/appE68bKx87nVgN8W/${lang}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              id,
              englishText: text,
              translatedText,
              url,
            },
          },
        ],
      }),
    }
  );
  console.log("Insert into Airtable:", res.status);
  return translatedText;
}

async function handler(req: NextApiRequest, res: NextApiResponse<Output>) {
  let { id, lang, text, url } = req.body;
  let translatedText = await getStoredTranslation({ url, id, lang });
  console.log({ translatedText });
  if (!translatedText) {
    translatedText = await translateAndStoreText({ url, id, lang }, text);
  }
  res.status(200).json({ id, text, lang, url, translatedText });
}

export default allowCors(handler);
