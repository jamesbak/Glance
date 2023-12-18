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
import Logs from "./logs.js";
const logs = new Logs();

const applicationId = "d8665ade-9673-4e27-9ff6-92db4ce13d13";

export default class dexcom {
  async login(dexcomUsername, dexcomPassword, subDomain) {
    console.log("Logging into Dexcom API");
    let err = null;
    try {
      let body = {
        accountName: dexcomUsername,
        applicationId: applicationId,
        password: dexcomPassword,
      };
      let response = await fetch(
        `https://${subDomain}.dexcom.com/ShareWebServices/Services/General/AuthenticatePublisherAccount`,
        {
          body: JSON.stringify(body),
          json: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "post",
          rejectUnauthorized: false,
        });
      console.log("Response received from login operation to Dexcom API");
      if (response.ok) {
        return (await response.text()).replace(/['"]+/g, '')
      }
      err = new Error("Error from Dexcom login operation: " + JSON.stringify(await response.json()));
    }
    catch (e) {
      console.error("Error logging in to Dexcom API.", e);
      throw e;
    }
    throw err;
  }

  async getSessionId(dexcomUsername, dexcomPassword, subDomain) {
    let accountId = await this.login(dexcomUsername, dexcomPassword, subDomain);
    console.log(`Dexcom account id: ${accountId}`);
    if (!accountId) {
      return undefined;
    }

    let err = null;
    try {
      console.log("Fetching session id from Dexcom API");
      let body = {
        password: dexcomPassword,
        applicationId: applicationId,
        accountId: accountId,
      };
      let url = `https://${subDomain}.dexcom.com/ShareWebServices/Services/General/LoginPublisherAccountById`;
      let response = await fetch(url, {
          body: JSON.stringify(body),
          json: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "post",
          rejectUnauthorized: false,
        });
      console.log(`Response received from getsessionid from Dexcom API. Status: ${response.status}`);
      if (response.ok) {
        let sessionId = await response.text();
        console.log(`Dexcom session id: ${sessionId}`);
        return sessionId;
      }
      err = new Error("Error received from Dexcom getsessionid operation: " + JSON.stringify(await response.json()));
    }
    catch (e) {
      console.error("Dexcom getsessionid error: ", e);
      throw e;
    }
    throw err;
  }

  async getData(sessionId, subDomain) {
    if (!sessionId) {
      throw new Error("Invalid session id.");
    }
    let err = null;
    try {
      console.log("Fetching latest BSL values from Dexcom API");
      let url =
      `https://${subDomain}.dexcom.com/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues?sessionId=${sessionId}&minutes=1440&maxCount=47`.replace(
        /"/g,
        ""
      );
      let response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "post",
      });
      console.log(`Response received from getlatestvalue from Dexcom API. Status: ${response.status}`);
      if (response.ok) {
        return await response.json();
      }
      err = new Error("Error recevied form Dexcom getlastestvalues operaton: " + JSON.stringify(await response.json()));
    }
    catch (e) {
      console.error("Dexcom get latest glucose values error: ", e);
      throw e;
    }
    throw err;
  }
}
