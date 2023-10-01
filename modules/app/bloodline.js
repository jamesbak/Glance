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
import DateTime from "./dateTime.js";

const dateTime = new DateTime();

let largeGraphHigh = document.getElementById("largeGraphHigh");
let largeGraphLow = document.getElementById("largeGraphLow");

let largeGraphTimeStart = document.getElementById("largeGraphTimeStart");
let largeGraphTimeMiddle = document.getElementById("largeGraphTimeMiddle");
let largeGraphTimeEnd = document.getElementById("largeGraphTimeEnd");

let meanNumber = document.getElementsByClassName("mean");
let highLine = document.getElementsByClassName("highLine");
let meanLine = document.getElementsByClassName("meanLine");
let lowLine = document.getElementsByClassName("lowLine");

let largeGraphGraphPoints = document.getElementsByClassName("largeGraphGraphPoints");
    
export default class bloodline { 
  update(bloodsugars, high, low, settings, timeFormat) {
    let isMmol = settings.glucoseUnits === 'mmol';
    
    console.log('app - bloodline - update()');
    let reverseBloodsugars = bloodsugars.reverse();
   
    let ymin = low;
    let ymax = high;
    let height = 100;
    // map all sgv to an array then filter out LOS values
    let sgvArray = reverseBloodsugars.map(bg => bg.sgv).filter(bg => bg !== 'LOS');  
    const currentHighestBg = Math.max(...sgvArray);
    const currentLowBg = Math.min(...sgvArray);
    if(currentHighestBg >= 400) {
      ymax = 340;
    }
    if(currentHighestBg >= 350 && currentHighestBg < 400) {
      ymax = 300;
    }
    if(currentHighestBg >= 300 && currentHighestBg < 350) {
      ymax = 270;
    }
    if(currentHighestBg >= 250 && currentHighestBg < 300) {
      ymax = 260;
    }
    if(currentHighestBg >= 220 && currentHighestBg < 250) {
      ymax = 220;
      if( high >= 220) {
        ymax = 250;
      }
    }   
    if(currentHighestBg >= 160 && currentHighestBg < 220) {
      ymax = 180;
       if( high >= 220) {
         ymax = 240;
       }
    }     
    if(currentLowBg < 60) {
      ymin = 60;
    }
    if(currentLowBg < 50) {
      ymin = 50;
    }
    if(currentLowBg < 40) {
      ymin = 40;
    }
    
    let highY = (height - (height * (Math.round(((high - ymin) / (ymax - ymin)) * 100) / 100)));
    let lowY = (height - (height * (Math.round(((low - ymin) / (ymax - ymin)) * 100) / 100)));
    highLine[0].y1 = highY;
    highLine[0].y2 = highY;
    meanLine[0].y1 = (highY + lowY)/2;
    meanLine[0].y2 = (highY + lowY)/2;
    lowLine[0].y1 = lowY;
    lowLine[0].y2 = lowY;
    
    largeGraphHigh.y = highY - 3;
    largeGraphLow.y = lowY - 3; 

    largeGraphTimeStart.y = lowY + 14;
    largeGraphTimeMiddle.y = lowY + 14;
    largeGraphTimeEnd.y = lowY + 14;
    
    let tempHigh = high;
    let tempLow = low; 
    let tempMean = (high + low)/2;
    if (isMmol) {
      tempHigh =  mmol(tempHigh);
      tempLow =  mmol(tempLow);
    }
    
    largeGraphHigh.text = tempHigh;
    largeGraphLow.text = tempLow;

    largeGraphTimeStart.text = dateTime.getTime(reverseBloodsugars[0].datetime, timeFormat);
    largeGraphTimeMiddle.text = dateTime.getTime(reverseBloodsugars[Math.floor(reverseBloodsugars.length / 2)].datetime, timeFormat);
    largeGraphTimeEnd.text = dateTime.getTime(reverseBloodsugars[reverseBloodsugars.length - 1].datetime, timeFormat);

    // 47 loops 
    for (let index = 0; index < reverseBloodsugars.length; index++) {
      if(reverseBloodsugars[index].sgv === 'LOS') {
        largeGraphGraphPoints[index].style.opacity = 0;
      } else {
        largeGraphGraphPoints[index].style.opacity = 1;
        let pointY = (height - (height * (Math.round(((reverseBloodsugars[index].sgv - ymin) / (ymax - ymin)) * 100) / 100)));
        //  - TODO: compare time of current sgv to time of last sgv and make sure its equal 5m if not add spacing
        largeGraphGraphPoints[index].cy = pointY;
        largeGraphGraphPoints[index].style.fill = "#708090"; // gray
        //  - check sgv point is in range if not change color 
        if(reverseBloodsugars[index].p) {
          largeGraphGraphPoints[index].style.fill = "#f76ac5"; // pink   
        } else if (parseInt(reverseBloodsugars[index].sgv, 10) <= low){
          //- INFO: largeGraphGraphPoints has to be at the 22 index becase it is ALL the points on both graphs combined
          largeGraphGraphPoints[index].style.fill = "#de4430"; //red
        } else if ( parseInt(reverseBloodsugars[index].sgv, 10) >= high) {
          largeGraphGraphPoints[index].style.fill = "orange"; // orange 
          if ( parseInt(reverseBloodsugars[index].sgv, 10) >=  (parseInt(high) + 35)) {
             largeGraphGraphPoints[index].style.fill = "#de4430"; // red 
          }
        } else {
          largeGraphGraphPoints[index].style.fill = "#75bd78"; // green 
        }
      }
    }     
    reverseBloodsugars.reverse();
  }
};

// converts a mg/dL to mmoL
function mmol(bg , roundToHundredths) {
   let mmolBG = (Math.round((bg / 18) * 10) / 10).toFixed(1); 
  return mmolBG;
}

// converts mmoL to  mg/dL 
function  mgdl( bg ) {
  let mgdlBG =(Math.round(bg * 18.018).toFixed(0));
  return mgdlBG;
}
