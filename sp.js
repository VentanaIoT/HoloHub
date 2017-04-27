//SerialPorts
var SerialPorts = require('serialport');

var portName = '/dev/tty.HC-06-DevB'
var portConfig = {
	baudRate: 9600,
	parser: SerialPorts.parsers.readline("\n")
};


const COUNTVALUES = 10;
const SMOOTHING = 35;
//var runningXAverage;
//var runningYAverage;
//var runningZAverage;
var initial = true;
var runningXAverage = queue(COUNTVALUES);
var runningYAverage = queue(COUNTVALUES);
var runningZAverage = queue(COUNTVALUES);



function parseData(data){
  var xyz = data.split(" ");
  if(xyz.length != 3){
      return null
  }
  for(var i=xyz.length; i--;){
      if(isNaN(xyz[i])){
          return null
      }
      xyz[i] = parseFloat(xyz[i]);
      if(isNaN(xyz[i])){
          return null
      }
  } 
  return xyz
}

function queue(len) {
    var ret = [];

    ret.push = function(a) {
        if(ret.length == len) ret.shift();
        return Array.prototype.push.apply(this, arguments);
    };

    return ret;
}

function smoothArray(values){
  var value = values[0]; // start with the first input
  for (var i=1, len=values.length; i<len; ++i){
    var currentValue = values[i];
    value += (currentValue - value) / SMOOTHING;
    values[i] = Math.round(value * 1000) / 1000;
  }
  return values
}

var sp = new SerialPorts(portName, portConfig);
sp.on("open", function () {
  console.log('open');
  sp.on('data', function(data) {
      if(data != ""){
          try{
            coordinate = parseData(data);
            if(coordinate != null){
                console.log('data received: ' + data);
                //If initial sample <10 samples
                //if(initial == true){
                    runningXAverage.push(Math.round(coordinate[0] * 1000) / 1000);
                    runningYAverage.push(Math.round(coordinate[1] * 1000) / 1000);
                    runningZAverage.push(Math.round(coordinate[2] * 1000) / 1000);
                    //initial = false;
                //}
                //Else, begin smoothing
                //else{
                    runningXAverage = smoothArray(runningXAverage);    //Parse X value to INT
                    runningYAverage = smoothArray(runningYAverage);
                    runningZAverage = smoothArray(runningZAverage);
                    
                    // console.log("X Smoothing: " + runningXAverage);
                    // console.log("Y Smoothing: " + runningYAverage);
                    // console.log("Z Smoothing: " + runningZAverage);

                    var result = runningXAverage[runningXAverage.length-1] + ' ' + runningYAverage[runningYAverage.length-1] + ' ' + runningZAverage[runningZAverage.length-1];
                    
                    console.log(result);
                    data = {'1': result}
                    
                    //io.emit("position", data);
                //}
            }
          }
          finally{
            //Do nothing
          }
      }
  });
});