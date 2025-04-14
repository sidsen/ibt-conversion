require('regenerator-runtime/runtime')

const telemetryLib = require('ibt-telemetry')
const fs = require('fs')

// Default paths to input IBT and output CSV files (following upstream repo)
let pathToIbt = './telemetry_file.ibt'
let outputPath = './output.csv'
let logSample = false
let logSessionInfo = false
let params = []
const commentPrefix = "# "

var argv = require('minimist')(process.argv.slice(2))

if (argv.params && argv.params !== '') {
    params = argv.params.split(',')
}
if (argv.pathToIbt && argv.pathToIbt !== '') {
    pathToIbt = argv.pathToIbt
    // If an input path is provided, reuse the filename for the output path
    outputPath = pathToIbt.replace('.ibt', '.csv')
}
if (argv.logSessionInfo && argv.logSessionInfo !== '') {
    logSessionInfo = argv.logSessionInfo
}
if (argv.logSample && argv.logSample !== '') {
    logSample = argv.logSample
}

// Change this list manually (for now) if you want to change the params output in the CSV
const defaultParams = ['Speed','Throttle','Brake','Clutch','Gear','RPM','LapDistPct','LapDist','Lap','LapBestLap','LapBestLapTime','TrackTemp','PlayerCarTeamIncidentCount','PlayerCarMyIncidentCount','PlayerCarDriverIncidentCount','Lat','Lon','SteeringWheelAngle','FuelLevel']
if (params.length === 0) {
    params = defaultParams
}

console.log('Generating CSV using the following params:')
console.log(params)

let csvString = "";
const telemetry = telemetryLib.Telemetry.fromFile(pathToIbt).then((promisedData) => {
    // If requested, include the session information as a comment at the top of 
    // the CSV file
    if (logSessionInfo) {
        // Write the session information as a comment at the top of the CSV file
        // Print the session information
        csvString += JSON.stringify(promisedData.sessionInfo).replace(/^/gm, commentPrefix);
        csvString += "\n";
    }

    // Write the column headers
    csvString += params.toString() + "\n";
    let index = 0
    for (sample of promisedData.samples()) {
        if (logSample && index == 1) {
            console.log('Logging single sample:')
            console.log(sample.toJSON())
        }
        let current = [];
        for (paramIndex in params) {
            param = sample.getParam(params[paramIndex]);
            if (param !== null && typeof param !== undefined) {
                current.push(param.value)
            } else {
                current.push('')
            }
        }
        csvString += current.toString() + "\n"
        index++
    }
    fs.writeFile(outputPath, csvString, err => {
        if (err) {
            console.error(err)
            return
        }
        //  File written successfully
     })
     console.log('CSV successfully created.')
})
