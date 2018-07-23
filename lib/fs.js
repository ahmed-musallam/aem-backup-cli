const paths = require('./paths')
const fs = require('fs-extra')
const tar = require('tar')

/**
 * A utility that handles file system work
 */
module.exports = class FileSystem {
  static exists (path) {
    try {
      // yup, shamelessly using a syncronous method; it makes sense in this case :)
      fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK)
      return true
    } catch (err) {
      return false
    }
  }
  static quickstartExists () {
    return FileSystem.exists(paths.quickstart)
  }
  static backupExists (name) {
    return FileSystem.exists(paths.getNamedBackup(name))
  }
  static ensureBackupFolder () {
    fs.ensureDirSync(paths.backup)
  }
  /**
   * empties the crx-quickstart folder
   */
  static cleanQuickstart () {
    return fs.emptyDir(paths.quickstart)
  }
  /**
   * Deletes a backup
   * @param {string} name - the name of the backup
   */
  static removeBackup (name) {
    FileSystem.ensureBackupFolder()
    return fs.remove(paths.getNamedBackup(name))
  }
  /**
   * credit: https://stackoverflow.com/a/18650828/5633515
   * @param {number} bytes
   * @param {number} decimals
   */
  static formatBytes (bytes, decimals) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals || 2
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }
  /**
   * Get names of available backups
   */
  static listBackups () {
    FileSystem.ensureBackupFolder()
    let backups = fs.readdirSync(paths.backup)
    if (backups) return backups.filter(f => f.endsWith(paths.backupExt)).map(f => f.slice(0, -4))
    else return []
  }
  /**
   * Create new backup
   * @param {string} name backup name to create
   * @param {Object} opts - options Object
   * @param {string} opts.onEntry - called for every path being backedup, mainly for logging purposes
   */
  static createBackup (name, opts) {
    FileSystem.ensureBackupFolder()
    const noop = () => {}
    opts = Object.assign({}, {
      onEntry: noop
    }, opts)
    return tar.c(
      {
        file: paths.getNamedBackup(name),
        filter: (path, stat) => {
          opts.onEntry(path, stat)
          return true // make sure ALL files are included
        }
      },
      ['crx-quickstart']
    )
  }
  /**
   * Restore a backup
   * @param {string} name - the backup name to be restored
   * @param {Object} opts - options Object
   * @param {string} opts.cleanSuccess - called when cleaning crx-quickstart succeeds
   * @param {string} opts.cleanFail - called when cleaning crx-quickstart fails
   * @param {string} opts.restoreSuccess - called when restore is successful
   * @param {string} opts.restoreFail - called when restore fails
   * @param {string} opts.onEntry - called for every path being restored, mainly for logging purposes
   */
  static restoreBackup (name, opts) {
    FileSystem.ensureBackupFolder()
    const noop = () => {}
    opts = Object.assign({}, {
      cleanSuccess: noop,
      cleanFail: noop,
      restoreSuccess: noop,
      restoreFail: noop,
      onEntry: noop // called for every path being extracted, mainly for logging purposes
    }, opts)

    FileSystem
      .cleanQuickstart()
      .then(() => {
        opts.cleanSuccess()
        tar.x(
          {
            file: paths.getNamedBackup(name),
            onentry: (entry) => opts.onEntry(entry)
          }
        )
          .then(() => opts.restoreSuccess())
          .catch(err => {
            opts.restoreFail()
            throw err
          })
      })
      .catch(err => {
        opts.cleanFail(err)
        throw err
      })
  }
}
