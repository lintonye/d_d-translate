import Arweave from "arweave";
import axios from "axios";

export async function uploadToKoii(
  walletAddress: string,
  dataBuffer: ArrayBuffer
) {
  const data = {
    name: "test",
    username: "testusername",
    dataBuffer,
  };
  const { txFee, tx, initialState } = await initializeArTx({
    walletAddress,
    data,
  });
  return await signArTx(tx, initialState);
}

/**
 *
 * @param {Function} fn Function to poll for result
 * @param {Number} timeout How long to poll for
 * @param {Number} interval Polling interval
 * @returns {Promise}
 */
const poll = (fn: any, timeout: any, interval: any) => {
  var endTime = Number(new Date()) + (timeout || 2000);
  interval = interval || 100;

  var checkCondition = function(resolve: any, reject: any) {
    // If the condition is met, we're done!
    var result = fn();
    if (result) {
      resolve(result);
    }
    // If the condition isn't met but the timeout hasn't elapsed, go again
    else if (Number(new Date()) < endTime) {
      setTimeout(checkCondition, interval, resolve, reject);
    }
    // Didn't match and too much time, reject!
    else {
      reject(new Error("timed out for " + fn + ": " + arguments));
    }
  };

  return new Promise(checkCondition);
};

const arweaveOptions = {
  host: "arweave.net", // Hostname or IP address for a Arweave host
  port: 443, // Port
  protocol: "https", // Network protocol http or https
  timeout: 20000, // Network request timeouts in milliseconds
  logging: false, // Enable network request logging
};

declare global {
  interface Window {
    koiiWallet?: any;
  }
}

/**
 * Initiates arweave object if on window or uses library otherwise
 * @returns Initiated arweave object
 */
async function initArweave() {
  let arweave: any;
  try {
    arweave = await poll(() => (Window as any).Arweave, 5000, 200);
  } catch (error) {
    arweave = Arweave;
  }
  arweave = new arweave(arweaveOptions);

  return arweave;
}

interface InitializeArTxProps {
  walletAddress: string;
  data: Record<string, any>;
}

const initializeArTx = async ({ walletAddress, data }: InitializeArTxProps) => {
  // init arweave
  let arweave = await initArweave();

  const balances: any = {};
  // How much is the user willing to pay to get % ownership
  balances[walletAddress] = 1;
  // Today's date
  const createdAt = Math.floor(new Date().getTime() / 1000).toString();
  // get data buffer from the uploaded file.
  const dataBuffer = data.dataBuffer;

  const initialState = {
    owner: walletAddress,
    title: data?.name,
    name: data?.username,
    description: data?.description,
    ticker: "KOINFT",
    balances,
    contentType: "text/html", //data?.file?.type,
    createdAt,
    tags: data?.tags?.split?.(",") || [],
  };
  // Create transaction
  let tx = await createArTx(dataBuffer, initialState);
  let txFee = await arweave.transactions.getPrice(tx.data_size);

  return {
    txFee,
    tx,
    initialState,
  };
};

/**
 *  Creates transaction and adds appropriate tags
 *
 * @param {object} dataBuffer Content Buffer Data
 * @param {object} initialState arweave state object
 *
 * @returns transaction with tags added
 */
export const createArTx = async (dataBuffer: any, initialState: any) => {
  // init arweave
  let arweave = await initArweave();
  let tx = await arweave.createTransaction({ data: dataBuffer });

  /* 
      now we add tags for the transaction
      only upload nft to Koii will require this set of tags
      others will have different tags
    */

  tx.addTag("Content-Type", initialState?.contentType);
  tx.addTag("Network", "Koii");
  tx.addTag("Action", "marketplace/Create");
  tx.addTag("App-Name", "D_D Translate");
  tx.addTag("App-Version", "0.3.0");
  tx.addTag("Contract-Src", "r_ibeOTHJW8McJvivPJjHxjMwkYfAKRjs-LjAeaBcLc");
  tx.addTag("Init-State", JSON.stringify(initialState));

  return tx;
};

/**
 *  Creates transaction and adds appropriate tags
 *
 * @param {object} tx arweave transaction
 * @param {object} initialState arweave state object
 * @param {File} media file to be uploaded
 *
 * @returns transaction with tags added
 */
const signArTx = async (tx: any, initialState: any) => {
  /* 
    First, we sign the transaction using Finnie.
  */
  await window.koiiWallet.sign(tx);

  /* 
    With a signed transaction, now we can upload it to the chain
  */
  await uploadArTx(tx);

  const body = {
    data: {
      ...initialState,
      id: tx.id,
    },
    // media,
  };

  /* 
    The last step is to register it into Koii using Finnie
  */
  await window.koiiWallet.registerData(tx.id);

  // await generateCardWithData(body);
  console.log(tx.id);

  return {
    tx: tx,
  };
};

/**
 *  Creates transaction and adds appropriate tags
 *
 * @param {object} tx arweave transaction
 *
 * @returns transaction with tags added
 */
const uploadArTx = async (tx: any) => {
  // init arweave
  let arweave = await initArweave();
  let uploader;
  uploader = await arweave.transactions.getUploader(tx);

  while (!uploader.isComplete) {
    await uploader.uploadChunk();
  }
};

export const generateCardWithData = async (body: any) => {
  return await axios.post(`https://api.koii.live/generateCardWithData`, body, {
    transformRequest: (data: any, headers: any) => {
      headers.common["Access-Control-Allow-Origin"] = "*";
      return data;
    },
    baseURL: undefined,
  });
  // const response = await fetch(`https://api.koii.live/generateCardWithData`, {
  //   method: "POST",
  //   headers: {
  //     "Access-Control-Allow-Origin": "*",
  //   },
  //   body,
  // });
  // return response;
};
