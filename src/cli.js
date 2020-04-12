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

/**
 * Determine if string is a valid url
 *
 * @param  {string} string string to evaluate
 * @return {boolean} true if valid url
 */
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

/**
 * Get the HTTP status code of a url
 *
 * @param  {string} url Link to get status of
 * @return {number} HTTP status of the link
 */
const getHttpStatus = async (url) => {
  try {
    const response = await axios.get(url)
    return response.status
  } catch (error) {
    if (error.response) {
      console.log(error.response.data)
      console.log(error.response.status)
      console.log(error.response.headers)
      return error.response.status
    }
    throw new Error(`Could not get status of: ${url}`)
  }
}

/**
 * Add two numbers together
 *
 * @param  {string[]} urls Links to check
 * @return {string[][]} results
 */
const urlChecker = async (urls) => {
  const promises = urls.map(async url => {
    const status = await getHttpStatus(url)
    return [url, status]
  })
  const results = await Promise.all(promises)
  return results
}

/**
 * Add two numbers together
 *
 * @param  {string[]} inputArgs cli args passed to the program
 * @return {Object} parsed opts
 */
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

/**
 * Recursively get urls to test from the user
 *
 * @param  {string[]} [inputs=[]] cli args passed to the program
 * @return {{url:string}[]} input urls
 */
const collectInputs = async (inputs = []) => {
  const prompt = {
    type: 'input',
    name: 'url',
    message: 'Enter a url to check: ',
    validate: isValidUrl
  }

  const answer = await inquirer.prompt(prompt)
  const newInputs = [...inputs, answer]

  while (answer.url !== 'done') {
    return collectInputs(newInputs)
  }
  return newInputs.filter(input => {
    return input.url !== 'done'
  })
}

/**
 * Main
 *
 * @param  {string[]} args raw input to the program
 * @return {Promise<void>}
 */
export async function cli (args) {
  const opts = getOpts(args)

  if (opts.man === true) {
    clear()

    marked.setOptions({
      renderer: new TerminalRenderer()
    })

    console.log(
      chalk.green(
        figlet.textSync('Two Hundred', {
          font: 'Standard',
          horizontalLayout: 'controlled smushing',
          verticalLayout: 'controlled smushing'
        })
      )
    )

    console.log('')

    fs.readFile('./README.md', 'utf8', function (err, data) {
      if (err) throw err
      console.log(marked(data))
    })

    return
  }

  clear()

  console.log(
    chalk.green(
      figlet.textSync('Two Hundred', {
        font: 'Standard',
        horizontalLayout: 'controlled smushing',
        verticalLayout: 'controlled smushing'
      })
    )
  )

  console.log('Type "done" to proceed')
  console.log('')

  const inputs = await collectInputs()

  clear()

  const urls = inputs.map(input => {
    return input.url
  })

  var table = new Table({
    style: {
      head: [],
      border: []
    }
  })

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

  const frames = ['-', '\\', '|', '/']
  let i = 0
  let results = []
  results = await urlChecker(urls)

  setAsyncInterval(async () => {
    i++

    const frame = frames[i % frames.length]

    table.length = 0

    table.push([{
      colSpan: 2,
      content: `${frame} TwoHundred ${frame}`,
      hAlign: 'center'
    }])

    table.push(['Url', 'Status'])

    if (i % 60 === 0) {
      results.length = 0
      results = await urlChecker(urls)
    }

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
      table.push([url, status])
    })

    logUpdate(table.toString())
  }, 500)
}
