'use strict';

import fs from 'fs';
import arg from 'arg';
import inquirer from 'inquirer';
import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import Table from 'cli-table3';
import logUpdate from 'log-update';
import marked from 'marked';
import TerminalRenderer from 'marked-terminal';

import urlChecker from "./main";


const getOpts = (inputArgs) => {
    const args = arg({
        '--man': Boolean,
        '-m': '--man',
    }, {
        argv: inputArgs.slice(2),
    });
    return {
        man: args['--man'] || false,
    };
}


const collectInputs = async (inputs = []) => {
    const prompts = {
        type: 'input',
        name: `url`,
        message: 'Enter a url to check: '
    }

    console.log('Type "done" to proceed')
    console.log('')

    const answer = await inquirer.prompt(prompts);
    const newInputs = [...inputs, answer];

    while (answer.url !== 'done') {
        return collectInputs(newInputs)
    }
    return newInputs.filter(input => {
        return input.url !== 'done'
    })
};


export async function cli(args) {


    let opts = getOpts(args);

    if (opts.man === true) {

        clear();

        marked.setOptions({
            renderer: new TerminalRenderer()
        });

        console.log(
            chalk.green(
                figlet.textSync('Two Hundred 200', {
                    font: 'Standard',
                })
            )
        );

        console.log('')

        fs.readFile('./README.md', 'utf8', function (err, data) {
            if (err) throw err;
            console.log(marked(data))
        });


        return;
    }

    clear();

    console.log(
        chalk.green(
            figlet.textSync('Two Hundred 200', {
                font: 'Standard',
            })
        )
    );

    let inputs = await collectInputs();

    clear();

    const urls = inputs.map(input => {
        return input.url
    })

    var table = new Table({
        style: {
            head: [],
            border: []
        }
    });


    const asyncIntervals = [];

    const runAsyncInterval = async (cb, interval, intervalIndex) => {
        await cb();
        if (asyncIntervals[intervalIndex]) {
            setTimeout(() => runAsyncInterval(cb, interval, intervalIndex), interval);
        }
    };

    const setAsyncInterval = (cb, interval) => {
        if (cb && typeof cb === "function") {
            const intervalIndex = asyncIntervals.length;
            asyncIntervals.push(true);
            runAsyncInterval(cb, interval, intervalIndex);
            return intervalIndex;
        } else {
            throw new Error('Callback must be a function');
        }
    };


    const frames = ['-', '\\', '|', '/'];
    let i = 0;
    let results = [];
    results = await urlChecker(urls);

    setAsyncInterval(async () => {

        i++;

        const frame = frames[i % frames.length];

        table.length = 0;

        table.push([{
            colSpan: 2,
            content: `${frame} TwoHundred ${frame}`,
            hAlign: 'center'
        }])

        table.push(['Url', 'Status'])

        if (i % 60 === 0) {
            results.length = 0;
            results = await urlChecker(urls);
        }

        results.map(result => {

            const url = result[0];
            let status = result[1];

            if (status >= 100 && status < 200) {
                // Informational
                status = chalk.bgWhite.black(status);
            } else if (status >= 200 && status < 300) {
                // Success 
                status = chalk.green(status);
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

    }, 500);

}