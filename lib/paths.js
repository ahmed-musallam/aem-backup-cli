const path = require('path')
const currPath = process.cwd()
const crxQuickstart = 'crx-quickstart'
const backupFolderName = `${crxQuickstart}.backups`

/**
 * A utility that returns paths we use for this app
 * EVERY method returns a string path
 */
module.exports = class Paths {
  static get backup () {
    return path.join(currPath, backupFolderName)
  }
  static get quickstart () {
    return path.join(currPath, crxQuickstart)
  }
  static get backupExt () {
    return '.tar'
  }
  static getNamedBackup (name) {
    return path.join(Paths.backup, name + Paths.backupExt)
  }
}
