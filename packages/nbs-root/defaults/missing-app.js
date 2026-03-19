"use strict";

function MissingApp() {
  throw new Error(
    'Missing app entry. Create "src/App.js" or set NBS_APP_MODULE to your React app module.',
  );
}

module.exports = {
  App: MissingApp,
  default: MissingApp,
};
