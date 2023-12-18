/*
 * Copyright (C) 2018 Ryan Mason - All Rights Reserved
 *
 * Permissions of this strong copyleft license are conditioned on making available complete source code of licensed works and modifications, which include larger works using a licensed work, under the same license. Copyright and license notices must be preserved. Contributors provide an express grant of patent rights.
 *
 * https://github.com/Rytiggy/Glance/blob/master/LICENSE
 * ------------------------------------------------
 *
 * You are free to modify the code but please leave the copyright in the header.
 *
 * ------------------------------------------------
 */

import { me } from "companion";
import { inbox } from "file-transfer";

import Settings from "../modules/companion/settings.js";
import Transfer from "../modules/companion/transfer.js";
import Fetch from "../modules/companion/fetch.js";
import Standardize from "../modules/companion/standardize.js";
import Logs from "../modules/companion/logs.js";
import Sizeof from "../modules/companion/sizeof.js";
import Dexcom from "../modules/companion/dexcom.js";

const settings = new Settings();
const transfer = new Transfer();
const standardize = new Standardize();
const dexcom = new Dexcom();

const logs = new Logs();
const sizeof = new Sizeof();

console.log("Starting companion app. Launch reason: " + getLaunchReasons(me.launchReasons));
const WAKE_INTERVAL = 5 * 60 * 1000;
me.wakeInterval = WAKE_INTERVAL;

async function sendData() {
  // Get settings
  const store = settings.get();

  // Get SGV data
  let bloodsugars = null;
  try {
    if (store.url === "dexcom") {
      let USAVSInternational = store.USAVSInternational;
      let subDomain = "share2";
      if (USAVSInternational) {
        subDomain = "shareous1";
      }
      let dexcomUsername = store.dexcomUsername
        ? store.dexcomUsername.replace(/\s+/g, "")
        : "";
      let dexcomPassword = store.dexcomPassword
        ? store.dexcomPassword.replace(/\s+/g, "")
        : "";
      if (dexcomUsername && dexcomPassword) {
        let sessionId = await dexcom.getSessionId(
          dexcomUsername,
          dexcomPassword,
          subDomain
        );
        bloodsugars = await dexcom.getData(sessionId, subDomain);
      }
    }
  }
  catch (e) {
    console.error("Error retrieving lastest BSL values. ", e);
  }
  if (!bloodsugars) {
    bloodsugars = {
      error: {
        status: "500",
      }
    };
  }
  // Send the results to watch
  let dataToSend = {
    bloodSugars: standardize.bloodsugars(bloodsugars, null, store),
    settings: standardize.settings(store),
  };
  await transfer.send(dataToSend);
}

function getLaunchReasons(launchReasons) {
  let reasons = [];
  if (launchReasons.fileTransfer) {
    reasons.push("file-transfer");
  }
  if (launchReasons.peerAppLaunched) {
    reasons.push("clock-face-launch");
  }
  if (launchReasons.settingsChanged) {
    reasons.push("settings-changed");
  }
  if (launchReasons.wokenUp) {
    reasons.push("wake-up");
  }
  return reasons.join(", ");
}

inbox.onnewfile = processRequest;
me.onwakeinterval = async () => {
  console.log("Companion app wake interval.");
  await processRequest();
}

async function processRequest() {
  let fileItem = await inbox.pop();
  if (fileItem) {
    console.log(`New file received from app: ${fileItem.name}`);
    let data = await fileItem.cbor();
    console.log(JSON.stringify(data));
    try {
      await sendData();
    }
    catch (e) {
      console.error("Error retrieving latest BSL and sending to watch.", e);
    }
    // Drain the queue
    while (fileItem) {
      fileItem = await inbox.pop();
    }
  }
}

