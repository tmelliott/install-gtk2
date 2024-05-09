import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as io from '@actions/io'
import * as path from 'path'

type Config = {
  url: string
  gtkpath: string
}[]

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // skip if not Windows
    // if (process.platform !== 'win32') {
    //   core.info('This action is only supported on Windows.')
    //   return
    // }

    // comma-separated, optional spaces
    const arch = core.getInput('arch')
    const gtkDir = core.getInput('gtk_dir')
    const config: Config = []

    const arch32: boolean = arch.includes('32')
    const arch64: boolean = arch.includes('64')
    if (arch32) {
      config.push({
        url: 'https://ftp.gnome.org/pub/gnome/binaries/win32/gtk+/2.22/gtk+-bundle_2.22.1-20101227_win32.zip',
        gtkpath: path.join(gtkDir, 'i386')
      })
    }
    if (arch64) {
      config.push({
        url: 'https://ftp.gnome.org/pub/gnome/binaries/win64/gtk+/2.22/gtk+-bundle_2.22.1-20101229_win64.zip',
        gtkpath: path.join(gtkDir, 'x64')
      })
    }

    await Promise.all(
      config.map(async ({ url, gtkpath }) => {
        await core.group(`Downloading ${url} to ${gtkpath}`, async () => {
          core.info(`Downloading ${url} ...`)
          const dlpath = await tc.downloadTool(url)
          core.info(`Extracting ${dlpath} ...`)
          const extractionPath = await tc.extractZip(dlpath)
          core.info(`Moving ${extractionPath} to ${gtkpath} ...`)
          await io.mv(extractionPath, gtkpath)
        })
      })
    )

    // add to PATH
    core.info('Adding GTK to PATH...')
    const paths = config.map(({ gtkpath }) => gtkpath)
    core.addPath(paths.join(path.delimiter))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
