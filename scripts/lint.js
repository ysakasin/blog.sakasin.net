"use strict";
const TextLintEngine = require("textlint").TextLintEngine;
const path = require("path");
const fs = require("fs");

const options = {
  rulePaths: [`${__dirname}/..`]
};

function lintFiles(filePathList) {
  const engine = new TextLintEngine(options);
  return engine.executeOnFiles(filePathList).then(function(results) {
    if (engine.isErrorResults(results)) {
      const output = engine.formatResults(results);
      console.log(output);
    } else {
      console.log("All Passed!");
    }
  });
}

const excludes = [
  "2013-01-25-save-the-earth.md",
  "2013-03-18-sao-utils.md",
  "2013-04-01-amazon-student.md",
  "2013-04-26-atmega328p.md",
  "2013-10-26-android-layout.md",
  "2015-12-10-write-a-report-with-markdown.md",
  "2015-12-15-making-bootstrap-umi.md",
  "2016-08-04-gift-from-gitlab.md",
  "2016-12-12-kosen10s-lt-6.md",
  "2016-12-14-about-denari.md",
  "2016-12-23-cve-ranking.md",
  "2017-03-22-easyctf2017-writeup.md",
  "2017-04-16-fithack-ctf-2017.md",
  "2017-12-10-pthread-mutex.md",
  "2017-12-21-tsukuba-gc-lite.md",
];

fs.readdir(`${__dirname}/../_posts`, function(err, files) {
  if (err) {
    throw err;
  }

  const filtered = files.filter(f => !excludes.includes(f));
  const resolved = filtered.map(f => path.resolve(`${__dirname}/../_posts`, f));

  lintFiles(resolved).catch(function(error) {
    console.error(error);
    process.exit(1);
  });
});
