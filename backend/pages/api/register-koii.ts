// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";
import { Node } from "@_koi/sdk/node";

const ktools = new Node();

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

type Output =
  | {
      arTxId: string;
      koiiTxId: string;
    }
  | { message: string };

async function registerOnKoii(walletAddress: string, txId: string) {
  console.log("ktools loading wallet...");
  const jwk = await ktools.loadFile("./arweave-key.json");
  await ktools.loadWallet(jwk);
  console.log("ktools burning koii attention...");
  const koiiTxId = await ktools.burnKoiAttention(txId);
  return koiiTxId;
}

async function handler(req: NextApiRequest, res: NextApiResponse<Output>) {
  let { walletAddress, arTxId } = req.query;
  console.log({ walletAddress, arTxId });
  if (typeof walletAddress === "string" && typeof arTxId === "string") {
    const koiiTxId = await registerOnKoii(walletAddress, arTxId);
    res.status(200).json({ arTxId, koiiTxId });
  } else {
    res.status(500).json({ message: "Invalid parameters" });
  }
}

export default allowCors(handler);
