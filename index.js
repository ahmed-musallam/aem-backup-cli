#!/usr/bin/env node
/**
 * credit: https://www.sitepoint.com/javascript-command-line-interface-cli-node-js/
 */
const bfs = require('./lib/fs')
const vorpal = require('vorpal')()
const ora = require('ora')
const colors = require('colors')
const art = require('./lib/art')

/**
 * Run initialization stuff
 */
console.log(art.green)
console.log('Please make sure your AEM instance is completely shutdown before using ANY of the CLI commands'.bold.yellow)

/**
 * BACKUP
 */
vorpal
  .command('backup [backupName]', 'Archive crx-quickstart in current directory and move archive to crx-quickstart.backups folder in current directory')
  .alias('ba')
  .option('-f, --force', 'Force backup overwrite.')
  .validate(function (args) {
    if (args.backupName) return true
    else return '*tsk tsk*, you need to specify a name for the backup'
  })
  .action(function (args, finishAction) {
    const spinner = ora('').start().info('checking if backup already exists')
    const name = args.backupName
    const exists = bfs.backupExists(name)
    const force = args.options.force
    let backupSize = 0
    // prepare a reusable function to be called when we need to backup
    const backItUp = () => {
      spinner
        .start()
        .succeed('One backup coming right up!'.green)
        .start('back it up...')
      return bfs
        .createBackup(name, {
          onEntry: (path, stat) => {
            if(!spinner.isSpinning) spinner.start();
            const size = stat.size ? stat.size : 0
            backupSize += size
            spinner.text = `[${bfs.formatBytes(backupSize)}]`.magenta + ` Backing up ${path}`.green
          }
        })
        .then(() => {
          spinner.succeed(`[${bfs.formatBytes(backupSize)}] All backed up! We have a lift off!`.green)
          finishAction()
        })
        .catch(err => {
          spinner.fail('womp womp... some error occured *rolls eyes*'.red)
          throw err
        })
    }
    if (exists) {
      if (force) { // backup exists and  force overwrite. back it up!
        spinner
          .start()
          .info(`it does!, and you've chosen to force overwrite.`)
          .start()
          .info('Attempting to remove old backup')
        bfs
          .removeBackup(name)
          .then(() => {
            spinner
              .start()
              .succeed('Removed old backup')
          })
          .catch((err) => {
            spinner
              .start()
              .fail('uh oh... that pesky backup refuses to be removed.'.red)
            throw err
          })
        backItUp()
      } else { // backup exists, no overwrite
        spinner
          .start()
          .fail('it does... but we cant ovewrite it. You have to use -f to force overwrite'.red)
        finishAction()
      }
    } else { // backup does not exists, back it up!
      spinner
        .start()
        .succed('it does not'.red)
      backItUp()
    }
  })

/**
 * LIST
 */
vorpal
  .command('list', 'List all available backups')
  .alias('ls')
  .action(function (args, actionFinished) {
    const backups = bfs.listBackups()
    if (backups && backups.length) {
      backups.forEach(file => {
        this.log(`  - ${file.green.bold}`)
      })
      actionFinished()
    } else {
      this.log(`No backups found`.bold.red)
      actionFinished()
    }
  })

/**
 * DELETE
 */
vorpal
  .command('delete', 'Delete a backup from available backups')
  .alias('de')
  .option('-f, --force', 'Force restore.')
  .action(function (args, actionFinished) {
    const backups = bfs.listBackups()
    if (backups || backups.length > 0) {
      this.prompt(
        [{
          type: 'list',
          name: 'backupName',
          default: false,
          message: 'Please pick a backup to delete'.bold.yellow,
          choices: backups
        }, {
          type: 'confirm',
          name: 'shouldDelete',
          message: `Still wanna do it? just checkin'...`,
          default: false,
          when: () => !args.options.force
        }]
      ).then(answers => {
        if (!answers.shouldDelete) {
          console.log(`Whew, nothing happened. That must feel good, eh?`.green)
          actionFinished()
          return
        }
        const spinner = ora('Attempting to delete backup').start().info().start()
        bfs.removeBackup(args.backupName).then(() => {
          spinner.succeed(`deleted!`.green)
          actionFinished()
        }).catch(err => {
          spinner.fail(`um, yeah, we could't delete the backups for some reason`.red)
          throw err
        })
      })
    } else {
      this.log('oh no! There are no backups available. try creating one :)'.bold.red)
    }
  })

/**
 * RESTORE
 */
vorpal
  .command('restore', 'Restore a backup from a list of available backups')
  .alias('re')
  .option('-f, --force', 'Force restore.')
  .action(function (args, actionFinished) {
    const backups = bfs.listBackups()
    if (backups || backups.length > 0) {
      this.prompt(
        [{
          type: 'list',
          name: 'backupName',
          default: false,
          message: 'Please pick a backup to restore \n' + 'WARNING: this will replace existing crx-quickstart folder'.bold.yellow,
          choices: backups
        }, {
          type: 'confirm',
          name: 'shouldRestore',
          message: 'This action will wipe your current crx-quickstart folder, are you sure you want to continue?',
          default: false,
          when: () => !args.options.force
        }]
      ).then(answers => {
        if (!answers.shouldRestore) {
          console.log(`Whew, nothing happened. That must feel good, eh?`.green)
          actionFinished()
          return
        }
        const spinner = ora('Cleaning crx-quickstart').start().info().start()
        let restoreSize = 0
        bfs.restoreBackup(answers.backupName, {
          cleanSuccess: () => spinner.start().succeed('crx-quickstart cleaned!').start(),
          cleanFail: () => spinner.start().fail('crx-quickstart could not be cleaned :( please make sure your AEM instance is shutdown'.red),
          restoreSuccess: () => {
            spinner.start().succeed('Restored!')
            actionFinished()
          },
          restoreFail: () => spinner.start().fail(`whoops.. something went wrong while restoring... maybe check if the galaxy's are aligned? or the error log :)`.red),
          onEntry: (entry) => {
            if(!spinner.isSpinning) spinner.start();
            const size = entry.size ? entry.size : 0
            restoreSize += size
            spinner.text = `[${bfs.formatBytes(restoreSize)}]`.magenta + `Restoring ${entry.path}`.green
          }
        })
      })
    } else {
      this.log('oh no! There are no backups available. try creating one :)'.bold.red)
    }
  })

vorpal
  .delimiter('aemb$')
  .show()
