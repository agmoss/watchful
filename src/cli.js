'use strict'

import fs from 'fs'
import arg from 'arg'
import inquirer from 'inquirer'
import chalk from 'chalk'
import clear from 'clear'
import figlet from 'figlet'
import Table from 'cli-table3'
import logUpdate from 'log-update'
import marked from 'marked'
import TerminalRenderer from 'marked-terminal'
import axios from 'axios'

const isValidUrl = (string) => {
  try {
    new URL(string)
  } catch (e) {
    if (string === 'done') {
      return true
    }
    throw new Error('Not a valid url')
  }
  return true
}

const getHttpStatus = async (url) => {
  try {
    const response = await axios.get(url)
    return response.status
  } catch (error) {
    throw new Error(`Could not get status of: ${url}`)
  }
}

const urlChecker = async (urls) => {
  try {
    const promises = urls.map(async url => {
      const status = await getHttpStatus(url)
      return [url, status]
    })
    const results = await Promise.all(promises)
    return results
  } catch (error) {
    console.log(error.message)
    return process.exit(1)
  }
}

const getOpts = (inputArgs) => {
  const args = arg({
    '--man': Boolean,
    '-m': '--man'
  }, {
    argv: inputArgs.slice(2)
  })
  return {
    man: args['--man'] || false
  }
}

const collectInputs = async (inputs = []) => {
  const urlQuestion = {
    type: 'input',
    name: 'url',
    message: 'Enter a url to check: ',
    validate: isValidUrl
  }

  const answer = await inquirer.prompt(urlQuestion)
  const newInputs = [...inputs, answer]

  while (answer.url !== 'done') {
    return collectInputs(newInputs)
  }

  const requestRateQuestion = {
    type: 'list',
    name: 'requestRate',
    message: 'Request rate (minutes)',
    choices: [1, 5, 10, 15, 30],
    default: 1
  }

  const requestRate = await inquirer.prompt(requestRateQuestion)

  newInputs.push(requestRate)

  return newInputs.filter(input => {
    return input.url !== 'done'
  })
}

const header = () => {
  console.log(
    chalk.green(
      figlet.textSync('Watchful', {
        font: 'Standard',
        horizontalLayout: 'controlled smushing',
        verticalLayout: 'controlled smushing'
      })
    )
  )
}

/**
 * Main
 *
 */
export async function cli (args) {
  clear()

  const opts = getOpts(args)

  if (opts.man === true) {
    clear()

    marked.setOptions({
      renderer: new TerminalRenderer()
    })

    header()

    console.log('')

    fs.readFile('./README.md', 'utf8', function (err, data) {
      if (err) throw err
      console.log(marked(data))
    })

    return
  }

  clear()

  header()

  console.log('Type "done" to proceed')
  console.log('')

  const inputs = await collectInputs()

  clear()

  const urls = inputs.filter(input => {
    return input.url
  }).map(opt => {
    return opt.url
  })

  const requestRate = inputs.find(opt => {
    return opt.requestRate
  }).requestRate

  const asyncIntervals = []

  const runAsyncInterval = async (cb, interval, intervalIndex) => {
    await cb()
    if (asyncIntervals[intervalIndex]) {
      setTimeout(() => runAsyncInterval(cb, interval, intervalIndex), interval)
    }
  }

  const setAsyncInterval = (cb, interval) => {
    if (cb && typeof cb === 'function') {
      const intervalIndex = asyncIntervals.length
      asyncIntervals.push(true)
      runAsyncInterval(cb, interval, intervalIndex)
      return intervalIndex
    } else {
      throw new Error('Callback must be a function')
    }
  }

  var table = new Table({
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: '',
      'left-mid': '',
      mid: '',
      'mid-mid': '',
      right: ' ',
      'right-mid': '',
      middle: ''
    },
    wordWrap: false
  })

  const frames = ['-', '\\', '|', '/']
  const requestEvery = requestRate * 60
  const updateEvery = 0.1
  let i = 0
  let x = 0
  let j = requestEvery
  let results = await urlChecker(urls)
  let updating = true

  setAsyncInterval(async () => {
    x++
    const frame = frames[x % frames.length]

    table.length = 0

    i += updateEvery
    j -= updateEvery

    if (Math.round(i) % requestEvery === 0) {
      i = Math.ceil(i) + 1
      updating = true
      j = requestEvery

      urlChecker(urls).then((done) => {
        results = done
        updating = false
      })
    }

    table.push([{
      colSpan: 2,
      content: `${frame} Watchful ${frame}`,
      hAlign: 'center'
    }])

    table.push([{
      colSpan: 2,
      content: '',
      hAlign: 'center'
    }])

    table.push([{
      colSpan: 1,
      content: 'Next update:',
      hAlign: 'left'
    }, {
      colSpan: 1,
      content: `${updating === true ? chalk.blue('now') : j > 60 ? Math.round(j / 60) + ' min' : Math.round(j)}`,
      hAlign: 'right'
    }])

    table.push([{
      colSpan: 2,
      content: '',
      hAlign: 'center'
    }])

    table.push([{
      colSpan: 1,
      content: chalk.blue('Url'),
      hAlign: 'left',
      vAlign: 'top'
    }, {
      colSpan: 1,
      content: chalk.blue('Status'),
      hAlign: 'right',
      vAlign: 'top'
    }])

    results.map(result => {
      const url = result[0]
      let status = result[1]

      if (status >= 100 && status < 200) {
        // Informational
        status = chalk.bgWhite.black(status)
      } else if (status >= 200 && status < 300) {
        // Success
        status = chalk.green(status)
      } else if (status >= 400 && status < 500) {
        // Client Error
        status = chalk.red(status)
      } else {
        // Server Error
        status = chalk.bgRed.black
      }
      table.push([{
        colSpan: 1,
        content: url,
        hAlign: 'left',
        vAlign: 'bottom'
      }, {
        colSpan: 1,
        content: status,
        hAlign: 'right',
        vAlign: 'bottom'
      }])
    })

    logUpdate(table.toString())
  }, updateEvery * 1000)
}
