var kue = require("kue");
var Queue = kue.createQueue();

let scheduleJob = data => {
  Queue.createJob('every',data.jobName, data.params,{timezone : 'Asia/Kolkata'})
    .attempts(3)
    .delay(data.time - Date.now()) // relative to now.
    .save();
};

module.exports = {
  scheduleJob
};