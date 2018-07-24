[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
# aem-backup-cli
A Developer CLI utility to backup local AEM instances, and save lives!

> If you like this utility, please consider starring 🤩 to let me know you like it!

> windows users: let me know if it works on windows 😅


<p align="center">
  <br>
  <img src="screenshot.svg">
  <br>
</p>

## About
If you're an AEM dev, you understand the **frustration** of a broken AEM instance during development. This CLI will backup your instance so you can restore it at any time!

## How it works
Consider this AEM instance directory structure:

```
|-- aem-instance-directory       # The AEM instance directory
    |-- quickstart.jar
    |-- crx-quickstart
    |-- license.properties
    |-- crx-quickstart.backup    # folder added by aem-backup-cli
        |-- some-backup.tar      # sample user-generated backup  
        |-- another-backup.tar   # another sample user-generated backup 
```
> Moving forward, I will be referring to `aem-instance-directory` above as the "AEM instance Directory"

Using the [`node-tar`](https://github.com/npm/node-tar) module, this CLI creates a [tar](https://en.wikipedia.org/wiki/Tar_(computing)) archive (tarball) of the `crx-quickstart` folder and saves the resulting tar into a sibling folder called `crx-quickstart.backups`.

Please note:

- Since this is a **filesystem** backup, the AEM instance **must** be completely shutdown.
- This CLI does not perform compression, as it's aimed for speed not saving disk space.

## Install and Usage

```console
# install the cli (adds 'aemb' to the command line)

$ npm install -g aem-backup-cli
```
```console
# before running `aemb`, make sure you `cd` into  your
# AEM instance directory (`aem-instance-directory` from above)

$ aemb
```
Interactive cli is now open! typing `help` generates:

```console
aemb$ help

  Commands:

    help [command...]              Provides help for a given command.
    exit                           Exits application.
    backup [options] [backupName]  Archive crx-quickstart in current directory and move archive to crx-quickstart.backups folder in current directory
    list                           List all available backups
    delete [options]               Delete a backup from available backups
    restore [options]              Restore a backup from a list of available backups
```

### Examples

```console
# create backup named my-first-backup
aemb$ backup my-first-backup
```

```console
# List available backups
aemb$ list
```
```console
# restore a backup from a list of backups
aemb$ restore
```
```console
# delete a backup from a list of backups
aemb$ delete
```

## Interacting with `crx-quickstart.backups` folder
You can **manually** add/remove/rename backup tars to your hearts content. you can also safely remove the whole folder if you no longer need it.

 
