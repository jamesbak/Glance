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
import { inbox } from "file-transfer";
import fs from "fs";
import { vibration } from "haptics";
import DateTime from "../modules/app/dateTime.js";
import BatteryLevels from "../modules/app/batteryLevels.js";
import Graph from "../modules/app/bloodline.js";
import UserActivity from "../modules/app/userActivity.js";
import Alerts from "../modules/app/alerts.js";
import Errors from "../modules/app/errors.js";
import Transfer from "../modules/app/transfer.js";
import { memory } from "system";
import { preferences } from "user-settings";

const dateTime = new DateTime();
const batteryLevels = new BatteryLevels();
const graph = new Graph();
const userActivity = new UserActivity();
const alerts = new Alerts();
const errors = new Errors();
const transfer = new Transfer();

let main = document.getElementById("main");
let sgv = document.getElementById("sgv");
let rawbg = document.getElementById("rawbg");
let tempBasal = document.getElementById("tempBasal");
let largeGraphsSgv = document.getElementById("largeGraphsSgv");
let largeGraphDelta = document.getElementById("largeGraphDelta");
let timeOfLastSgv = document.getElementById("timeOfLastSgv");
let largeGraphTimeOfLastSgv = document.getElementById("largeGraphTimeOfLastSgv");
let calories = document.getElementById("calories");

let dateElement = document.getElementById("date");
let timeElement = document.getElementById("time");
let largeGraphTime = document.getElementById("largeGraphTime");
let weather = document.getElementById("weather");
let arrows = document.getElementById("arrows");
let largeGraphArrows = document.getElementById("largeGraphArrows");
let batteryLevel = document.getElementById("battery-level");
let steps = document.getElementById("steps");
let stepIcon = document.getElementById("stepIcon");
let heart = document.getElementById("heart");
let heartIcon = document.getElementById("heartIcon");
let bgColor = document.getElementById("bgColor");
let largeGraphBgColor = document.getElementById("largeGraphBgColor");
let batteryPercent = document.getElementById("batteryPercent");
let errorText = document.getElementById("error");
let degreeIcon = document.getElementById("degreeIcon");
let goToLargeGraph = document.getElementById("goToLargeGraph");

let largeGraphLoopStatus = document.getElementById("largeGraphLoopStatus");
let largeGraphView = document.getElementById("largeGraphView");
let exitLargeGraph = document.getElementById("exitLargeGraph");

let largeGraphSyringe = document.getElementById("largeGraphSyringe");
let largeGraphHamburger = document.getElementById("largeGraphHamburger");
let syringe = document.getElementById("syringe");
let caloriesIcon = document.getElementById("caloriesIcon");
let predictedBg = document.getElementById("predictedBg");

let dismissHighFor = 120;
let dismissLowFor = 15;

let data = null;

// Data to send back to phone
let dataToSend = {
  heart: 0,
  steps: userActivity.get().steps,
};

sgv.text = "---";
rawbg.text = "";
largeGraphDelta.text = "";
calories.text = "--";
dateElement.text = "";
timeOfLastSgv.text = "";
weather.text = "--";
steps.text = "--";
heart.text = "--";
batteryPercent.text = "%";
bgColor.gradient.colors.c1 = "#390263";
largeGraphBgColor.gradient.colors.c1 = "#390263";
errorText.text = "";
update();
setInterval(update, 10000);

inbox.onnewfile = () => {
  console.log("New file!");
  let fileName;
  do {
    // If there is a file, move it from staging into the application folder
    fileName = inbox.nextFile();
    if (fileName) {
      data = fs.readFileSync(fileName, "cbor");
      update();
    }
  } while (fileName);
};

function update() {
  console.log("app - update()");
  console.warn("JS memory: " + memory.js.used + "/" + memory.js.total);
  let heartrate = userActivity.get().heartRate;
  if (!heartrate) {
    heartrate = 0;
  }
  var battery = batteryLevels.get();
  batteryLevel.width = battery.level;
  batteryLevel.style.fill = battery.color;
  batteryPercent.text = "" + battery.percent + "%";
  timeElement.text = dateTime.getTime(preferences.clockDisplay);
  largeGraphTime.text = dateTime.getTime(preferences.clockDisplay);
  dateElement.text = dateTime.getDate(null, true);

  calories.text = commas(userActivity.get().calories);
  steps.text = commas(userActivity.get().steps);
  heart.text = userActivity.get().heartRate;

  // Data to send back to phone
  dataToSend = {
    heart: heartrate,
    steps: userActivity.get().steps,
  };

  if (data) {
    console.warn("GOT DATA");

    dismissHighFor = data.settings.dismissHighFor;
    dismissLowFor = data.settings.dismissLowFor;
    weather.text = ""; // data.weather.temp;
    degreeIcon.style.display = "none";

    // colors
    bgColor.gradient.colors.c1 = data.settings.bgColor;
    bgColor.gradient.colors.c2 = data.settings.bgColorTwo;

    largeGraphBgColor.gradient.colors.c1 = data.settings.bgColor;
    largeGraphBgColor.gradient.colors.c2 = data.settings.bgColorTwo;

    setTextColor(data.settings.textColor);
    // bloodsugars
    let currentBgFromBloodSugars = getFistBgNonpredictiveBG(
      data.bloodSugars.bgs
    );

    // Layout options
    sgv.text = currentBgFromBloodSugars.currentbg;
    largeGraphsSgv.text = currentBgFromBloodSugars.currentbg;
    if (currentBgFromBloodSugars.rawbg) {
      rawbg.text = currentBgFromBloodSugars.rawbg + " ";
    } else {
      rawbg.text = "";
    }

    if (currentBgFromBloodSugars.tempbasal) {
      tempBasal.text = currentBgFromBloodSugars.tempbasal;
    } else {
      tempBasal.text = "";
    }

    if (currentBgFromBloodSugars.predictedbg) {
      predictedBg.text = currentBgFromBloodSugars.predictedbg;
    } else {
      predictedBg.text = "";
    }

    timeOfLastSgv.text = dateTime.getTimeSenseLastSGV(
      currentBgFromBloodSugars.datetime
    )[0];
    largeGraphTimeOfLastSgv.text = dateTime.getTimeSenseLastSGV(
      currentBgFromBloodSugars.datetime
    )[0];

    let timeSenseLastSGV = dateTime.getTimeSenseLastSGV(
      currentBgFromBloodSugars.datetime
    )[1];

    alerts.check(
      currentBgFromBloodSugars,
      data.settings,
      true,
      timeSenseLastSGV
    );

    errors.check(timeSenseLastSGV, currentBgFromBloodSugars.currentbg);
    let deltaText = currentBgFromBloodSugars.bgdelta;
    // add Plus
    if (deltaText > 0) {
      deltaText = "+" + deltaText;
    }
    largeGraphDelta.text = deltaText + " " + data.settings.glucoseUnits;
    largeGraphLoopStatus.text = ""; // currentBgFromBloodSugars.loopstatus;

    arrows.href =
      "../resources/img/arrows/" + currentBgFromBloodSugars.direction + ".png";
    largeGraphArrows.href =
      "../resources/img/arrows/" + currentBgFromBloodSugars.direction + ".png";

    graph.update(
      data.bloodSugars.bgs,
      data.settings.highThreshold,
      data.settings.lowThreshold,
      data.settings
    );

    if (data.settings.largeGraph) {
      goToLargeGraph.style.display = "inline";
    } else {
      goToLargeGraph.style.display = "none";
    }
    // if (data.settings.treatments) {
    //   goToTreatment.style.display = "inline";
    // } else {
    //   goToTreatment.style.display = "none";
    // }
  } else {
    console.warn("NO DATA");
    steps.text = commas(userActivity.get().steps);
    heart.text = userActivity.get().heartRate;
    batteryLevel.width = batteryLevels.get().level;
    batteryPercent.text = "" + batteryLevels.get().percent + "%";
  }
}

function commas(value) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
/**
 * Get Fist BG that is not a predictive BG
 * @param {Array} bgs
 * @returns {Array}
 */
function getFistBgNonpredictiveBG(bgs) {
  return bgs.filter((bg) => {
    if (bg.bgdelta || bg.bgdelta === 0) {
      return true;
    }
  })[0];
}

function setTextColor(color) {
  let domElemets = [
    "calories",
    "heart",
    "steps",
    "batteryPercent",
    "date",
    "timeOfLastSgv",
    "time",
    "high",
    "low",
    "largeGraphHigh",
    "largeGraphLow",
    "largeGraphDelta",
    "largeGraphTimeOfLastSgv",
    "predictedBg",
    "largeGraphTime",
    "largeGraphLoopStatus",
    "tempBasal",
  ];
  domElemets.forEach((ele) => {
    document.getElementById(ele).style.fill = color;
  });
}

goToLargeGraph.onclick = (e) => {
  console.log("goToLargeGraph Activated!");
  vibration.start("bump");
  largeGraphView.style.display = "inline";
  main.style.display = "none";
};

exitLargeGraph.onclick = (e) => {
  console.log("exitLargeGraph Activated!");
  vibration.start("bump");
  largeGraphView.style.display = "none";
  main.style.display = "inline";
};

timeElement.onclick = (e) => {
  console.log("FORCE Activated!");
  transfer.send(dataToSend);
  vibration.start("bump");
  arrows.href = "../resources/img/arrows/loading.png";
  largeGraphArrows.href = "../resources/img/arrows/loading.png";
  alertArrows.href = "../resources/img/arrows/loading.png";
};

// wait 2 seconds
setTimeout(function () {
  transfer.send(dataToSend);
}, 1500);
setInterval(function () {
  transfer.send(dataToSend);
}, 180000);

//<div>Icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/designerz-base" title="Designerz Base">Designerz Base</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/twitter" title="Twitter">Twitter</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>
