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

import { preferences, locale } from "user-settings";

export default class dateTime {
  getDate(date, dateFormat, enableDOW) {
    if (date == null) {
      date = new Date();
    }
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let day = ("0" + date.getDate()).slice(-2);
    let year = date.getFullYear();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    if (enableDOW) {
      year = year.toString().substr(-2);
    }

    let shortDate = month + "/" + day + "/" + year;

    if (dateFormat) {
      if (dateFormat == "DD/MM/YYYY") {
        shortDate = day + "/" + month + "/" + year;
      } else if (dateFormat == "YYYY/MM/DD") {
        shortDate = year + "/" + month + "/" + day;
      } else if (dateFormat == "DD.MM.YYYY") {
        shortDate = day + "." + month + "." + year;
      }
    }

    if (enableDOW) {
      shortDate += " " + days[date.getDay()];
    }
    return shortDate;
  }

  getTimeNow(timeFormat) {
    return this.getTime(Date.now(), timeFormat);
  }

  getTime(value, timeFormat) {
    var time = new Date(value);
    var hh = time.getHours();
    var mm = time.getMinutes();
    var suffix = "";
    var hourPad = 0;
    if (timeFormat === "12h") {
      suffix = hh >= 12 ? " PM" : " AM";
      hh = hh % 12 || 12;
    } else {
      hh = ("0" + hh).slice(-2);
    }
    var ret = hh + ":" + ("0" + mm).slice(-2) + suffix;
    return ret;
  }

  getHour(date) {
    if (date == null) {
      date = new Date();
    }
    var hh = date.getHours();
    if (preferences.clockDisplay === "12h") {
      hh = hh % 12 || 12;
    }
    return hh;
  }

  getMinute(date) {
    if (date == null) {
      date = new Date();
    }
    var mm = date.getMinutes();
    return ("0" + mm).slice(-2);
  }

  getTimeSenseLastSGV(sgvDateTime) {
    let currentTime = new Date();
    let lastSGVTime = new Date(sgvDateTime);
    let secondsDiff = (currentTime.getTime() - lastSGVTime.getTime()) / 1000;
    let timeSense = "";
    let timeSenseNumber = "";
    if (secondsDiff > 86400) {
      timeSense = "~" + Math.floor(secondsDiff / 86400) + "D";
      timeSenseNumber = Math.floor(secondsDiff / 60);
    } else if (secondsDiff > 3600) {
      timeSense = "~" + Math.floor(secondsDiff / 3600) + "h";
      timeSenseNumber = Math.floor(secondsDiff / 60);
    } else if (secondsDiff > 0) {
      timeSense = Math.floor(secondsDiff / 60) + " min";
      timeSenseNumber = Math.floor(secondsDiff / 60);
    }
    return [timeSense, timeSenseNumber];
  }
}
