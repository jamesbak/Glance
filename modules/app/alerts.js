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

import document from "document";
import { vibration } from "haptics";
import Transfer from "./transfer.js";

import DateTime from "./dateTime.js";

const transfer = new Transfer();

let sgv = document.getElementById("sgv");
let largeGraphsSgv = document.getElementById("largeGraphsSgv");
let errorLine = document.getElementById("errorLine");
// let largeGraphErrorLine = document.getElementById("largeGraphErrorLine");

const dateTime = new DateTime();

export default class alerts {
  check(bg, settings, DISABLE_ALERTS, timeSenseLastSGV) {
    let currentBG = bg.currentbg;
    let loopstatus = bg.loopstatus;
    let staleData =
      parseInt(timeSenseLastSGV, 10) >= settings.staleDataAlertAfter; // Boolean true if  timeSenseLastSGV > 15

    console.log("app - Alerts - Check()");
    sgv.style.fill = "#75bd78";
    largeGraphsSgv.style.fill = "#75bd78";
    errorLine.style.fill = "#75bd78";
    // largeGraphErrorLine.style.fill ="#75bd78";

    let timeSenseLastSGV = dateTime.getTimeSenseLastSGV(bg.datetime)[1];
    if (bg.sgv <= parseInt(settings.lowThreshold) && !staleData) {
      sgv.style.fill = "#de4430";
      largeGraphsSgv.style.fill = "#de4430";

      popupTitle.style.fill = "#de4430";
      errorLine.style.fill = "#de4430";
      // largeGraphErrorLine.style.fill ="#de4430";
    }
    if (bg.sgv >= parseInt(settings.highThreshold) && !staleData) {
      sgv.style.fill = "orange";
      largeGraphsSgv.style.fill = "orange";

      popupTitle.style.fill = "orange";
      errorLine.style.fill = "orange";
      // largeGraphErrorLine.style.fill ="orange";
      if (bg.sgv >= parseInt(settings.highThreshold) + 35) {
        sgv.style.fill = "#de4430";
        largeGraphsSgv.style.fill = "#de4430";
        popupTitle.style.fill = "#de4430";
        errorLine.style.fill = "#de4430";
        // largeGraphErrorLine.style.fill ="#de4430";
      }
    }

    /**
     * loopstatus
     */
    // Check for rapid change in bg
  }
  stop() {
    console.log("app - Alerts - stop()");
    vibration.stop();
  }
}
