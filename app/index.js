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
import { readFileSync } from "fs";
import { vibration } from "haptics";
import { clock } from "clock";
import { HeartRateSensor } from "heart-rate";
import { display } from "display";
import { today } from 'user-activity';
import { charger } from "power";
import { memory } from "system";
import { preferences } from "user-settings";
import DateTime from "../modules/app/dateTime.js";
import BatteryLevels from "../modules/app/batteryLevels.js";
import Graph from "../modules/app/bloodline.js";
import Alerts from "../modules/app/alerts.js";
import Errors from "../modules/app/errors.js";
import Transfer from "../modules/app/transfer.js";
import Utils from "../modules/app/util.js"

const dateTime = new DateTime();
const batteryLevels = new BatteryLevels();
const graph = new Graph();
const alerts = new Alerts();
const errors = new Errors();
const transfer = new Transfer();

let main = document.getElementById("main");
let sgv = document.getElementById("sgv");
let largeGraphsSgv = document.getElementById("largeGraphsSgv");
let largeGraphDelta = document.getElementById("largeGraphDelta");
let timeOfLastSgv = document.getElementById("timeOfLastSgv");
let largeGraphTimeOfLastSgv = document.getElementById("largeGraphTimeOfLastSgv");

let dateElement = document.getElementById("date");
let timeHour = document.getElementById("time-hour");
let timeMinute = document.getElementById("time-minute");
let largeGraphTime = document.getElementById("largeGraphTime");
let arrows = document.getElementById("arrows");
let largeGraphArrows = document.getElementById("largeGraphArrows");
let batteryImage = document.getElementById("battery-image");
let batteryLevel = document.getElementById("battery-level");
let steps = document.getElementById("steps");
let heart = document.getElementById("heart");
let calories = document.getElementById("calories");
let bgColor = document.getElementById("bgColor");
let largeGraphBgColor = document.getElementById("largeGraphBgColor");
let batteryPercent = document.getElementById("batteryPercent");
let errorText = document.getElementById("error");
let goToLargeGraph = document.getElementById("goToLargeGraph");

let largeGraphView = document.getElementById("largeGraphView");
let exitLargeGraph = document.getElementById("exitLargeGraph");

let dismissHighFor = 120;
let dismissLowFor = 15;

// Data received from companion app
let dataFromCompanion = null;

// Data to send back to phone
let dataToSend = {
  heart: 0,
  steps: today.adjusted.steps,
};
let lastSGVTime = null;

sgv.text = "---";
largeGraphDelta.text = "";
timeOfLastSgv.text = "";
batteryPercent.text = "%";

// Setup change event for all non-BG metrics
// Clock - steps & calories are also refreshed on this event
clock.granularity = "seconds";
clock.ontick = (evt) => {
  updateNonBgMetrics(evt.date, false);
}
charger.onchange = (evt) => {
  updateBattery();
}
// Heart rate sensor
const hrm = new HeartRateSensor({ frequency: 1 });
hrm.addEventListener("reading", () => updateHeartRate(hrm.heartRate));
hrm.start();
// Turn some metrics off when the display isn't on
display.addEventListener("change", () => updateDisplayStatus());

// Data received from companion app
inbox.onnewfile = () => {
  console.log("New file!");
  let fileName;
  do {
    // If there is a file, move it from staging into the application folder
    fileName = inbox.nextFile();
    console.log("Data file: " + fileName);
    if (fileName) {
      dataFromCompanion = readFileSync(fileName, "cbor");
      update(dataFromCompanion);
    }
  } while (fileName);
};
// User interaction - force refresh & show graph
timeHour.onclick = forceRefresh;
timeMinute.onclick = forceRefresh;
largeGraphTime.onclick = forceRefresh;
largeGraphsSgv.onclick = forceRefresh;

goToLargeGraph.onclick = showLargeGraph;
exitLargeGraph.onclick = hideLargeGraph;

updateNonBgMetrics(new Date(), true);
// Timed refresh
// wait 1 seconds
setTimeout(() => transfer.send(dataToSend), 1000);
// Refresh BSL every 5 minutes
setInterval(() => transfer.send(dataToSend), 300000);

function update(data) {
  console.log("app - update()");
  console.warn("JS memory: " + memory.js.used + "/" + memory.js.total);

  // Data to send back to phone
  dataToSend = {
    heart: hrm.heartRate,
    steps: today.adjusted.steps,
  };

  if (data) {
    console.warn("GOT DATA");

    dismissHighFor = data.settings.dismissHighFor;
    dismissLowFor = data.settings.dismissLowFor;

    // colors
    bgColor.gradient.colors.c1 = data.settings.bgColor;
    bgColor.gradient.colors.c2 = data.settings.bgColorTwo;

    largeGraphBgColor.gradient.colors.c1 = data.settings.bgColor;
    largeGraphBgColor.gradient.colors.c2 = data.settings.bgColorTwo;

    // bloodsugars
    let currentBgFromBloodSugars = getFistBgNonpredictiveBG(data.bloodSugars.bgs);

    sgv.text = currentBgFromBloodSugars.currentbg;
    largeGraphsSgv.text = currentBgFromBloodSugars.currentbg;
    let deltaText = currentBgFromBloodSugars.bgdelta;
    // add Plus
    if (deltaText > 0) {
      deltaText = "+" + deltaText;
    }
    largeGraphDelta.text = deltaText + " " + data.settings.glucoseUnits;
    lastSGVTime = currentBgFromBloodSugars.datetime;
    let lastBGTimespan = updateLastBGTime();
    alerts.check(
      currentBgFromBloodSugars,
      data.settings,
      true,
      lastBGTimespan
    );

    arrows.href = "../resources/img/arrows/" + currentBgFromBloodSugars.direction + ".png";
    largeGraphArrows.href = "../resources/img/arrows/" + currentBgFromBloodSugars.direction + ".png";

    graph.update(
      data.bloodSugars.bgs,
      data.settings.highThreshold,
      data.settings.lowThreshold,
      data.settings,
      preferences.clockDisplay
    );
  } else {
    console.warn("NO DATA");
  }
}

let currentSteps = 0;
let currentCalories = 0;
function updateNonBgMetrics(date, force) {
  if (force || date.getSeconds() % 10 == 0) {
    console.log("app - updating clock");
    updateClock(date);
    updateBattery();
    updateLastBGTime();
  }
  if (force || today.adjusted.steps != currentSteps) {
    console.log("app - updating steps");
    updateSteps(today.adjusted.steps);
    currentSteps = today.adjusted.steps;
  }
  if (force || today.adjusted.calories != currentCalories) {
    console.log("app - updating calories");
    updateCalories(today.adjusted.calories);
    currentCalories = today.adjusted.calories;
  }
}

function updateClock(date) {
  console.log("app - updateClock()");
  timeHour.text = Utils.monoDigits(dateTime.getHour(date));
  timeMinute.text = Utils.monoDigits(date.getMinutes());
  largeGraphTime.text = dateTime.getTime(date, preferences.clockDisplay);
  dateElement.text = dateTime.getDate(date, null, true);
}

function updateDisplayStatus() {
  // Automatically stop the sensor when the screen is off to conserve battery
  display.on ? hrm.start() : hrm.stop();
  clock.granularity = display.on ? "seconds" : "off";
  // Refresh the display now
  if (display.on) {
    updateNonBgMetrics(new Date(), true);
  }
}

function updateHeartRate(heartrate) {
  console.log("app - updateHeartRate()");
  if (heartrate) {
    heart.text = heartrate;
  }
}

function updateCalories(calorieCount) {
  calories.text = Utils.commas(calorieCount);
}

function updateSteps(stepCount) {
  steps.text = Utils.commas(stepCount);
}

let chargerActive = false;
function updateBattery() {
  var battery = batteryLevels.get();

  if (battery.charger != chargerActive) {
    console.warn("Charger state: " + battery.charger);
    batteryImage.href = battery.charger ? "../resources/img/charger.png" : "../resources/img/battery.png";
    batteryLevel.style.display = battery.charger ? "none" : "inline";
    chargerActive = battery.charger;
  }
  if (!battery.charger) {
    batteryLevel.width = battery.level;
    batteryLevel.style.fill = battery.color;
  }
  batteryPercent.text = "" + battery.percent + "%";
}

function updateLastBGTime() {
  if (lastSGVTime) {
    let lastBGTimeParts = dateTime.getTimeSenseLastSGV(lastSGVTime);
    timeOfLastSgv.text = lastBGTimeParts[0];
    errors.check(lastBGTimeParts[1]);
    return lastBGTimeParts[1];
  }
  return 0;
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

let hideGraphTimer = 0;

function resetHideGraphTimer(restart = true) {
  console.log("app - **** resetHideGraphTimer ***");
  if (hideGraphTimer) {
    clearTimeout(hideGraphTimer);
    hideGraphTimer = 0;
    console.log("app - **** timer is canceled ***");
  }
  if (restart) {
    hideGraphTimer = setTimeout(hideLargeGraph, 10000);
    console.log("app - **** new timer: " + hideGraphTimer);
  }
}

function forceRefresh(e) {
  console.log("FORCE Activated!");
  transfer.send(dataToSend);
  vibration.start("bump");
  arrows.href = "../resources/img/arrows/loading.png";
  largeGraphArrows.href = "../resources/img/arrows/loading.png";
  resetHideGraphTimer();
}

function showLargeGraph() {
  console.log("goToLargeGraph Activated!");
  vibration.start("bump");
  largeGraphView.style.display = "inline";
  main.style.display = "none";
  goToLargeGraph.style.display = "none";
  resetHideGraphTimer();
}

function hideLargeGraph() {
  console.log("exitLargeGraph Activated!");
  vibration.start("bump");
  largeGraphView.style.display = "none";
  main.style.display = "inline";
  goToLargeGraph.style.display = "inline";
  resetHideGraphTimer(false);
}

