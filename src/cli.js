import arg from 'arg';
import inquirer from 'inquirer';
import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import urlChecker from "./main";
import Table from 'cli-table3';
import logUpdate from 'log-update';


const collectInputs = async (inputs = []) => {
    const prompts = {
        type: 'input',
        name: `url`,
        message: 'Enter a url to check: '
    }

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

    clear();
    console.log(
        chalk.green(
            figlet.textSync('TwoHundred', {
                horizontalLayout: 'full'
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

    setAsyncInterval(async () => {

        const frame = frames[i = ++i % frames.length];

        let results = [];
        table.length = 0;

        table.push([{
            colSpan: 2,
            content: `${frame} TwoHundred ${frame}`
        }])

        table.push(['Url', 'Status'])

        results = await urlChecker(urls);

        results.map(result => {
            table.push(result)
        })

        logUpdate(table.toString())

    }, 1000);

}